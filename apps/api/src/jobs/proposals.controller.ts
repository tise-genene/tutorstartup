import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../prisma/prisma.enums';
import { JobsService } from './jobs.service';
import { ProposalDto } from './dto/proposal.dto';

@Controller({ path: 'proposals', version: '1' })
export class ProposalsController {
  constructor(private readonly service: JobsService) {}

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
}
