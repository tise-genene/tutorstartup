import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import {
  ContractStatus,
  JobPostStatus,
  ProposalStatus,
  UserRole,
} from '../prisma/prisma.enums';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(parent: { id: string; role: UserRole }, dto: CreateJobDto) {
    if (parent.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can post tutor jobs');
    }

    return await this.prisma.jobPost.create({
      data: {
        parentId: parent.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        subjects: (dto.subjects ?? []).map((s) => s.trim()).filter(Boolean),
        location: dto.location?.trim() || null,
        budget: dto.budget ?? null,
        status: JobPostStatus.OPEN,
      },
    });
  }

  async listOpenJobs(user: { id: string; role: UserRole }) {
    if (user.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can browse job posts');
    }

    return await this.prisma.jobPost.findMany({
      where: {
        status: JobPostStatus.OPEN,
        contracts: { none: { status: ContractStatus.ACTIVE } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listMyJobs(parent: { id: string; role: UserRole }) {
    if (parent.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can view their job posts');
    }

    return await this.prisma.jobPost.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getJobById(user: { id: string; role: UserRole }, jobId: string) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        contracts: {
          where: { status: ContractStatus.ACTIVE },
          select: { id: true, tutorId: true },
          take: 1,
        },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (user.role === UserRole.PARENT && job.parentId !== user.id) {
      throw new ForbiddenException('Cannot view this job');
    }

    if (user.role === UserRole.TUTOR && job.status !== JobPostStatus.OPEN) {
      throw new ForbiddenException('Job not available');
    }

    if (user.role === UserRole.TUTOR) {
      const activeContract = job.contracts[0];
      if (activeContract && activeContract.tutorId !== user.id) {
        throw new ForbiddenException('Job not available');
      }
    }

    if (user.role !== UserRole.PARENT && user.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors or parents can view jobs');
    }

    return job;
  }

  async closeJob(parent: { id: string; role: UserRole }, jobId: string) {
    if (parent.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can close jobs');
    }

    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { id: true, parentId: true, status: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.parentId !== parent.id) {
      throw new ForbiddenException('Cannot close this job');
    }

    if (job.status === JobPostStatus.CLOSED) {
      return await this.prisma.jobPost.findUniqueOrThrow({
        where: { id: jobId },
      });
    }

    return await this.prisma.jobPost.update({
      where: { id: jobId },
      data: { status: JobPostStatus.CLOSED },
    });
  }

  async submitProposal(
    tutor: { id: string; role: UserRole },
    jobId: string,
    dto: CreateProposalDto,
  ) {
    if (tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can submit proposals');
    }

    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    });

    if (!job || job.status !== JobPostStatus.OPEN) {
      throw new BadRequestException('Job not found or not open');
    }

    return await this.prisma.proposal.upsert({
      where: { jobPostId_tutorId: { jobPostId: jobId, tutorId: tutor.id } },
      update: {
        message: dto.message.trim(),
        fileUrl: dto.fileUrl?.trim() || null,
        videoUrl: dto.videoUrl?.trim() || null,
        status: ProposalStatus.SUBMITTED,
      },
      create: {
        jobPostId: jobId,
        tutorId: tutor.id,
        message: dto.message.trim(),
        fileUrl: dto.fileUrl?.trim() || null,
        videoUrl: dto.videoUrl?.trim() || null,
        status: ProposalStatus.SUBMITTED,
      },
      include: { jobPost: true, contract: { select: { id: true } } },
    });
  }

  async withdrawProposal(
    tutor: { id: string; role: UserRole },
    proposalId: string,
  ) {
    if (tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can withdraw proposals');
    }

    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { id: true, tutorId: true, status: true },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.tutorId !== tutor.id) {
      throw new ForbiddenException('Cannot withdraw this proposal');
    }

    if (proposal.status === ProposalStatus.ACCEPTED) {
      throw new BadRequestException('Accepted proposals cannot be withdrawn');
    }

    return await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.WITHDRAWN },
      include: { jobPost: true, contract: { select: { id: true } } },
    });
  }

  async declineProposal(
    parent: { id: string; role: UserRole },
    proposalId: string,
  ) {
    if (parent.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can decline proposals');
    }

    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { jobPost: { select: { parentId: true } } },
    });

    if (!proposal || !proposal.jobPost) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.jobPost.parentId !== parent.id) {
      throw new ForbiddenException('Cannot decline proposals for this job');
    }

    if (proposal.status === ProposalStatus.ACCEPTED) {
      throw new BadRequestException('Accepted proposals cannot be declined');
    }

    return await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.DECLINED },
      include: { jobPost: true, contract: { select: { id: true } } },
    });
  }

  async listProposalsForJob(
    user: { id: string; role: UserRole },
    jobId: string,
  ) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { id: true, parentId: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (user.role === UserRole.PARENT && job.parentId !== user.id) {
      throw new ForbiddenException('Cannot view proposals for this job');
    }

    if (user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Only parents can view job proposals');
    }

    return await this.prisma.proposal.findMany({
      where: { jobPostId: jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        tutor: { select: { id: true, name: true, email: true, role: true } },
        contract: { select: { id: true } },
      },
      take: 50,
    });
  }

  async listMyProposals(tutor: { id: string; role: UserRole }) {
    if (tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can view their proposals');
    }

    return await this.prisma.proposal.findMany({
      where: { tutorId: tutor.id },
      orderBy: { createdAt: 'desc' },
      include: { jobPost: true, contract: { select: { id: true } } },
      take: 50,
    });
  }
}
