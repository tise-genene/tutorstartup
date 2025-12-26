import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Important: this must run BEFORE @prisma/client is loaded.
// Guardrail for local dev: if PRISMA_CLIENT_ENGINE_TYPE is set globally to
// Data Proxy, Prisma will reject normal postgresql:// URLs with a confusing
// "must start with prisma://" error.
const prismaEngineType = (
  process.env.PRISMA_CLIENT_ENGINE_TYPE ?? ''
).toLowerCase();
const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();
if (
  nodeEnv !== 'production' &&
  (prismaEngineType === 'dataproxy' || prismaEngineType === 'data-proxy')
) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } =
  require('@prisma/client') as typeof import('@prisma/client');

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
