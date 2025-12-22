import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueOptions } from 'bullmq';
import type { QueueConfig } from '../config/queue.config';
import type { RedisConfig } from '../config/redis.config';
import { buildBullConnectionOptions } from './queue.utils';

@Injectable()
export class QueueFactoryService {
  private readonly prefix: string;
  private readonly connection: QueueOptions['connection'];
  private readonly baseJobOptions: QueueOptions['defaultJobOptions'];

  constructor(private readonly configService: ConfigService) {
    const redisConfig = this.configService.get<RedisConfig>('redis');
    const queueConfig = this.configService.get<QueueConfig>('queue');

    this.connection = buildBullConnectionOptions(redisConfig);
    this.prefix = queueConfig?.prefix ?? 'tutorstartup';
    this.baseJobOptions = {
      removeOnComplete: true,
      removeOnFail: 1000,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    };
  }

  createQueue(name: string, options?: QueueOptions): Queue {
    return new Queue(name, {
      ...options,
      prefix: options?.prefix ?? this.prefix,
      connection: options?.connection ?? this.connection,
      defaultJobOptions: {
        ...this.baseJobOptions,
        ...options?.defaultJobOptions,
      },
    });
  }

  getPrefix(): string {
    return this.prefix;
  }
}
