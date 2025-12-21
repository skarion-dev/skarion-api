import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StripeModule } from '../stripe/stripe.module';
import { Purchase } from 'src/entities/purchase.entity';
import { CoursesModule } from '../courses/courses.module';
import { TeamModule } from '../team/team.module';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  StripeWebhookController,
} from './payments.controller';
import { PaymentsCronsService } from './payment.crons';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase]),
    StripeModule,
    CoursesModule,
    TeamModule,
  ],
  providers: [PaymentsService, PaymentsCronsService],
  controllers: [PaymentsController, StripeWebhookController],
})
export class PaymentsModule {}
