import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import type { RedisOptions } from 'ioredis';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import { IncomingMessage } from 'node:http';
import cacheConfig from './config/cache.config';
import { configValidationSchema } from './config/config.validation';
import queueConfig from './config/queue.config';
import redisConfig from './config/redis.config';
import searchConfig from './config/search.config';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TutorsModule } from './tutors/tutors.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LessonRequestsModule } from './lesson-requests/lesson-requests.module';
import { JobsModule } from './jobs/jobs.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: configValidationSchema,
      cache: true,
      expandVariables: true,
      load: [cacheConfig, queueConfig, searchConfig, redisConfig],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          genReqId: (req: IncomingMessage) => {
            const headerValue = req.headers['x-request-id'];
            const requestId = Array.isArray(headerValue)
              ? headerValue[0]
              : headerValue;
            return requestId ?? randomUUID();
          },
          customProps: () => ({ context: 'HTTP' }),
          transport:
            configService.get<string>('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true },
                }
              : undefined,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttlerDriver = configService
          .get<string>('RATE_LIMIT_DRIVER', 'memory')
          .toLowerCase();

        const redisUrl = configService.get<string>('REDIS_URL');
        const redisOptions: RedisOptions = {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password:
            configService.get<string>('REDIS_PASSWORD', '') || undefined,
          db: configService.get<number>('REDIS_DB', 0),
          lazyConnect: true,
        };

        let storage: ThrottlerStorageRedisService | undefined;
        if (throttlerDriver === 'redis') {
          storage =
            redisUrl && redisUrl.trim().length > 0
              ? new ThrottlerStorageRedisService(redisUrl)
              : new ThrottlerStorageRedisService(redisOptions);
        }

        return {
          storage,
          throttlers: [
            {
              ttl: configService.get<number>('RATE_LIMIT_TTL', 60),
              limit: configService.get<number>('RATE_LIMIT_MAX', 100),
            },
          ],
        };
      },
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    SearchModule,
    NotificationsModule,
    LessonRequestsModule,
    JobsModule,
    AuthModule,
    UsersModule,
    TutorsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
  ],
})
export class AppModule {}
