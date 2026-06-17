import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/entities/booking.entity';
import { MailerModule } from '../mailer/mailer.module';
import { BookingCronsService } from './booking.crons';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), MailerModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingCronsService],
  exports: [BookingsService],
})
export class BookingsModule {}
