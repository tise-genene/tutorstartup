import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContractStatus,
  ContractMilestoneStatus,
  LedgerEntryType,
  PaymentProvider,
  PaymentStatus,
  UserRole,
} from '../prisma/prisma.enums';

const DEFAULT_CURRENCY = 'ETB';

type UnknownRecord = Record<string, unknown>;

function toInputJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

function toNullableJsonField(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return toInputJsonValue(value) ?? Prisma.JsonNull;
}

function normalizeCurrency(value?: string | null): string {
  const c = (value ?? '').trim().toUpperCase();
  return c.length ? c : DEFAULT_CURRENCY;
}

function safeLower(value: unknown): string {
  if (typeof value === 'string') return value.toLowerCase();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase();
  }
  return '';
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown): UnknownRecord | null {
  return isRecord(value) ? value : null;
}

function getStringField(obj: unknown, key: string): string | undefined {
  const rec = getRecord(obj);
  const value = rec ? rec[key] : undefined;
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;
}

function getNested(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const p of path) {
    const rec = getRecord(cur);
    if (!rec) return undefined;
    cur = rec[p];
  }
  return cur;
}

function extractTxRef(payload: unknown): string | undefined {
  const direct =
    getStringField(payload, 'tx_ref') ?? getStringField(payload, 'trx_ref');
  if (direct) return direct;

  const nested = getNested(payload, ['data', 'tx_ref']);
  return typeof nested === 'string' && nested.trim().length > 0
    ? nested.trim()
    : undefined;
}

function getChapaSignature(headers: Record<string, unknown>): string | null {
  const candidates = [
    headers['x-chapa-signature'],
    headers['X-Chapa-Signature'],
    headers['chapa-signature'],
    headers['Chapa-Signature'],
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) return c.trim();
    if (Array.isArray(c) && typeof c[0] === 'string' && c[0].trim().length > 0)
      return c[0].trim();
  }
  return null;
}

function computeHmacSha256Hex(secret: string, payload: unknown): string {
  return createHmac('sha256', secret)
    .update(JSON.stringify(payload ?? {}))
    .digest('hex');
}

type VerifyResult = {
  ok: boolean;
  status: PaymentStatus;
  providerResponse?: unknown;
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private getChapaBaseUrl(): string {
    const raw = (
      process.env.CHAPA_BASE_URL ?? 'https://api.chapa.co/v1'
    ).trim();
    return raw.replace(/\/$/, '');
  }

  private getChapaSecret(): string {
    const secret = (process.env.CHAPA_SECRET_KEY ?? '').trim();
    if (!secret) {
      throw new BadRequestException('CHAPA_SECRET_KEY is not configured');
    }
    return secret;
  }

  private verifyWebhookSignature(
    body: unknown,
    headers: Record<string, unknown>,
  ): void {
    const secret = (process.env.CHAPA_WEBHOOK_SECRET ?? '').trim();
    const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();

    if (!secret) {
      if (nodeEnv === 'production') {
        throw new BadRequestException('CHAPA_WEBHOOK_SECRET is not configured');
      }
      // dev: allow unsigned webhook/callback
      return;
    }

    const provided = getChapaSignature(headers);
    if (!provided) {
      throw new ForbiddenException('Missing Chapa signature');
    }

    const expected = computeHmacSha256Hex(secret, body);
    if (provided !== expected) {
      throw new ForbiddenException('Invalid Chapa signature');
    }
  }

  private async verifyTransactionWithChapa(
    txRef: string,
  ): Promise<VerifyResult> {
    const baseUrl = this.getChapaBaseUrl();
    const secret = this.getChapaSecret();

    const resp = await fetch(`${baseUrl}/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const json: unknown = await resp.json().catch(() => null);
    if (!resp.ok) {
      return {
        ok: false,
        status: PaymentStatus.FAILED,
        providerResponse: json,
      };
    }

    // Chapa responses vary; we normalize based on common fields.
    const statusRaw =
      getNested(json, ['data', 'status']) ??
      getNested(json, ['status']) ??
      getNested(json, ['data', 'payment_status']);
    const normalized = safeLower(statusRaw);
    const succeeded = normalized === 'success' || normalized === 'successful';
    const failed = normalized === 'failed' || normalized === 'cancelled';

    return {
      ok: succeeded,
      status: succeeded
        ? PaymentStatus.SUCCEEDED
        : failed
          ? PaymentStatus.FAILED
          : PaymentStatus.PENDING,
      providerResponse: json,
    };
  }

  private async finalizePaymentFromTxRef(
    txRef: string,
    source: 'callback' | 'webhook',
    extraMetadata?: unknown,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerReference: txRef },
      include: { contract: true, milestone: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const verified = await this.verifyTransactionWithChapa(txRef);

    return await this.prisma.$transaction(async (tx) => {
      const extra = toInputJsonValue(extraMetadata);
      const verify = toInputJsonValue(verified.providerResponse);

      const metadata = {
        source,
        ...(extra !== undefined ? { extra } : {}),
        ...(verify !== undefined ? { verify } : {}),
        ...(payment.metadata != null
          ? {
              previous: payment.metadata as unknown as Prisma.InputJsonValue,
            }
          : {}),
      } satisfies Prisma.InputJsonObject;

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: verified.status,
          metadata,
        },
      });

      if (verified.status === PaymentStatus.SUCCEEDED) {
        if (payment.milestoneId) {
          const escrowKey = `CHAPA:${txRef}:ESCROW_DEPOSIT`;

          await tx.ledgerEntry.upsert({
            where: { idempotencyKey: escrowKey },
            update: {},
            create: {
              contractId: payment.contractId,
              paymentId: payment.id,
              milestoneId: payment.milestoneId,
              type: LedgerEntryType.ESCROW_DEPOSIT,
              amount: payment.amount,
              currency: payment.currency,
              idempotencyKey: escrowKey,
            },
          });

          await tx.contractMilestone.update({
            where: { id: payment.milestoneId },
            data: {
              status: ContractMilestoneStatus.FUNDED,
              fundedAt: new Date(),
            },
          });
        } else {
          const ledgerKey = `CHAPA:${txRef}:CLIENT_CHARGE`;

          await tx.ledgerEntry.upsert({
            where: { idempotencyKey: ledgerKey },
            update: {},
            create: {
              contractId: payment.contractId,
              paymentId: payment.id,
              type: LedgerEntryType.CLIENT_CHARGE,
              amount: payment.amount,
              currency: payment.currency,
              idempotencyKey: ledgerKey,
            },
          });

          await tx.contract.update({
            where: { id: payment.contractId },
            data: { status: ContractStatus.ACTIVE },
          });
        }
      }

      return {
        ok: true,
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
      };
    });
  }

  async createContractPaymentIntent(
    user: { id: string; role: UserRole; email: string; name: string },
    contractId: string,
    input?: { amount?: number; currency?: string },
  ) {
    if (user.role !== UserRole.PARENT && user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can pay');
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { jobPost: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.parentId !== user.id) {
      throw new ForbiddenException('Cannot pay for this contract');
    }

    if (
      contract.status === ContractStatus.CANCELLED ||
      contract.status === ContractStatus.COMPLETED
    ) {
      throw new BadRequestException('Contract is not payable');
    }

    if (contract.status === ContractStatus.ACTIVE) {
      throw new BadRequestException('Contract is already active');
    }

    const amount =
      input?.amount ?? contract.amount ?? contract.jobPost?.budget ?? null;

    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'Contract amount is not set. Add a job budget or set contract amount.',
      );
    }

    const currency = normalizeCurrency(
      input?.currency ?? contract.currency ?? DEFAULT_CURRENCY,
    );

    const updatedContract = await this.prisma.contract.update({
      where: { id: contract.id },
      data: {
        amount,
        currency,
        status: ContractStatus.PENDING_PAYMENT,
      },
    });

    const txRef = `ctr_${updatedContract.id}_${Date.now()}`;

    const frontendUrl = (process.env.FRONTEND_URL ?? '').split(',')[0].trim();
    if (!frontendUrl) {
      throw new BadRequestException('FRONTEND_URL is not configured');
    }

    const successUrl = `${frontendUrl}/payments/success?tx_ref=${encodeURIComponent(txRef)}`;

    const apiPublicUrl = (process.env.API_PUBLIC_URL ?? '').trim();
    if (!apiPublicUrl) {
      throw new BadRequestException('API_PUBLIC_URL is not configured');
    }

    const chapaSecret = this.getChapaSecret();

    const payload = {
      amount: String(amount),
      currency,
      email: user.email,
      first_name: user.name,
      tx_ref: txRef,
      // Chapa calls this URL (GET) after payment completes; handler must verify.
      callback_url: `${apiPublicUrl}/v1/payments/chapa/callback`,
      return_url: successUrl,
      customization: {
        title: 'Tutorstartup Contract Payment',
        description: contract.jobPost?.title ?? 'Contract payment',
      },
    };

    // Chapa initialize
    const resp = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chapaSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json: unknown = await resp.json().catch(() => null);
    if (!resp.ok) {
      throw new BadRequestException(
        getStringField(json, 'message') ?? 'Failed to create payment intent',
      );
    }

    const checkoutUrlRaw = getNested(json, ['data', 'checkout_url']);
    const checkoutUrl =
      typeof checkoutUrlRaw === 'string' && checkoutUrlRaw.trim().length > 0
        ? checkoutUrlRaw
        : undefined;
    if (!checkoutUrl) {
      throw new BadRequestException(
        'Payment provider did not return checkout url',
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        provider: PaymentProvider.CHAPA,
        status: PaymentStatus.PENDING,
        contractId: contract.id,
        createdByUserId: user.id,
        amount,
        currency,
        providerReference: txRef,
        checkoutUrl,
        metadata: toNullableJsonField(json),
      },
    });

    return {
      paymentId: payment.id,
      provider: payment.provider,
      providerReference: payment.providerReference,
      status: payment.status,
      checkoutUrl: payment.checkoutUrl,
    };
  }

  async createMilestonePaymentIntent(
    user: { id: string; role: UserRole; email: string; name: string },
    contractId: string,
    milestoneId: string,
    input?: { amount?: number; currency?: string },
  ) {
    if (user.role !== UserRole.PARENT && user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can pay');
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, parentId: true, status: true, jobPostId: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.parentId !== user.id) {
      throw new ForbiddenException('Cannot pay for this contract');
    }

    if (
      contract.status === ContractStatus.CANCELLED ||
      contract.status === ContractStatus.COMPLETED
    ) {
      throw new BadRequestException('Contract is not payable');
    }

    const milestone = await this.prisma.contractMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone || milestone.contractId !== contract.id) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.status === ContractMilestoneStatus.RELEASED) {
      throw new BadRequestException('Milestone already released');
    }

    if (milestone.status === ContractMilestoneStatus.FUNDED) {
      throw new BadRequestException('Milestone already funded');
    }

    if (milestone.status === ContractMilestoneStatus.CANCELLED) {
      throw new BadRequestException('Milestone cancelled');
    }

    const amount = input?.amount ?? milestone.amount;
    if (!amount || amount <= 0) {
      throw new BadRequestException('Milestone amount is invalid');
    }

    const currency = normalizeCurrency(
      input?.currency ?? milestone.currency ?? DEFAULT_CURRENCY,
    );

    const txRef = `ms_${milestone.id}_${Date.now()}`;

    const frontendUrl = (process.env.FRONTEND_URL ?? '').split(',')[0].trim();
    if (!frontendUrl) {
      throw new BadRequestException('FRONTEND_URL is not configured');
    }

    const successUrl = `${frontendUrl}/payments/success?tx_ref=${encodeURIComponent(txRef)}`;

    const apiPublicUrl = (process.env.API_PUBLIC_URL ?? '').trim();
    if (!apiPublicUrl) {
      throw new BadRequestException('API_PUBLIC_URL is not configured');
    }

    const chapaSecret = this.getChapaSecret();

    const payload = {
      amount: String(amount),
      currency,
      email: user.email,
      first_name: user.name,
      tx_ref: txRef,
      callback_url: `${apiPublicUrl}/v1/payments/chapa/callback`,
      return_url: successUrl,
      customization: {
        title: 'Tutorstartup Milestone Funding',
        description: milestone.title,
      },
    };

    const resp = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chapaSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json: unknown = await resp.json().catch(() => null);
    if (!resp.ok) {
      throw new BadRequestException(
        getStringField(json, 'message') ?? 'Failed to create payment intent',
      );
    }

    const checkoutUrlRaw = getNested(json, ['data', 'checkout_url']);
    const checkoutUrl =
      typeof checkoutUrlRaw === 'string' && checkoutUrlRaw.trim().length > 0
        ? checkoutUrlRaw
        : undefined;
    if (!checkoutUrl) {
      throw new BadRequestException(
        'Payment provider did not return checkout url',
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        provider: PaymentProvider.CHAPA,
        status: PaymentStatus.PENDING,
        contractId: contract.id,
        milestoneId: milestone.id,
        createdByUserId: user.id,
        amount,
        currency,
        providerReference: txRef,
        checkoutUrl,
        metadata: toNullableJsonField(json),
      },
    });

    return {
      paymentId: payment.id,
      provider: payment.provider,
      providerReference: payment.providerReference,
      status: payment.status,
      checkoutUrl: payment.checkoutUrl,
    };
  }

  async handleChapaCallback(queryOrBody: unknown) {
    const txRef = extractTxRef(queryOrBody);

    if (!txRef) {
      throw new BadRequestException('Missing tx_ref');
    }

    return await this.finalizePaymentFromTxRef(txRef, 'callback', queryOrBody);
  }

  async handleChapaWebhook(body: unknown, headers: Record<string, unknown>) {
    this.verifyWebhookSignature(body, headers);

    const txRef =
      extractTxRef(body) ??
      getStringField(body, 'reference') ??
      getStringField(getNested(body, ['data']), 'tx_ref');

    if (!txRef) {
      throw new BadRequestException('Missing tx_ref');
    }

    // Per docs: always verify before giving value.
    return await this.finalizePaymentFromTxRef(txRef, 'webhook', body);
  }

  async listContractPayments(
    user: { id: string; role: UserRole },
    contractId: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, parentId: true, tutorId: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (
      user.role !== UserRole.ADMIN &&
      contract.parentId !== user.id &&
      contract.tutorId !== user.id
    ) {
      throw new ForbiddenException('Cannot view contract payments');
    }

    return await this.prisma.payment.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
