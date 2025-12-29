import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Req() req: Request,
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    void res;
    await this.authService.register(dto, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    return { ok: true };
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    if (!token || token.trim().length === 0) {
      return res.redirect(`${this.getFrontendUrl()}/auth/login?verified=0`);
    }

    try {
      await this.authService.verifyEmail(token);
      return res.redirect(`${this.getFrontendUrl()}/auth/login?verified=1`);
    } catch {
      return res.redirect(`${this.getFrontendUrl()}/auth/login?verified=0`);
    }
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: { email?: string }) {
    const email = (body.email ?? '').trim();
    if (email.length > 0) {
      await this.authService.requestPasswordReset(email);
    }
    return { ok: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token?: string; password?: string }) {
    const token = (body.token ?? '').trim();
    const password = body.password ?? '';
    if (!token) {
      throw new UnauthorizedException('Missing reset token');
    }
    await this.authService.resetPassword(token, password);
    return { ok: true };
  }

  @Post('login')
  async login(
    @Req() req: Request,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const tokens = await this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user: tokens.user };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const cookieRefreshToken = this.readCookie(
      req,
      this.getRefreshCookieName(),
    );
    if (cookieRefreshToken && this.isCsrfEnabled()) {
      this.assertCsrfAllowed(req);
    }

    const refreshToken = cookieRefreshToken ?? dto.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokens = await this.authService.refresh(refreshToken, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user: tokens.user };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.readCookie(req, this.getRefreshCookieName());
    if (refreshToken && this.isCsrfEnabled()) {
      this.assertCsrfAllowed(req);
    }
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = (req.user ?? null) as { id: string } | null;
    if (!user) {
      return res.redirect(`${this.getFrontendUrl()}/auth/login?oauth=0`);
    }

    const tokens = await this.authService.issueTokensForUserId(user.id, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    this.setRefreshCookie(res, tokens.refreshToken);

    return res.redirect(
      `${this.getFrontendUrl()}/auth/oauth#accessToken=${encodeURIComponent(
        tokens.accessToken,
      )}`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  private getRefreshCookieName(): string {
    return (
      this.configService.get<string>('AUTH_REFRESH_COOKIE_NAME') ??
      'tutorstartup_refresh'
    );
  }

  private getAuthCookiePath(): string {
    const prefix = this.configService.get<string>('API_PREFIX', 'api');
    const version = this.configService.get<string>('API_VERSION', '1');
    return `/${prefix}/v${version}/auth`;
  }

  private setRefreshCookie(res: Response, token: string): void {
    const isProduction =
      (this.configService.get<string>('NODE_ENV') ?? 'development') ===
      'production';

    const secureRaw = this.configService.get<string>(
      'AUTH_REFRESH_COOKIE_SECURE',
    );
    const secure =
      secureRaw === undefined
        ? isProduction
        : ['true', '1', 'yes', 'y', 'on'].includes(secureRaw.toLowerCase());

    const domain = this.configService.get<string>('AUTH_REFRESH_COOKIE_DOMAIN');
    const maxAgeDaysRaw = this.configService.get<string>(
      'AUTH_REFRESH_COOKIE_MAXAGE_DAYS',
    );
    const maxAgeDays = maxAgeDaysRaw ? Number(maxAgeDaysRaw) : 30;
    const maxAgeMs =
      Number.isFinite(maxAgeDays) && maxAgeDays > 0
        ? maxAgeDays * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

    res.cookie(this.getRefreshCookieName(), token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: this.getAuthCookiePath(),
      maxAge: maxAgeMs,
      domain: domain && domain.trim().length > 0 ? domain.trim() : undefined,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const domain = this.configService.get<string>('AUTH_REFRESH_COOKIE_DOMAIN');
    res.clearCookie(this.getRefreshCookieName(), {
      path: this.getAuthCookiePath(),
      domain: domain && domain.trim().length > 0 ? domain.trim() : undefined,
    });
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

  private isCsrfEnabled(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const raw = this.configService.get<string>('AUTH_CSRF_ENABLED');
    if (!raw || raw.trim().length === 0) {
      return nodeEnv === 'production';
    }

    return ['true', '1', 'yes', 'y', 'on'].includes(raw.toLowerCase());
  }

  private getTrustedOrigins(): string[] {
    return (this.configService.get<string>('FRONTEND_URL') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  private getFrontendUrl(): string {
    const url = (this.configService.get<string>('FRONTEND_URL') ?? '')
      .split(',')[0]
      .trim();
    return (url.length > 0 ? url : 'http://localhost:3000').replace(/\/$/, '');
  }

  private assertCsrfAllowed(req: Request): void {
    const trustedOrigins = this.getTrustedOrigins();
    if (trustedOrigins.length === 0) {
      return;
    }

    const originHeader = req.get('origin');
    const refererHeader = req.get('referer');

    const origin =
      originHeader ?? this.extractOriginFromReferer(refererHeader ?? null);

    if (!origin) {
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      if (nodeEnv === 'production') {
        throw new ForbiddenException('CSRF protection: missing Origin/Referer');
      }
      return;
    }

    if (!trustedOrigins.includes(origin)) {
      throw new ForbiddenException('CSRF protection: origin not allowed');
    }
  }

  private extractOriginFromReferer(referer: string | null): string | null {
    if (!referer) {
      return null;
    }

    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      return null;
    }
  }
}
