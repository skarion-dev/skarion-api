import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { StripeEventModule } from './modules/stripe-event/stripe-event.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    StripeModule,
    StripeEventModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
