import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../prisma/prisma.enums';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
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

    super({
      clientID,
      clientSecret,
      callbackURL: `${apiPublicUrl}/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
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
        passwordHash: null,
      },
    });
  }
}
