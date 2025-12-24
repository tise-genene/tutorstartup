import {
  LessonRequest,
  LessonRequestStatus,
  User,
  UserRole,
} from '@prisma/client';

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
