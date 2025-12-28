import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { ProposalsController } from './proposals.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [PrismaModule, ContractsModule],
  controllers: [JobsController, ProposalsController],
  providers: [JobsService],
})
export class JobsModule {}
