import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import type Stripe from 'stripe';
import { StripeEventService } from '../stripe-event/stripe-event.service';
import { Purchase } from 'src/entities/purchase.entity';
import { appConfig } from 'src/config/app-config';
import { CreateCheckoutDto } from './dtos';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class PaymentsService {
  constructor(
    private stripe: StripeService,
    @InjectRepository(Purchase)
    private purchaseRepo: Repository<Purchase>,
    private stripeEventService: StripeEventService,
    private coursesService: CoursesService,
  ) {}

async createCheckoutSession(dto: CreateCheckoutDto, userId?: string) {
  try {
    const { email, courseId } = dto;

    const course = await this.coursesService.findOne(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: course.currency.toLowerCase(),
            unit_amount: Math.round(course.price * 100),
            product_data: {
              name: course.title,
              description: course.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appConfig.env.STRIPE_RETURN_URL}?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${appConfig.env.STRIPE_RETURN_URL}?session_id={CHECKOUT_SESSION_ID}&status=cancel`,
      ...(email ? { customer_email: email } : {}),
      metadata: {
        courseId: course.id,
        userId: userId ?? '',
      },
    });

    const purchase = this.purchaseRepo.create({
      courseId: course.id,
      amount: course.price,
      currency: course.currency,
      status: 'pending',
      stripeSessionId: session.id,
      customerEmail: email,
      userId: userId,
    });

    await this.purchaseRepo.save(purchase);

    return { url: session.url, sessionId: session.id };
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    throw error;
  }
}


  async getPurchaseBySessionId(sessionId: string) {
    if (!sessionId) throw new BadRequestException('Missing sessionId');
    const purchase = await this.purchaseRepo.findOne({
      where: { stripeSessionId: sessionId },
      relations: ['course', 'user'],
    });
    if (!purchase) throw new BadRequestException('Purchase not found');
    return purchase;
  }

  async getUserPurchases(userId: string) {
    return this.purchaseRepo.find({
      where: { userId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
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
        const session = event.data.object as Stripe.Checkout.Session;
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
        const intent = event.data.object as Stripe.PaymentIntent;
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
        const intent = event.data.object as Stripe.PaymentIntent;
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