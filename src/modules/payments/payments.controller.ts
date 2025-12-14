import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Headers,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckout(@Body('email') email?: string) {
    return this.paymentsService.createCheckoutSession(email);
  }

  @Get('course')
  getCourse() {
    return this.paymentsService.getCourse();
  }

  @Get('purchase/:sessionId')
  async getPurchase(@Param('sessionId') sessionId: string) {
    return this.paymentsService.getPurchaseBySessionId(sessionId);
  }
}

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: Request,
  ) {
    const raw = req.body as unknown as Buffer;
    return this.paymentsService.handleWebhook(signature, raw);
  }
}
