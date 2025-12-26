import { LessonRequestStatus } from '../../prisma/prisma.enums';
import { IsEnum } from 'class-validator';

export class UpdateLessonRequestDto {
  @IsEnum(LessonRequestStatus)
  status!: LessonRequestStatus;
}
