import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../prisma/prisma.enums';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const clientID = (
      configService.get<string>('GOOGLE_CLIENT_ID') ?? ''
    ).trim();
    const clientSecret = (
      configService.get<string>('GOOGLE_CLIENT_SECRET') ?? ''
    ).trim();

    const apiPublicUrl = (
      configService.get<string>('API_PUBLIC_URL') ?? 'http://localhost:4000/api'
    ).replace(/\/$/, '');

    const enabled = clientID.length > 0 && clientSecret.length > 0;
    super({
      clientID: enabled ? clientID : 'disabled',
      clientSecret: enabled ? clientSecret : 'disabled',
      callbackURL: `${apiPublicUrl}/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });

    if (!enabled) {
      // Passport throws if clientID is missing, so we provide placeholders.
      // This keeps the API booting (signup/login still work) even if Google isn't configured yet.
      this.logger.warn(
        'Google OAuth not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET). Google sign-in is disabled until configured.',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      displayName?: string;
      emails?: Array<{ value: string }>;
    },
  ) {
    const googleId = String(profile.id);
    const email = (profile.emails?.[0]?.value ?? '').toLowerCase().trim();
    const name = (profile.displayName ?? '').trim();

    const existingByGoogle = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (existingByGoogle) {
      return existingByGoogle;
    }

    if (!email) {
      // Google should always provide an email for standard accounts.
      // If not, we fail by returning null; guard will treat as unauthorized.
      return null;
    }

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      return await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId,
          isVerified: true,
          name: existingByEmail.name || name || existingByEmail.email,
        },
      });
    }

    return await this.prisma.user.create({
      data: {
        email,
        name: name || email,
        role: UserRole.STUDENT,
        googleId,
        isVerified: true,
      },
    });
  }
}
