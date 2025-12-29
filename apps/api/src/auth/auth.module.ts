import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthSessionsController } from './auth-sessions.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { NotificationsModule } from '../notifications/notifications.module';
import { SessionCleanupService } from './session-cleanup.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    NotificationsModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        type ExpiresIn = string | number;
        const rawExpiresIn = configService.get<string>('JWT_EXPIRES_IN') ?? '';
        const expiresIn: ExpiresIn =
          rawExpiresIn.length > 0 ? rawExpiresIn : '15m';

        const jwtSecret = configService.get<string>('JWT_SECRET') ?? '';
        if (jwtSecret.length === 0) {
          throw new Error('JWT_SECRET not configured');
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController, AuthSessionsController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, SessionCleanupService],
  exports: [AuthService],
})
export class AuthModule {}
