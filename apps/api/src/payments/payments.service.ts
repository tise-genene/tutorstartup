import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContractStatus,
  LedgerEntryType,
  PaymentProvider,
  PaymentStatus,
  UserRole,
} from '../prisma/prisma.enums';

const DEFAULT_CURRENCY = 'ETB';

function normalizeCurrency(value?: string | null): string {
  const c = (value ?? '').trim().toUpperCase();
  return c.length ? c : DEFAULT_CURRENCY;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createContractPaymentIntent(
    user: { id: string; role: UserRole; email: string; name: string },
    contractId: string,
    input?: { amount?: number; currency?: string },
  ) {
    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can pay');
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
    const failureUrl = `${frontendUrl}/payments/failure?tx_ref=${encodeURIComponent(txRef)}`;

    const apiPublicUrl = (process.env.API_PUBLIC_URL ?? '').trim();
    if (!apiPublicUrl) {
      throw new BadRequestException('API_PUBLIC_URL is not configured');
    }

    const chapaSecret = (process.env.CHAPA_SECRET_KEY ?? '').trim();
    if (!chapaSecret) {
      throw new BadRequestException('CHAPA_SECRET_KEY is not configured');
    }

    const payload = {
      amount: String(amount),
      currency,
      email: user.email,
      first_name: user.name,
      tx_ref: txRef,
      callback_url: `${apiPublicUrl}/v1/payments/chapa/webhook`,
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

    const json = (await resp.json().catch(() => null)) as any;
    if (!resp.ok) {
      throw new BadRequestException(
        json?.message ?? 'Failed to create payment intent',
      );
    }

    const checkoutUrl: string | undefined = json?.data?.checkout_url;
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
        metadata: json,
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

  async handleChapaWebhook(rawBody: any) {
    // We treat this as untrusted. Minimal idempotency is done via LedgerEntry.idempotencyKey.
    const txRef: string | undefined =
      rawBody?.tx_ref ?? rawBody?.data?.tx_ref ?? rawBody?.reference;

    const statusRaw: string | undefined =
      rawBody?.status ?? rawBody?.data?.status ?? rawBody?.event;

    if (!txRef) {
      throw new BadRequestException('Missing tx_ref');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { providerReference: txRef },
      include: { contract: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const normalizedStatus = (statusRaw ?? '').toLowerCase();
    const isSuccess =
      normalizedStatus === 'success' || normalizedStatus === 'successful';
    const isFailed = normalizedStatus === 'failed';

    return await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess
            ? PaymentStatus.SUCCEEDED
            : isFailed
              ? PaymentStatus.FAILED
              : PaymentStatus.PENDING,
          metadata: rawBody,
        },
      });

      if (isSuccess) {
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

        // Minimal rule: payment success activates contract.
        await tx.contract.update({
          where: { id: payment.contractId },
          data: { status: ContractStatus.ACTIVE },
        });
      }

      return {
        ok: true,
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
      };
    });
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

    if (contract.parentId !== user.id && contract.tutorId !== user.id) {
      throw new ForbiddenException('Cannot view contract payments');
    }

    return await this.prisma.payment.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
