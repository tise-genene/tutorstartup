import type { Session } from '@prisma/client';

export class SessionDto {
  id!: string;
  createdAt!: Date;
  expiresAt!: Date;
  revokedAt!: Date | null;
  ip!: string | null;
  userAgent!: string | null;
  isCurrent!: boolean;

  static fromEntity(
    entity: Session,
    options?: { currentTokenId?: string | null },
  ): SessionDto {
    const dto = new SessionDto();
    dto.id = entity.id;
    dto.createdAt = entity.createdAt;
    dto.expiresAt = entity.expiresAt;
    dto.revokedAt = entity.revokedAt ?? null;
    dto.ip = entity.ip ?? null;
    dto.userAgent = entity.userAgent ?? null;
    dto.isCurrent = Boolean(
      options?.currentTokenId && entity.tokenId === options.currentTokenId,
    );
    return dto;
  }
}
