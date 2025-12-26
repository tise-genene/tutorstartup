import { UserRole } from '../../prisma/prisma.enums';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'role must be STUDENT, PARENT, or TUTOR',
  })
  role?: UserRole;
}
