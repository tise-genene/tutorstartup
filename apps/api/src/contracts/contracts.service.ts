import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContractStatus,
  ContractMilestoneStatus,
  JobPostStatus,
  LedgerEntryType,
  ProposalStatus,
  UserRole,
} from '../prisma/prisma.enums';
import { SendContractMessageDto } from './dto/send-contract-message.dto';
import { CreateContractMilestoneDto } from './dto/create-contract-milestone.dto';
import { ReleaseContractMilestoneDto } from './dto/release-contract-milestone.dto';
import { PayoutContractMilestoneDto } from './dto/payout-contract-milestone.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeCurrency(value?: string | null): string {
    const raw = (value ?? '').trim().toUpperCase();
    return raw.length > 0 ? raw : 'ETB';
  }

  private async ensureContractMember(userId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        parentId: true,
        tutorId: true,
      },
    });

    if (!contract) throw new NotFoundException('Contract not found');

    const isMember =
      contract.parentId === userId || contract.tutorId === userId;
    if (!isMember) throw new ForbiddenException('Not allowed');

    return contract;
  }

  async listAppointments(
    user: { id: string; role: UserRole },
    contractId: string,
  ) {
    await this.ensureContractMember(user.id, contractId);

    return await this.prisma.appointment.findMany({
      where: { contractId, cancelledAt: null },
      orderBy: { startAt: 'asc' },
    });
  }

  async createAppointment(
    user: { id: string; role: UserRole },
    contractId: string,
    dto: CreateAppointmentDto,
  ) {
    await this.ensureContractMember(user.id, contractId);

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid startAt/endAt');
    }
    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }

    return await this.prisma.appointment.create({
      data: {
        contractId,
        createdByUserId: user.id,
        title: dto.title,
        notes: dto.notes ?? null,
        startAt,
        endAt,
        locationText: dto.locationText ?? null,
        locationLat: dto.locationLat ?? null,
        locationLng: dto.locationLng ?? null,
      },
    });
  }

  async cancelAppointment(
    user: { id: string; role: UserRole },
    contractId: string,
    appointmentId: string,
  ) {
    // Membership check first to avoid leaking existence across contracts.
    await this.ensureContractMember(user.id, contractId);

    const existing = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing || existing.contractId !== contractId) {
      throw new NotFoundException('Appointment not found');
    }

    if (existing.cancelledAt) {
      return existing;
    }

    return await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { cancelledAt: new Date() },
    });
  }

  async createFromProposal(
    parent: { id: string; role: UserRole },
    proposalId: string,
  ) {
    if (parent.role !== UserRole.PARENT && parent.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can accept proposals');
    }

    return await this.prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.findUnique({
        where: { id: proposalId },
        include: {
          jobPost: {
            select: { id: true, parentId: true, status: true, budget: true },
          },
        },
      });

      if (!proposal || !proposal.jobPost) {
        throw new NotFoundException('Proposal not found');
      }

      if (proposal.jobPost.parentId !== parent.id) {
        throw new ForbiddenException('Cannot accept proposals for this job');
      }

      if (proposal.jobPost.status !== JobPostStatus.OPEN) {
        throw new BadRequestException('Job is not open');
      }

      if (proposal.status === ProposalStatus.WITHDRAWN) {
        throw new BadRequestException('Proposal was withdrawn');
      }

      const existingForProposal = await tx.contract.findUnique({
        where: { proposalId: proposal.id },
      });

      if (existingForProposal) {
        return await tx.contract.findUniqueOrThrow({
          where: { id: existingForProposal.id },
          include: {
            jobPost: true,
            parent: { select: { id: true, name: true, role: true } },
            tutor: { select: { id: true, name: true, role: true } },
          },
        });
      }

      const existingActiveForJob = await tx.contract.findFirst({
        where: {
          jobPostId: proposal.jobPostId,
          status: {
            in: [ContractStatus.ACTIVE, ContractStatus.PENDING_PAYMENT],
          },
        },
        select: { id: true },
      });

      if (existingActiveForJob) {
        throw new BadRequestException(
          'This job already has an active contract',
        );
      }

      if (proposal.status !== ProposalStatus.SUBMITTED) {
        throw new BadRequestException(
          'Only submitted proposals can be accepted',
        );
      }

      await tx.proposal.update({
        where: { id: proposal.id },
        data: { status: ProposalStatus.ACCEPTED },
      });

      await tx.jobPost.update({
        where: { id: proposal.jobPostId },
        data: {
          status: JobPostStatus.CLOSED,
          closedAt: new Date(),
          hiredTutorId: proposal.tutorId,
          hiredAt: new Date(),
        },
      });

      const created = await tx.contract.create({
        data: {
          jobPostId: proposal.jobPostId,
          proposalId: proposal.id,
          parentId: parent.id,
          tutorId: proposal.tutorId,
          amount: proposal.jobPost?.budget ?? null,
          currency: 'ETB',
          status:
            proposal.jobPost?.budget && proposal.jobPost.budget > 0
              ? ContractStatus.PENDING_PAYMENT
              : ContractStatus.ACTIVE,
        },
        include: {
          jobPost: true,
          parent: { select: { id: true, name: true, role: true } },
          tutor: { select: { id: true, name: true, role: true } },
        },
      });

      return created;
    });
  }

  async listMine(user: { id: string; role: UserRole }) {
    if (
      user.role !== UserRole.PARENT &&
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.TUTOR
    ) {
      throw new ForbiddenException('Only tutors or clients can view contracts');
    }

    const where =
      user.role === UserRole.PARENT || user.role === UserRole.STUDENT
        ? { parentId: user.id }
        : { tutorId: user.id };

    return await this.prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        jobPost: true,
        parent: { select: { id: true, name: true, role: true } },
        tutor: { select: { id: true, name: true, role: true } },
      },
      take: 50,
    });
  }

  async getById(user: { id: string; role: UserRole }, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        jobPost: true,
        parent: { select: { id: true, name: true, role: true } },
        tutor: { select: { id: true, name: true, role: true } },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (
      user.role !== UserRole.ADMIN &&
      contract.parentId !== user.id &&
      contract.tutorId !== user.id
    ) {
      throw new ForbiddenException('Cannot view this contract');
    }

    return contract;
  }

  async listMessages(user: { id: string; role: UserRole }, contractId: string) {
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
      throw new ForbiddenException('Cannot view contract messages');
    }

    return await this.prisma.contractMessage.findMany({
      where: { contractId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      take: 200,
    });
  }

  async sendMessage(
    sender: { id: string },
    contractId: string,
    dto: SendContractMessageDto,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, parentId: true, tutorId: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.parentId !== sender.id && contract.tutorId !== sender.id) {
      throw new ForbiddenException('Cannot send messages to this contract');
    }

    if (dto.body.trim().length === 0) {
      throw new BadRequestException('Message body is required');
    }

    return await this.prisma.contractMessage.create({
      data: {
        contractId,
        senderId: sender.id,
        body: dto.body.trim(),
        attachmentUrl: dto.attachmentUrl?.trim() || null,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async listMilestones(
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
      throw new ForbiddenException('Cannot view contract milestones');
    }

    return await this.prisma.contractMilestone.findMany({
      where: { contractId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async createMilestone(
    user: { id: string; role: UserRole },
    contractId: string,
    dto: CreateContractMilestoneDto,
  ) {
    if (user.role !== UserRole.PARENT && user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can create milestones');
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, parentId: true, status: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.parentId !== user.id) {
      throw new ForbiddenException(
        'Cannot create milestones for this contract',
      );
    }

    if (
      contract.status === ContractStatus.CANCELLED ||
      contract.status === ContractStatus.COMPLETED
    ) {
      throw new BadRequestException('Contract is not editable');
    }

    const title = dto.title.trim();
    if (title.length === 0) {
      throw new BadRequestException('Title is required');
    }

    return await this.prisma.contractMilestone.create({
      data: {
        contractId: contract.id,
        title,
        amount: dto.amount,
        currency: this.normalizeCurrency(dto.currency),
        status: ContractMilestoneStatus.DRAFT,
      },
    });
  }

  async releaseMilestone(
    user: { id: string; role: UserRole },
    contractId: string,
    milestoneId: string,
    dto?: ReleaseContractMilestoneDto,
  ) {
    if (user.role !== UserRole.PARENT && user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can release milestones');
    }

    return await this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        select: { id: true, parentId: true, tutorId: true, status: true },
      });

      if (!contract) {
        throw new NotFoundException('Contract not found');
      }

      if (contract.parentId !== user.id) {
        throw new ForbiddenException(
          'Cannot release milestones for this contract',
        );
      }

      if (
        contract.status === ContractStatus.CANCELLED ||
        contract.status === ContractStatus.COMPLETED
      ) {
        throw new BadRequestException('Contract is not active');
      }

      const milestone = await tx.contractMilestone.findUnique({
        where: { id: milestoneId },
      });

      if (!milestone || milestone.contractId !== contract.id) {
        throw new NotFoundException('Milestone not found');
      }

      if (milestone.status !== ContractMilestoneStatus.FUNDED) {
        throw new BadRequestException('Milestone must be FUNDED to release');
      }

      const escrowDeposited = await tx.ledgerEntry.aggregate({
        where: {
          contractId: contract.id,
          milestoneId: milestone.id,
          type: LedgerEntryType.ESCROW_DEPOSIT,
        },
        _sum: { amount: true },
      });

      const escrowAmount = escrowDeposited._sum.amount ?? 0;
      if (escrowAmount < milestone.amount) {
        throw new BadRequestException('Insufficient escrow for this milestone');
      }

      const releaseKey = `MILESTONE:${milestone.id}:RELEASE`;

      await tx.ledgerEntry.upsert({
        where: { idempotencyKey: releaseKey },
        update: {},
        create: {
          contractId: contract.id,
          milestoneId: milestone.id,
          type: LedgerEntryType.TUTOR_PAYABLE,
          amount: milestone.amount,
          currency: milestone.currency,
          idempotencyKey: releaseKey,
        },
      });

      const updated = await tx.contractMilestone.update({
        where: { id: milestone.id },
        data: {
          status: ContractMilestoneStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      void dto;
      return updated;
    });
  }

  async payoutMilestone(
    user: { id: string; role: UserRole },
    contractId: string,
    milestoneId: string,
    dto?: PayoutContractMilestoneDto,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can payout milestones');
    }

    return await this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        select: { id: true, tutorId: true, status: true },
      });

      if (!contract) {
        throw new NotFoundException('Contract not found');
      }

      if (
        contract.status === ContractStatus.CANCELLED ||
        contract.status === ContractStatus.COMPLETED
      ) {
        throw new BadRequestException('Contract is not payable');
      }

      const milestone = await tx.contractMilestone.findUnique({
        where: { id: milestoneId },
      });

      if (!milestone || milestone.contractId !== contract.id) {
        throw new NotFoundException('Milestone not found');
      }

      if (milestone.status !== ContractMilestoneStatus.RELEASED) {
        throw new BadRequestException('Milestone must be RELEASED to payout');
      }

      const [escrowDeposited, payableSum, payoutSum] = await Promise.all([
        tx.ledgerEntry.aggregate({
          where: {
            contractId: contract.id,
            milestoneId: milestone.id,
            type: LedgerEntryType.ESCROW_DEPOSIT,
          },
          _sum: { amount: true },
        }),
        tx.ledgerEntry.aggregate({
          where: {
            contractId: contract.id,
            milestoneId: milestone.id,
            type: LedgerEntryType.TUTOR_PAYABLE,
          },
          _sum: { amount: true },
        }),
        tx.ledgerEntry.aggregate({
          where: {
            contractId: contract.id,
            milestoneId: milestone.id,
            type: LedgerEntryType.TUTOR_PAYOUT,
          },
          _sum: { amount: true },
        }),
      ]);

      const escrowAmount = escrowDeposited._sum.amount ?? 0;
      const payableAmount = payableSum._sum.amount ?? 0;
      const alreadyPaid = payoutSum._sum.amount ?? 0;
      const remainingPayable = payableAmount - alreadyPaid;

      if (remainingPayable <= 0) {
        throw new BadRequestException('Nothing left to payout');
      }

      const remainingEscrow = escrowAmount - alreadyPaid;
      if (remainingEscrow < remainingPayable) {
        throw new BadRequestException('Insufficient escrow to payout');
      }

      const payoutKey = `MILESTONE:${milestone.id}:PAYOUT`;

      const created = await tx.ledgerEntry.upsert({
        where: { idempotencyKey: payoutKey },
        update: {},
        create: {
          contractId: contract.id,
          milestoneId: milestone.id,
          type: LedgerEntryType.TUTOR_PAYOUT,
          amount: remainingPayable,
          currency: milestone.currency,
          idempotencyKey: payoutKey,
        },
      });

      void contract;
      void dto;
      return created;
    });
  }
}
