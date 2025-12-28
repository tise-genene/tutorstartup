import {
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
import { ProposalDto } from './dto/proposal.dto';
import { ContractsService } from '../contracts/contracts.service';
import { ContractDto } from '../contracts/dto/contract.dto';

@Controller({ path: 'proposals', version: '1' })
export class ProposalsController {
  constructor(
    private readonly service: JobsService,
    private readonly contracts: ContractsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Get('mine')
  async mine(@CurrentUser() user: JwtPayload) {
    const items = await this.service.listMyProposals({
      id: user.sub,
      role: user.role,
    });
    return items.map((proposal) => ProposalDto.fromEntity(proposal));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @Post(':id/withdraw')
  async withdraw(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const updated = await this.service.withdrawProposal(
      { id: user.sub, role: user.role },
      id,
    );
    return ProposalDto.fromEntity(updated);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @Post(':id/decline')
  async decline(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const updated = await this.service.declineProposal(
      { id: user.sub, role: user.role },
      id,
    );
    return ProposalDto.fromEntity(updated);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @Post(':id/accept')
  async accept(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const contract = await this.contracts.createFromProposal(
      { id: user.sub, role: user.role },
      id,
    );
    return ContractDto.fromEntity(contract);
  }
}
