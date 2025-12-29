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
import { ContractsService } from './contracts.service';
import { ContractDto } from './dto/contract.dto';
import { ContractMessageDto } from './dto/contract-message.dto';
import { SendContractMessageDto } from './dto/send-contract-message.dto';
import { ContractMilestoneDto } from './dto/contract-milestone.dto';
import { CreateContractMilestoneDto } from './dto/create-contract-milestone.dto';
import { ReleaseContractMilestoneDto } from './dto/release-contract-milestone.dto';
import { PayoutContractMilestoneDto } from './dto/payout-contract-milestone.dto';

@Controller({ path: 'contracts', version: '1' })
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.TUTOR)
  @Get('mine')
  async mine(@CurrentUser() user: JwtPayload) {
    const items = await this.service.listMine({
      id: user.sub,
      role: user.role,
    });
    return items.map((c) => ContractDto.fromEntity(c));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.TUTOR, UserRole.ADMIN)
  @Get(':id')
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const contract = await this.service.getById(
      { id: user.sub, role: user.role },
      id,
    );
    return ContractDto.fromEntity(contract);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.TUTOR, UserRole.ADMIN)
  @Get(':id/messages')
  async listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const items = await this.service.listMessages(
      { id: user.sub, role: user.role },
      id,
    );
    return items.map((m) => ContractMessageDto.fromEntity(m));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.TUTOR)
  @Post(':id/messages')
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendContractMessageDto,
  ) {
    const created = await this.service.sendMessage({ id: user.sub }, id, dto);
    return ContractMessageDto.fromEntity(created);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.TUTOR, UserRole.ADMIN)
  @Get(':id/milestones')
  async listMilestones(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const items = await this.service.listMilestones(
      { id: user.sub, role: user.role },
      id,
    );
    return items.map((m) => ContractMilestoneDto.fromEntity(m));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @Post(':id/milestones')
  async createMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateContractMilestoneDto,
  ) {
    const created = await this.service.createMilestone(
      { id: user.sub, role: user.role },
      id,
      dto,
    );
    return ContractMilestoneDto.fromEntity(created);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @Post(':id/milestones/:milestoneId/release')
  async releaseMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('milestoneId', new ParseUUIDPipe()) milestoneId: string,
    @Body() dto: ReleaseContractMilestoneDto,
  ) {
    const updated = await this.service.releaseMilestone(
      { id: user.sub, role: user.role },
      id,
      milestoneId,
      dto,
    );
    return ContractMilestoneDto.fromEntity(updated);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/milestones/:milestoneId/payout')
  async payoutMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('milestoneId', new ParseUUIDPipe()) milestoneId: string,
    @Body() dto: PayoutContractMilestoneDto,
  ) {
    return await this.service.payoutMilestone(
      { id: user.sub, role: user.role },
      id,
      milestoneId,
      dto,
    );
  }
}
