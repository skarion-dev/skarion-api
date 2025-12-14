import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import type Stripe from 'stripe';
import { StripeEventService } from '../stripe-event/stripe-event.service';
import { Purchase } from 'src/entities/purchase.entity';
import { appConfig } from 'src/config/app-config';
import { CreateCheckoutDto } from './dtos';

const course = {
  id: 'course_001',
  title: 'Skarion Course',
  description: 'Introductory course',
  amount: 4999,
  currency: 'usd',
};

@Injectable()
export class PaymentsService {
  constructor(
    private stripe: StripeService,
    @InjectRepository(Purchase)
    private purchaseRepo: Repository<Purchase>,
    private stripeEventService: StripeEventService,
  ) {}

  async createCheckoutSession(dto: CreateCheckoutDto) {
    const { email } = dto;
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: course.currency,
            unit_amount: course.amount,
            product_data: {
              name: course.title,
              description: course.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url:
        'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
      customer_email: email,
    });

    const purchase = this.purchaseRepo.create({
      courseId: course.id,
      courseTitle: course.title,
      amount: course.amount,
      currency: course.currency,
      status: 'pending',
      stripeSessionId: session.id,
      customerEmail: email,
    });
    await this.purchaseRepo.save(purchase);

    return { url: session.url, sessionId: session.id };
  }

  getCourse() {
    return course;
  }

  async getPurchaseBySessionId(sessionId: string) {
    if (!sessionId) throw new BadRequestException('Missing sessionId');
    const purchase = await this.purchaseRepo.findOne({
      where: { stripeSessionId: sessionId },
    });
    if (!purchase) throw new BadRequestException('Purchase not found');
    return purchase;
  }

  async handleWebhook(signature: string | undefined, rawBody: Buffer) {
    if (!rawBody) throw new BadRequestException('Invalid body');

    let event: Stripe.Event;
    const secret = appConfig.env.STRIPE_WEBHOOK_SECRET;
    if (secret && signature) {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } else {
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    }

    // await this.stripeEventService.log(event.type, event);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const pi = session.payment_intent as string | undefined;
        const purchase = await this.purchaseRepo.findOne({
          where: { stripeSessionId: session.id },
        });
        if (purchase) {
          purchase.status = 'paid';
          purchase.stripePaymentIntentId = pi;
          await this.purchaseRepo.save(purchase);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        const purchase = await this.purchaseRepo.findOne({
          where: { stripePaymentIntentId: intent.id },
        });
        if (purchase) {
          purchase.status = 'failed';
          await this.purchaseRepo.save(purchase);
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const purchase = await this.purchaseRepo.findOne({
          where: { stripePaymentIntentId: intent.id },
        });
        if (purchase) {
          purchase.status = 'paid';
          await this.purchaseRepo.save(purchase);
        }
        break;
      }
      default:
        break;
    }

    return { received: true };
  }
}
