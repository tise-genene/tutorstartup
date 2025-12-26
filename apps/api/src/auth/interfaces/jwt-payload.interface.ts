import type { UserRole } from '../../prisma/prisma.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti?: string;
}
