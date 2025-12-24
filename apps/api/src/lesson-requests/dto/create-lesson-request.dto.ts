import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLessonRequestDto {
  @IsUUID()
  tutorUserId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;
}
