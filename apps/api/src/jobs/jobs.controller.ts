import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { UpdateJobDto } from './dto/update-job.dto';
import { JobDto } from './dto/job.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ProposalDto } from './dto/proposal.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  constructor(private readonly service: JobsService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
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
  async listOpen(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    const items = await this.service.listOpenJobs({
      id: user.sub,
      role: user.role,
    }, pagination);
    return items.map((job) => JobDto.fromEntity(job));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  @Get('mine')
  async listMine(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    const items = await this.service.listMyJobs({
      id: user.sub,
      role: user.role,
    }, pagination);
    return items.map((job) => JobDto.fromEntity(job));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  @Post(':id/close')
  async close(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const updated = await this.service.closeJob(
      { id: user.sub, role: user.role },
      id,
    );
    return JobDto.fromEntity(updated);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateJobDto,
  ) {
    const updated = await this.service.updateJob(
      { id: user.sub, role: user.role },
      id,
      dto,
    );
    return JobDto.fromEntity(updated);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  @Post(':id/publish')
  async publish(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const updated = await this.service.publishJob(
      { id: user.sub, role: user.role },
      id,
    );
    return JobDto.fromEntity(updated);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.STUDENT, UserRole.TUTOR)
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
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  @Get(':id/proposals')
  async proposalsForJob(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() pagination: PaginationDto,
  ) {
    const items = await this.service.listProposalsForJob(
      { id: user.sub, role: user.role },
      id,
      pagination,
    );
    return items.map((p) => ({
      ...ProposalDto.fromEntity(p),
      tutor: p.tutor,
    }));
  }
}
