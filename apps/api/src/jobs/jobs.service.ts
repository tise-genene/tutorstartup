import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import {
  ContractStatus,
  JobPostStatus,
  ProposalStatus,
  UserRole,
} from '../prisma/prisma.enums';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeCurrency(value?: string | null): string | undefined {
    const raw = (value ?? '').trim().toUpperCase();
    return raw.length > 0 ? raw : undefined;
  }

  async createJob(parent: { id: string; role: UserRole }, dto: CreateJobDto) {
    if (parent.role !== UserRole.PARENT && parent.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can post tutor jobs');
    }

    const client = await this.prisma.user.findUnique({
      where: { id: parent.id },
      select: { id: true, role: true, isVerified: true },
    });

    if (
      !client ||
      (client.role !== UserRole.PARENT && client.role !== UserRole.STUDENT)
    ) {
      throw new ForbiddenException('Only clients can post tutor jobs');
    }

    if (!client.isVerified) {
      throw new ForbiddenException('Verify your email to post a job');
    }

    const requestedStatus = dto.status ?? 'OPEN';
    const status =
      requestedStatus === 'DRAFT' ? JobPostStatus.DRAFT : JobPostStatus.OPEN;
    const publishedAt = status === JobPostStatus.OPEN ? new Date() : null;

    return await this.prisma.jobPost.create({
      data: {
        parentId: parent.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        subjects: (dto.subjects ?? []).map((s) => s.trim()).filter(Boolean),
        location: dto.location?.trim() || null,
        locationLat:
          typeof dto.locationLat === 'number' &&
          Number.isFinite(dto.locationLat)
            ? dto.locationLat
            : null,
        locationLng:
          typeof dto.locationLng === 'number' &&
          Number.isFinite(dto.locationLng)
            ? dto.locationLng
            : null,
        budget: dto.budget ?? null,
        grade: dto.grade ?? null,
        sessionMinutes: dto.sessionMinutes ?? null,
        daysPerWeek: dto.daysPerWeek ?? null,
        startTime: dto.startTime?.trim() || null,
        endTime: dto.endTime?.trim() || null,
        preferredDays: (dto.preferredDays ?? [])
          .map((d) => d.trim())
          .filter(Boolean),
        payType: (dto.payType as unknown as any) ?? null,
        hourlyAmount: dto.hourlyAmount ?? null,
        monthlyAmount: dto.monthlyAmount ?? null,
        fixedAmount: dto.fixedAmount ?? null,
        genderPreference: (dto.genderPreference as unknown as any) ?? undefined,
        currency: this.normalizeCurrency(dto.currency),
        status,
        publishedAt,
      },
    });
  }

  async listOpenJobs(
    user: { id: string; role: UserRole },
    pagination?: PaginationDto,
  ) {
    if (user.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can browse job posts');
    }

    const tutor = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isVerified: true },
    });

    if (!tutor || tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can browse job posts');
    }

    if (!tutor.isVerified) {
      throw new ForbiddenException('Verify your email to browse job posts');
    }

    const pg = pagination ?? new PaginationDto();
    return await this.prisma.jobPost.findMany({
      where: {
        status: JobPostStatus.OPEN,
        publishedAt: { not: null },
        contracts: {
          none: {
            status: {
              in: [ContractStatus.ACTIVE, ContractStatus.PENDING_PAYMENT],
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: pg.skip,
      take: pg.take,
    });
  }

  async listMyJobs(
    parent: { id: string; role: UserRole },
    pagination?: PaginationDto,
  ) {
    if (parent.role !== UserRole.PARENT && parent.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can view their job posts');
    }

    const pg = pagination ?? new PaginationDto();
    return await this.prisma.jobPost.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: 'desc' },
      skip: pg.skip,
      take: pg.take,
    });
  }

  async getJobById(user: { id: string; role: UserRole }, jobId: string) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        contracts: {
          where: {
            status: {
              in: [ContractStatus.ACTIVE, ContractStatus.PENDING_PAYMENT],
            },
          },
          select: { id: true, tutorId: true },
          take: 1,
        },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (
      (user.role === UserRole.PARENT || user.role === UserRole.STUDENT) &&
      job.parentId !== user.id
    ) {
      throw new ForbiddenException('Cannot view this job');
    }

    if (user.role === UserRole.TUTOR && job.status !== JobPostStatus.OPEN) {
      throw new ForbiddenException('Job not available');
    }

    if (
      user.role === UserRole.TUTOR &&
      job.status === JobPostStatus.OPEN &&
      job.publishedAt === null
    ) {
      throw new ForbiddenException('Job not available');
    }

    if (user.role === UserRole.TUTOR) {
      const activeContract = job.contracts[0];
      if (activeContract && activeContract.tutorId !== user.id) {
        throw new ForbiddenException('Job not available');
      }
    }

    if (
      user.role !== UserRole.PARENT &&
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.TUTOR
    ) {
      throw new ForbiddenException('Only tutors or clients can view jobs');
    }

    return job;
  }

  async closeJob(parent: { id: string; role: UserRole }, jobId: string) {
    if (parent.role !== UserRole.PARENT && parent.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can close jobs');
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
      data: { status: JobPostStatus.CLOSED, closedAt: new Date() },
    });
  }

  async updateJob(
    parent: { id: string; role: UserRole },
    jobId: string,
    dto: UpdateJobDto,
  ) {
    if (parent.role !== UserRole.PARENT && parent.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can update jobs');
    }

    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        contracts: {
          where: {
            status: {
              in: [ContractStatus.ACTIVE, ContractStatus.PENDING_PAYMENT],
            },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.parentId !== parent.id) {
      throw new ForbiddenException('Cannot update this job');
    }

    if (job.contracts.length > 0) {
      throw new BadRequestException(
        'Cannot update a job with an active contract',
      );
    }

    if (job.status !== JobPostStatus.DRAFT) {
      throw new BadRequestException('Only draft jobs can be updated');
    }

    return await this.prisma.jobPost.update({
      where: { id: jobId },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        subjects: dto.subjects
          ? dto.subjects.map((s) => s.trim()).filter(Boolean)
          : undefined,
        location:
          dto.location != null ? dto.location.trim() || null : undefined,
        locationLat:
          typeof dto.locationLat === 'number' &&
          Number.isFinite(dto.locationLat)
            ? dto.locationLat
            : dto.locationLat === null
              ? null
              : undefined,
        locationLng:
          typeof dto.locationLng === 'number' &&
          Number.isFinite(dto.locationLng)
            ? dto.locationLng
            : dto.locationLng === null
              ? null
              : undefined,
        budget: dto.budget ?? undefined,
        grade: dto.grade ?? undefined,
        sessionMinutes: dto.sessionMinutes ?? undefined,
        daysPerWeek: dto.daysPerWeek ?? undefined,
        startTime:
          dto.startTime != null ? dto.startTime.trim() || null : undefined,
        endTime: dto.endTime != null ? dto.endTime.trim() || null : undefined,
        preferredDays: dto.preferredDays
          ? dto.preferredDays.map((d) => d.trim()).filter(Boolean)
          : undefined,
        payType: (dto.payType as unknown as any) ?? undefined,
        hourlyAmount: dto.hourlyAmount ?? undefined,
        monthlyAmount: dto.monthlyAmount ?? undefined,
        fixedAmount: dto.fixedAmount ?? undefined,
        genderPreference: (dto.genderPreference as unknown as any) ?? undefined,
        currency: this.normalizeCurrency(dto.currency) ?? undefined,
      },
    });
  }

  async publishJob(parent: { id: string; role: UserRole }, jobId: string) {
    if (parent.role !== UserRole.PARENT && parent.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can publish jobs');
    }

    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { id: true, parentId: true, status: true, publishedAt: true },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.parentId !== parent.id) {
      throw new ForbiddenException('Cannot publish this job');
    }

    if (job.status === JobPostStatus.CLOSED) {
      throw new BadRequestException('Cannot publish a closed job');
    }

    if (job.status === JobPostStatus.OPEN && job.publishedAt) {
      return await this.prisma.jobPost.findUniqueOrThrow({
        where: { id: jobId },
      });
    }

    return await this.prisma.jobPost.update({
      where: { id: jobId },
      data: { status: JobPostStatus.OPEN, publishedAt: new Date() },
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
      select: { id: true, status: true, publishedAt: true },
    });

    if (!job || job.status !== JobPostStatus.OPEN || !job.publishedAt) {
      throw new BadRequestException('Job not found or not open');
    }

    const activeContract = await this.prisma.contract.findFirst({
      where: {
        jobPostId: jobId,
        status: { in: [ContractStatus.ACTIVE, ContractStatus.PENDING_PAYMENT] },
      },
      select: { id: true },
    });

    if (activeContract) {
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
    if (parent.role !== UserRole.PARENT && parent.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can decline proposals');
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
    pagination?: PaginationDto,
  ) {
    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { id: true, parentId: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (
      (user.role === UserRole.PARENT || user.role === UserRole.STUDENT) &&
      job.parentId !== user.id
    ) {
      throw new ForbiddenException('Cannot view proposals for this job');
    }

    if (user.role !== UserRole.PARENT && user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only clients can view job proposals');
    }

    const pg = pagination ?? new PaginationDto();
    return await this.prisma.proposal.findMany({
      where: { jobPostId: jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        tutor: { select: { id: true, name: true, email: true, role: true } },
        contract: { select: { id: true } },
      },
      skip: pg.skip,
      take: pg.take,
    });
  }

  async listMyProposals(
    tutor: { id: string; role: UserRole },
    pagination?: PaginationDto,
  ) {
    if (tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can view their proposals');
    }

    const pg = pagination ?? new PaginationDto();
    return await this.prisma.proposal.findMany({
      where: { tutorId: tutor.id },
      orderBy: { createdAt: 'desc' },
      include: { jobPost: true, contract: { select: { id: true } } },
      skip: pg.skip,
      take: pg.take,
    });
  }
}
