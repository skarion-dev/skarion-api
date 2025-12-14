import { Module } from '@nestjs/common';
import { StripeEventService } from './stripe-event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeEvent } from 'src/entities/stripe-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StripeEvent])],
  providers: [StripeEventService],
  exports: [StripeEventService],
})
export class StripeEventModule {}
