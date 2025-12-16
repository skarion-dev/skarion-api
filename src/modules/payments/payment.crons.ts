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

//   @Cron(CronExpression.EVERY_5_MINUTES)
  async cancelledPendingPayments() {
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const purchases = await this.purchaseRepo.find({
      where: {
        status: 'pending',
        createdAt: LessThan(tenMinutesAgo),
      },
    });

    if (purchases.length > 0) {
      console.log(`Cancelling ${purchases.length} pending purchases older than 10 minutes.`);
      for (const purchase of purchases) {
        purchase.status = 'failed';
        await this.purchaseRepo.save(purchase);
      }
    }
  }
}
