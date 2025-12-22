import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueHealthService } from '../queue/queue.health';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly queueHealth: QueueHealthService,
  ) {}

  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    const components: Record<string, string> = {};
    let status: 'ok' | 'error' = 'ok';

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      components.database = 'up';
    } catch (error) {
      status = 'error';
      components.database =
        error instanceof Error ? `down: ${error.message}` : 'down: unknown';
    }

    try {
      await this.redisService.ping();
      components.redis = 'up';
    } catch (error) {
      status = 'error';
      components.redis =
        error instanceof Error ? `down: ${error.message}` : 'down: unknown';
    }

    try {
      await this.queueHealth.check();
      components.queue = 'up';
    } catch (error) {
      status = 'error';
      components.queue =
        error instanceof Error ? `down: ${error.message}` : 'down: unknown';
    }

    return {
      status,
      components,
      timestamp: new Date().toISOString(),
    };
  }
}
