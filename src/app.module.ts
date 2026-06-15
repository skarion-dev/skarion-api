import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { StripeEventModule } from './modules/stripe-event/stripe-event.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from './modules/mailer/mailer.module';
import { TeamModule } from './modules/team/team.module';
import { MicrosoftModule } from './modules/microsoft/microsoft.module';
import { UsersModule } from './modules/users/users.module';
import { FormsModule } from './modules/forms/forms.module';
import { EtlModule } from './modules/etl/etl.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    StripeModule,
    StripeEventModule,
    PaymentsModule,
    CoursesModule,
    ScheduleModule.forRoot(),
    MailerModule,
    TeamModule,
    MicrosoftModule,
    UsersModule,
    FormsModule,
    EtlModule,
    JobsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
