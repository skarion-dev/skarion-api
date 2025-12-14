import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StripeEvent } from 'src/entities/stripe-event.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StripeEventService {
  constructor(
    @InjectRepository(StripeEvent)
    private stripeEventRepo: Repository<StripeEvent>,
  ) {}

  async log(type: string, payload: unknown) {
    const event = this.stripeEventRepo.create({ type, payload });
    return this.stripeEventRepo.save(event);
  }
}
