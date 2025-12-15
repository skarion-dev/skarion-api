import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StripeModule } from '../stripe/stripe.module';
import { StripeEventModule } from '../stripe-event/stripe-event.module';
import { Purchase } from 'src/entities/purchase.entity';
import { CoursesModule } from '../courses/courses.module';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  StripeWebhookController,
} from './payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase]),
    StripeModule,
    StripeEventModule,
    CoursesModule,
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController, StripeWebhookController],
})
export class PaymentsModule {}
