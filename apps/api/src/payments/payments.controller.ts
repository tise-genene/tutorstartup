import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../prisma/prisma.enums';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateMilestonePaymentIntentDto } from './dto/create-milestone-payment-intent.dto';
import { PaymentsService } from './payments.service';
import { PaginationDto } from '../common/dto/pagination.dto';

type CurrentUserPayload = {
  id: string;
  role: UserRole;
  email: string;
  name: string;
};

@Controller({ path: 'contracts', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/payments/intent')
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  async createIntent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') contractId: string,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return await this.payments.createContractPaymentIntent(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      contractId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/milestones/:milestoneId/payments/intent')
  @Roles(UserRole.PARENT, UserRole.STUDENT)
  async createMilestoneIntent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') contractId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: CreateMilestonePaymentIntentDto,
  ) {
    return await this.payments.createMilestonePaymentIntent(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      contractId,
      milestoneId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id/payments')
  @Roles(UserRole.PARENT, UserRole.TUTOR, UserRole.ADMIN)
  async listContractPayments(
    @CurrentUser() user: Pick<CurrentUserPayload, 'id' | 'role'>,
    @Param('id') contractId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.payments.listContractPayments(
      { id: user.id, role: user.role },
      contractId,
      pagination,
    );
  }
}

@Controller({ path: 'payments', version: '1' })
export class PaymentsWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  // Chapa calls callback_url with a GET after payment completion.
  @Get('chapa/callback')
  async chapaCallback(@Query() query: unknown, @Req() req: Request) {
    return await this.payments.handleChapaCallback(query ?? req.query);
  }

  // Minimal webhook receiver. Configure Chapa to POST here.
  @Post('chapa/webhook')
  async chapaWebhook(@Req() req: Request, @Body() body: unknown) {
    return await this.payments.handleChapaWebhook(
      body ?? req.body,
      req.headers as unknown as Record<string, unknown>,
    );
  }
}
