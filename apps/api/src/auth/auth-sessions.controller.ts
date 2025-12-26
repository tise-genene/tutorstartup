import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';
import { SessionDto } from './dto/session.dto';

@Controller({ path: 'auth/sessions', version: '1' })
export class AuthSessionsController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: Request, @CurrentUser() user: JwtPayload) {
    const currentTokenId = await this.getCurrentRefreshTokenId(req, user.sub);
    const sessions = await this.authService.listSessions(user.sub);
    return sessions.map((session) =>
      SessionDto.fromEntity(session, { currentTokenId }),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':sessionId/revoke')
  async revokeOne(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
  ) {
    await this.authService.revokeSessionById(user.sub, sessionId);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('revoke-others')
  async revokeOthers(@Req() req: Request, @CurrentUser() user: JwtPayload) {
    const currentTokenId = await this.getCurrentRefreshTokenId(req, user.sub);
    if (!currentTokenId) {
      throw new UnauthorizedException('Missing refresh session');
    }

    await this.authService.revokeOtherSessions(user.sub, currentTokenId);
    return { ok: true };
  }

  private getRefreshCookieName(): string {
    return (
      this.configService.get<string>('AUTH_REFRESH_COOKIE_NAME') ??
      'tutorstartup_refresh'
    );
  }

  private readCookie(req: Request, name: string): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const index = pair.indexOf('=');
      if (index === -1) {
        continue;
      }
      const rawKey = pair.slice(0, index).trim();
      if (rawKey !== name) {
        continue;
      }

      const rawValue = pair.slice(index + 1).trim();
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }

    return null;
  }

  private async getCurrentRefreshTokenId(
    req: Request,
    userId: string,
  ): Promise<string | null> {
    const refreshToken = this.readCookie(req, this.getRefreshCookieName());
    if (!refreshToken) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.sub !== userId) {
        return null;
      }

      return payload.jti ?? null;
    } catch {
      return null;
    }
  }
}
