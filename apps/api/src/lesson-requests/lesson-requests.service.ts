import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LessonRequestStatus, UserRole } from '../prisma/prisma.enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonRequestDto } from './dto/create-lesson-request.dto';

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

  async listInbox(tutor: { id: string; role: UserRole }) {
    if (tutor.role !== UserRole.TUTOR) {
      throw new ForbiddenException('Only tutors can view lesson requests');
    }

    return this.prisma.lessonRequest.findMany({
      where: { tutorId: tutor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      take: 50,
    });
  }

  async updateStatus(
    tutor: { id: string; role: UserRole },
    requestId: string,
    status: LessonRequestStatus,
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

    return this.prisma.lessonRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
