import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LessonRequestsController } from './lesson-requests.controller';
import { LessonRequestsService } from './lesson-requests.service';

@Module({
  imports: [PrismaModule],
  controllers: [LessonRequestsController],
  providers: [LessonRequestsService],
})
export class LessonRequestsModule {}
