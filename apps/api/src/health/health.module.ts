import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { RedisModule } from '../redis/redis.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [RedisModule, QueueModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
