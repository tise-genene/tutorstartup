import { LessonRequestStatus } from '../../prisma/prisma.enums';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateLessonRequestDto {
  @IsEnum(LessonRequestStatus)
  status!: LessonRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  tutorResponseMessage?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: 'tutorResponseFileUrl must be a valid URL' },
  )
  tutorResponseFileUrl?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: 'tutorResponseVideoUrl must be a valid URL' },
  )
  tutorResponseVideoUrl?: string;
}
