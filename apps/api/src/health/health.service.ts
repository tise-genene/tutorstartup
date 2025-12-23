import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueHealthService } from '../queue/queue.health';
import { SearchService } from '../search/search.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly queueHealth: QueueHealthService,
    private readonly searchService: SearchService,
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

    const timeoutMs = 2000;

    try {
      await this.withTimeout(
        this.prisma.$queryRawUnsafe('SELECT 1'),
        timeoutMs,
      );
      components.database = 'up';
    } catch (error) {
      status = 'error';
      components.database =
        error instanceof Error ? `down: ${error.message}` : 'down: unknown';
    }

    try {
      await this.withTimeout(this.redisService.ping(), timeoutMs);
      components.redis = 'up';
    } catch (error) {
      status = 'error';
      components.redis =
        error instanceof Error ? `down: ${error.message}` : 'down: unknown';
    }

    try {
      await this.withTimeout(this.queueHealth.check(), timeoutMs);
      components.queue = 'up';
    } catch (error) {
      status = 'error';
      components.queue =
        error instanceof Error ? `down: ${error.message}` : 'down: unknown';
    }

    if (!this.searchService.isEnabled()) {
      components.search = 'disabled';
    } else {
      try {
        await this.withTimeout(this.searchService.checkHealth(), timeoutMs);
        components.search = 'up';
      } catch (error) {
        status = 'error';
        components.search =
          error instanceof Error ? `down: ${error.message}` : 'down: unknown';
      }
    }

    return {
      status,
      components,
      timestamp: new Date().toISOString(),
    };
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;
    const timer = new Promise<never>((_, reject) => {
      timeout = setTimeout(
        () => reject(new Error(`timeout after ${ms}ms`)),
        ms,
      );
    });

    try {
      return await Promise.race([promise, timer]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
