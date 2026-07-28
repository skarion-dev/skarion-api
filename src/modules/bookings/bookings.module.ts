import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Reflector } from '@nestjs/core';
import { Booking } from 'src/entities/booking.entity';
import { BookingSettings } from 'src/entities/booking-settings.entity';
import { MailerModule } from '../mailer/mailer.module';
import { EtlModule } from '../etl/etl.module';
import { BookingCronsService } from './booking.crons';
import { BookingsController } from './bookings.controller';
import { BookingsAdminController } from './bookings-admin.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingSettings]),
    MulterModule.register({ storage: undefined }), // memory storage (buffer)
    MailerModule,
    EtlModule,
  ],
  controllers: [BookingsController, BookingsAdminController],
  providers: [BookingsService, BookingCronsService, Reflector],
  exports: [BookingsService],
})
export class BookingsModule {}
