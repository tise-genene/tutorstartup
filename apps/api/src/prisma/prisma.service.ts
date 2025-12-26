import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import './prisma-engine.guard';

import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');

    // Guardrail for local dev: if a global env var forces Data Proxy,
    // Prisma will reject normal postgresql:// URLs with a confusing error.
    const isDataProxyUrl =
      databaseUrl.startsWith('prisma://') ||
      databaseUrl.startsWith('prisma+postgres://');
    if (
      !isDataProxyUrl &&
      process.env.PRISMA_CLIENT_ENGINE_TYPE === 'dataproxy'
    ) {
      process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
    }

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
