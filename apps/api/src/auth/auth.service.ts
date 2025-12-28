import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Session } from '@prisma/client';
import type { User } from '@prisma/client';
import { UserRole } from '../prisma/prisma.enums';
import * as argon2 from 'argon2';
import { randomUUID, createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokensDto, AuthenticatedUserDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { NotificationsQueueService } from '../notifications/notifications.queue.service';

type ExpiresIn = string | number;

@Injectable()
export class AuthService {
  private readonly allowedSelfAssignableRoles = new Set<UserRole>([
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.TUTOR,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsQueue: NotificationsQueueService,
  ) {}

  async register(
    dto: RegisterDto,
    meta?: { ip?: string | null; userAgent?: string | null },
  ): Promise<AuthTokensDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const allowedRole = dto.role ?? UserRole.STUDENT;

    if (!this.allowedSelfAssignableRoles.has(allowedRole)) {
      throw new BadRequestException('Role not supported for self-registration');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.name.trim(),
        role: allowedRole,
        passwordHash,
      },
    });

    void this.notificationsQueue.enqueueWelcomeEmail({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return this.issueTokensForUser(user, meta);
  }

  async login(
    dto: LoginDto,
    meta?: { ip?: string | null; userAgent?: string | null },
  ): Promise<AuthTokensDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokensForUser(user, meta);
  }

  async refresh(
    refreshToken: string,
    meta?: { ip?: string | null; userAgent?: string | null },
  ): Promise<AuthTokensDto> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      const tokenId = payload.jti;
      if (!tokenId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const existingSession = await this.prisma.session.findUnique({
        where: { tokenId },
      });

      if (!existingSession || existingSession.userId !== payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (existingSession.revokedAt) {
        // Reuse detected: revoke all active sessions for the user.
        await this.prisma.session.updateMany({
          where: { userId: existingSession.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (existingSession.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const presentedHash = this.hashToken(refreshToken);
      if (presentedHash !== existingSession.tokenHash) {
        // Defensive: token mismatch for stored id.
        await this.prisma.session.updateMany({
          where: { userId: existingSession.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return await this.rotateSession(user, existingSession.tokenId, meta);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      const tokenId = payload.jti;
      if (!tokenId) {
        return;
      }

      await this.prisma.session.updateMany({
        where: { tokenId, userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Ignore invalid tokens.
    }
  }

  async listSessions(userId: string): Promise<Session[]> {
    return await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSessionById(userId: string, sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeOtherSessions(
    userId: string,
    currentTokenId: string,
  ): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, tokenId: { not: currentTokenId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string): Promise<AuthenticatedUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthenticatedUser(user);
  }

  private async issueTokensForUser(
    user: User,
    meta?: { ip?: string | null; userAgent?: string | null },
  ): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenEnv =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '';
    const refreshTokenEnv =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '';
    const accessTokenTtl: ExpiresIn =
      accessTokenEnv.length > 0 ? accessTokenEnv : '15m';
    const refreshTokenTtl: ExpiresIn =
      refreshTokenEnv.length > 0 ? refreshTokenEnv : '30d';
    const jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? '';

    if (jwtSecret.length === 0 || refreshSecret.length === 0) {
      throw new Error('JWT secrets are not configured');
    }

    const tokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: accessTokenTtl,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshTokenTtl,
        jwtid: tokenId,
      }),
    ]);

    const refreshExpiresAt = this.computeRefreshExpiry(refreshTokenTtl);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthenticatedUser(user),
    };
  }

  private async rotateSession(
    user: User,
    currentTokenId: string,
    meta?: { ip?: string | null; userAgent?: string | null },
  ): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenEnv =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '';
    const refreshTokenEnv =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '';
    const accessTokenTtl: ExpiresIn =
      accessTokenEnv.length > 0 ? accessTokenEnv : '15m';
    const refreshTokenTtl: ExpiresIn =
      refreshTokenEnv.length > 0 ? refreshTokenEnv : '30d';
    const jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? '';

    if (jwtSecret.length === 0 || refreshSecret.length === 0) {
      throw new Error('JWT secrets are not configured');
    }

    const nextTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: accessTokenTtl,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshTokenTtl,
        jwtid: nextTokenId,
      }),
    ]);

    const refreshExpiresAt = this.computeRefreshExpiry(refreshTokenTtl);

    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { tokenId: currentTokenId, userId: user.id, revokedAt: null },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: nextTokenId,
        },
      }),
      this.prisma.session.create({
        data: {
          userId: user.id,
          tokenId: nextTokenId,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: refreshExpiresAt,
          ip: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: this.toAuthenticatedUser(user),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeRefreshExpiry(expiresIn: ExpiresIn): Date {
    const ms = this.parseDurationToMs(expiresIn);
    return new Date(Date.now() + ms);
  }

  private parseDurationToMs(expiresIn: ExpiresIn): number {
    if (typeof expiresIn === 'number') {
      // jsonwebtoken treats numbers as seconds.
      return expiresIn * 1000;
    }

    const raw = String(expiresIn).trim();
    if (raw.length === 0) {
      return 30 * 24 * 60 * 60 * 1000;
    }

    const match = raw.match(/^([0-9]+)\s*(ms|s|m|h|d)$/i);
    if (!match) {
      const asNumber = Number(raw);
      if (Number.isFinite(asNumber)) {
        return asNumber * 1000;
      }
      return 30 * 24 * 60 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (!Number.isFinite(value) || value <= 0) {
      return 30 * 24 * 60 * 60 * 1000;
    }

    switch (unit) {
      case 'ms':
        return value;
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private toAuthenticatedUser(user: User): AuthenticatedUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    };
  }
}
