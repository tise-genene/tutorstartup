import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContractStatus,
  JobPostStatus,
  ProposalStatus,
  UserRole,
} from '../prisma/prisma.enums';
import { SendContractMessageDto } from './dto/send-contract-message.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromProposal(
    parent: { id: string; role: UserRole },
    proposalId: string,
  ) {
    if (parent.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can accept proposals');
    }

    return await this.prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.findUnique({
        where: { id: proposalId },
        include: {
          jobPost: { select: { id: true, parentId: true, status: true } },
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
          status: ContractStatus.ACTIVE,
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

      const created = await tx.contract.create({
        data: {
          jobPostId: proposal.jobPostId,
          proposalId: proposal.id,
          parentId: parent.id,
          tutorId: proposal.tutorId,
          status: ContractStatus.ACTIVE,
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
    if (user.role !== UserRole.PARENT && user.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors or parents can view contracts');
    }

    const where =
      user.role === UserRole.PARENT
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

    if (contract.parentId !== user.id && contract.tutorId !== user.id) {
      throw new ForbiddenException('Cannot view this contract');
    }

    return contract;
  }

  async listMessages(user: { id: string }, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, parentId: true, tutorId: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.parentId !== user.id && contract.tutorId !== user.id) {
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
}
