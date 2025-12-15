import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { StripeEventModule } from './modules/stripe-event/stripe-event.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CoursesModule } from './modules/courses/courses.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    StripeModule,
    StripeEventModule,
    PaymentsModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
