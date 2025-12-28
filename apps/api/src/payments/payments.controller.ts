import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { PaymentsService } from './payments.service';

@Controller({ path: 'contracts', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/payments/intent')
  @Roles(UserRole.PARENT)
  async createIntent(
    @CurrentUser() user: any,
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
  @Get(':id/payments')
  @Roles(UserRole.PARENT, UserRole.TUTOR)
  async listContractPayments(
    @CurrentUser() user: any,
    @Param('id') contractId: string,
  ) {
    return await this.payments.listContractPayments(
      { id: user.id, role: user.role },
      contractId,
    );
  }
}

@Controller({ path: 'payments', version: '1' })
export class PaymentsWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  // Minimal webhook receiver. Configure Chapa to POST here.
  @Post('chapa/webhook')
  async chapaWebhook(@Req() req: Request, @Body() body: any) {
    // Note: signature verification is not implemented yet.
    // We still enforce idempotency via stored payment reference + ledger idempotency key.
    return await this.payments.handleChapaWebhook(body ?? req.body);
  }
}
