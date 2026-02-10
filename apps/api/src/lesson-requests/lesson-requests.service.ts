import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LessonRequestStatus, UserRole } from '../prisma/prisma.enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonRequestDto } from './dto/create-lesson-request.dto';
import { UpdateLessonRequestDto } from './dto/update-lesson-request.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class LessonRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    requester: { id: string; role: UserRole },
    dto: CreateLessonRequestDto,
  ) {
    if (
      requester.role !== UserRole.STUDENT &&
      requester.role !== UserRole.PARENT
    ) {
      throw new ForbiddenException(
        'Only students or parents can request lessons',
      );
    }

    const tutor = await this.prisma.user.findUnique({
      where: { id: dto.tutorUserId },
      select: { id: true, role: true },
    });

    if (!tutor || tutor.role !== UserRole.TUTOR) {
      throw new BadRequestException('Tutor not found');
    }

    return this.prisma.lessonRequest.create({
      data: {
        tutorId: tutor.id,
        requesterId: requester.id,
        subject: dto.subject.trim(),
        message: dto.message.trim(),
        status: LessonRequestStatus.PENDING,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async listInbox(
    tutor: { id: string; role: UserRole },
    pagination?: PaginationDto,
  ) {
    if (tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can view lesson requests');
    }

    const pg = pagination ?? new PaginationDto();
    return await this.prisma.lessonRequest.findMany({
      where: { tutorId: tutor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      skip: pg.skip,
      take: pg.take,
    });
  }

  async countPendingInbox(tutor: { id: string; role: UserRole }) {
    if (tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can view lesson requests');
    }

    return await this.prisma.lessonRequest.count({
      where: {
        tutorId: tutor.id,
        status: LessonRequestStatus.PENDING,
      },
    });
  }

  async updateStatus(
    tutor: { id: string; role: UserRole },
    requestId: string,
    dto: UpdateLessonRequestDto,
  ) {
    if (tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can update lesson requests');
    }

    const existing = await this.prisma.lessonRequest.findUnique({
      where: { id: requestId },
      select: { id: true, tutorId: true },
    });

    if (!existing) {
      throw new NotFoundException('Lesson request not found');
    }

    if (existing.tutorId !== tutor.id) {
      throw new ForbiddenException('Cannot modify this lesson request');
    }

    const respondedAt =
      dto.status === LessonRequestStatus.PENDING ? null : new Date();

    return this.prisma.lessonRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        tutorResponseMessage: dto.tutorResponseMessage?.trim() || null,
        tutorResponseFileUrl: dto.tutorResponseFileUrl?.trim() || null,
        tutorResponseVideoUrl: dto.tutorResponseVideoUrl?.trim() || null,
        respondedAt,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
