import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../prisma/prisma.enums';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobDto } from './dto/job.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ProposalDto } from './dto/proposal.dto';

@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @Post()
  async createJob(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobDto) {
    const created = await this.service.createJob(
      { id: user.sub, role: user.role },
      dto,
    );
    return JobDto.fromEntity(created);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Get('open')
  async listOpen(@CurrentUser() user: JwtPayload) {
    const items = await this.service.listOpenJobs({
      id: user.sub,
      role: user.role,
    });
    return items.map((job) => JobDto.fromEntity(job));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @Get('mine')
  async listMine(@CurrentUser() user: JwtPayload) {
    const items = await this.service.listMyJobs({
      id: user.sub,
      role: user.role,
    });
    return items.map((job) => JobDto.fromEntity(job));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.TUTOR)
  @Get(':id')
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const job = await this.service.getJobById(
      { id: user.sub, role: user.role },
      id,
    );
    return JobDto.fromEntity(job);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Post(':id/proposals')
  async submitProposal(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateProposalDto,
  ) {
    const proposal = await this.service.submitProposal(
      { id: user.sub, role: user.role },
      id,
      dto,
    );
    return ProposalDto.fromEntity(proposal);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @Get(':id/proposals')
  async proposalsForJob(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const items = await this.service.listProposalsForJob(
      { id: user.sub, role: user.role },
      id,
    );
    return items.map((p) => ({
      ...ProposalDto.fromEntity(p),
      tutor: p.tutor,
    }));
  }
}
