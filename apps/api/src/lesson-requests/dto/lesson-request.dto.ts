import type { LessonRequest, User } from '@prisma/client';
import type { LessonRequestStatus, UserRole } from '../../prisma/prisma.enums';

export class LessonRequestUserDto {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
}

export class LessonRequestDto {
  id!: string;
  tutorId!: string;
  requesterId!: string;
  subject!: string;
  message!: string;
  status!: LessonRequestStatus;

  tutorResponseMessage?: string | null;
  tutorResponseFileUrl?: string | null;
  tutorResponseVideoUrl?: string | null;
  respondedAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
  requester!: LessonRequestUserDto;

  static fromEntity(
    entity: LessonRequest & {
      requester: Pick<User, 'id' | 'name' | 'email' | 'role'>;
    },
  ): LessonRequestDto {
    return {
      id: entity.id,
      tutorId: entity.tutorId,
      requesterId: entity.requesterId,
      subject: entity.subject,
      message: entity.message,
      status: entity.status,
      tutorResponseMessage: entity.tutorResponseMessage ?? null,
      tutorResponseFileUrl: entity.tutorResponseFileUrl ?? null,
      tutorResponseVideoUrl: entity.tutorResponseVideoUrl ?? null,
      respondedAt: entity.respondedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      requester: {
        id: entity.requester.id,
        name: entity.requester.name,
        email: entity.requester.email,
        role: entity.requester.role,
      },
    };
  }
}
