import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';

@Injectable()
export class BookingCronsService {
  private readonly logger = new Logger(BookingCronsService.name);

  constructor(private readonly bookingsService: BookingsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders() {
    try {
      await this.bookingsService.sendUpcomingBookingReminders();
    } catch (error) {
      this.logger.error(
        'Failed to send booking reminders',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
