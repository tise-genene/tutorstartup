// Ensures local dev doesn't accidentally use Prisma Data Proxy engine.
//
// If PRISMA_CLIENT_ENGINE_TYPE is set globally to "dataproxy", Prisma will
// reject normal postgresql:// URLs with a confusing "must start with prisma://" error.
//
// This file must be imported before ANY other imports that touch @prisma/client.

const prismaEngineType = (
  process.env.PRISMA_CLIENT_ENGINE_TYPE ?? ''
).toLowerCase();
const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();
const isDataProxyUrl =
  databaseUrl.startsWith('prisma://') ||
  databaseUrl.startsWith('prisma+postgres://');

if (nodeEnv !== 'production') {
  // If the datasource isn't explicitly using Data Proxy protocols, force the
  // local Prisma engine. This prevents local dev crashes when a machine-wide
  // config (or tool) nudges Prisma into Data Proxy mode.
  if (!isDataProxyUrl) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
  } else if (
    prismaEngineType !== 'dataproxy' &&
    prismaEngineType !== 'data-proxy'
  ) {
    // If the URL is Data Proxy but engine type isn't set, keep Prisma defaults.
  }
}
