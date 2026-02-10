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
      removeOnComplete: {
        age: 3600, // keep for 1 hour
        count: 1000,
      },
      removeOnFail: {
        age: 24 * 3600 * 7, // keep for 7 days
        count: 5000,
      },
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5s
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
