import { UserRole } from '../../prisma/prisma.enums';

export class AuthenticatedUserDto {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  isVerified!: boolean;
}

export class AuthTokensDto {
  accessToken!: string;
  refreshToken!: string;
  user!: AuthenticatedUserDto;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: AuthenticatedUserDto;
}
