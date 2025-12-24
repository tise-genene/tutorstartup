import { LessonRequestStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateLessonRequestDto {
  @IsEnum(LessonRequestStatus)
  status!: LessonRequestStatus;
}
