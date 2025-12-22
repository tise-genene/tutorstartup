import { UserRole } from '@prisma/client';

export class AuthenticatedUserDto {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  isVerified!: boolean;
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: AuthenticatedUserDto;
}
