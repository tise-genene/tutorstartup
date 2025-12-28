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
  @Roles(UserRole.PARENT, UserRole.TUTOR)
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
  @Roles(UserRole.PARENT, UserRole.TUTOR)
  @Get(':id/messages')
  async listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const items = await this.service.listMessages({ id: user.sub }, id);
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
}
