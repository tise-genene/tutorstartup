import { registerAs } from '@nestjs/config';

export type QueueDriver = 'redis' | 'memory';

export interface QueueConfig {
  driver: QueueDriver;
  prefix: string;
}

const toPrefix = (prefix: string | undefined): string => {
  if (!prefix || !prefix.trim()) {
    return 'tutorstartup';
  }
  return prefix.trim();
};

export const queueConfig = registerAs<QueueConfig>('queue', (): QueueConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const fallbackDriver: QueueDriver = nodeEnv === 'test' ? 'memory' : 'redis';

  return {
    driver:
      (process.env.QUEUE_DRIVER as QueueDriver | undefined) ?? fallbackDriver,
    prefix: toPrefix(process.env.QUEUE_PREFIX),
  };
});

export default queueConfig;
