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
import {
  CreateCheckoutDto,
  CheckoutResponse,
  PurchaseResponse,
  WebhookResponse,
} from './dtos';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { type IAuthenticatedUser } from 'src/common/interfaces/current-user-payload.interface';
import { RequireAuth } from 'src/common/decorator/require-auth.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout')
  @RequireAuth()
  @ApiOperation({ summary: 'Create checkout session' })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created',
    type: CheckoutResponse,
  })
  async createCheckout(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @CurrentUser() user: IAuthenticatedUser,
  ) {
    return this.paymentsService.createCheckoutSession(
      createCheckoutDto,
      user.id,
    );
  }

  @Get('history')
  @RequireAuth()
  @ApiOperation({ summary: 'Get purchase history' })
  @ApiResponse({
    status: 200,
    description: 'User purchase history',
    type: [PurchaseResponse],
  })
  async getHistory(@CurrentUser() user: IAuthenticatedUser) {
    return this.paymentsService.getUserPurchases(user.id);
  }

  @Get('purchase/:sessionId')
  @ApiOperation({ summary: 'Get purchase details by session ID' })
  @RequireAuth()
  @ApiResponse({
    status: 200,
    description: 'Purchase details retrieved',
    type: PurchaseResponse,
  })
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
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
    type: WebhookResponse,
  })
  @ApiBody({ description: 'Raw Stripe event data', required: true })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: Request,
  ) {
    const raw = req.body as unknown as Buffer;
    return this.paymentsService.handleWebhook(signature, raw);
  }
}
