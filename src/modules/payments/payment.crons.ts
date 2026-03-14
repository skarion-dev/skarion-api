import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';

import { Purchase } from 'src/entities/purchase.entity';

import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PaymentsCronsService {
  constructor(
    private stripe: StripeService,
    @InjectRepository(Purchase)
    private purchaseRepo: Repository<Purchase>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cancelledPendingPayments() {
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const result = await this.purchaseRepo.update(
      {
        status: 'pending',
        createdAt: LessThan(tenMinutesAgo),
      },
      {
        status: 'failed',
      },
    );

    if (result.affected && result.affected > 0) {
      console.log(
        `Cancelled ${result.affected} pending purchases older than 10 minutes.`,
      );
    }
  }
}
