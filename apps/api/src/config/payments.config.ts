import { registerAs } from '@nestjs/config';

export interface PaymentsConfig {
  chapaBaseUrl: string;
  chapaSecretKey: string;
  chapaWebhookSecret: string;
  apiPublicUrl: string;
  frontendUrl: string;
  brandName: string;
}

const trimOrDefault = (
  value: string | undefined | null,
  fallback: string,
): string => {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const normalizeUrl = (value: string, fallback: string): string => {
  const base = trimOrDefault(value, fallback);
  return base.replace(/\/$/, '');
};

export const paymentsConfig = registerAs<PaymentsConfig>('payments', () => {
  //const nodeEnv = process.env.NODE_ENV ?? 'development';

  const defaultChapaBaseUrl = 'https://api.chapa.co/v1';
  const defaultFrontendUrl = 'http://localhost:3000';
  const defaultApiPublicUrl = 'http://localhost:4000/api';
  const defaultBrandName = 'TutorStartup';

  // FRONTEND_URL can be a comma-separated list; pick the primary.
  const rawFrontend = process.env.FRONTEND_URL ?? defaultFrontendUrl;
  const primaryFrontend =
    rawFrontend.split(',')[0]?.trim() || defaultFrontendUrl;

  const chapaBaseUrlEnv = process.env.CHAPA_BASE_URL;
  const apiPublicUrlEnv = process.env.API_PUBLIC_URL;

  return {
    chapaBaseUrl: normalizeUrl(
      chapaBaseUrlEnv ?? defaultChapaBaseUrl,
      defaultChapaBaseUrl,
    ),
    chapaSecretKey: trimOrDefault(process.env.CHAPA_SECRET_KEY, ''),
    chapaWebhookSecret: trimOrDefault(process.env.CHAPA_WEBHOOK_SECRET, ''),
    apiPublicUrl: normalizeUrl(
      apiPublicUrlEnv ?? defaultApiPublicUrl,
      defaultApiPublicUrl,
    ),
    frontendUrl: normalizeUrl(primaryFrontend, defaultFrontendUrl),
    brandName: trimOrDefault(process.env.BRAND_NAME, defaultBrandName),
  } satisfies PaymentsConfig;
});

export default paymentsConfig;
