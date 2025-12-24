import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    NotificationsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<Record<string, string>>,
      ): JwtModuleOptions => {
        type ExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;
        const rawExpiresIn = configService.get<string>('JWT_EXPIRES_IN');
        const expiresIn: ExpiresIn =
          typeof rawExpiresIn === 'string' && rawExpiresIn.length > 0
            ? rawExpiresIn
            : '15m';

        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (typeof jwtSecret !== 'string' || jwtSecret.length === 0) {
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
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
