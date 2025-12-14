import { Injectable } from '@nestjs/common';
import { appConfig } from 'src/config/app-config';
import Stripe from 'stripe';

@Injectable()
export class StripeService extends Stripe {
  constructor() {
    const secret = appConfig.env.STRIPE_KEY;
    if (!secret) {
      throw new Error('Stripe secret key env not found');
    }
    super(secret, { telemetry: false });
  }
}
