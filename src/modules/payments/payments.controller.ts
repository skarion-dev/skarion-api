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
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dtos';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  async createCheckout(@Body() createCheckoutDto: CreateCheckoutDto) {
    return this.paymentsService.createCheckoutSession(createCheckoutDto);
  }

  @Get('course')
  @ApiOperation({ summary: 'Get course details' })
  @ApiResponse({ status: 200, description: 'Course details retrieved' })
  getCourse() {
    return this.paymentsService.getCourse();
  }

  @Get('purchase/:sessionId')
  @ApiOperation({ summary: 'Get purchase details by session ID' })
  @ApiResponse({ status: 200, description: 'Purchase details retrieved' })
  async getPurchase(@Param('sessionId') sessionId: string) {
    return this.paymentsService.getPurchaseBySessionId(sessionId);
  }
}

@ApiTags('Webhooks')
@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiBody({ description: 'Raw Stripe event data', required: true })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: Request,
  ) {
    const raw = req.body as unknown as Buffer;
    return this.paymentsService.handleWebhook(signature, raw);
  }
}
