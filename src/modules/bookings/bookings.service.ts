import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { addDays, addMinutes } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { randomUUID } from 'crypto';
import { Between, IsNull, Repository } from 'typeorm';
import { Booking } from 'src/entities/booking.entity';
import { MailerService } from '../mailer/mailer.service';
import { MicrosoftService } from '../microsoft/microsoft.service';
import { buildMeetingConfirmationEmail, buildMeetingConfirmationText, buildBookingReminderEmail, buildBookingReminderText, buildInternalBookingNotificationEmail, buildInternalBookingNotificationText } from '../mailer/email-templates.service';
import {
  bookingSlotDefinitions,
  type BookingAvailabilityResponse,
  type BookingResponse,
  CreateBookingDto,
} from './dtos';

type SlotResult = {
  date: string;
  value: string;
  label: string;
  startAt: Date;
  endAt: Date;
};

type MicrosoftCalendarEventResponse = {
  id: string;
  webLink?: string;
  onlineMeeting?: {
    joinUrl?: string;
  };
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly graphBaseUrl = 'https://graph.microsoft.com/v1.0';
  private readonly timezone =
    process.env.BOOKING_TIMEZONE || 'America/New_York';
  private readonly timezoneLabel =
    process.env.BOOKING_TIMEZONE_LABEL || 'Eastern Time';
  private readonly durationMinutes = Number(
    process.env.BOOKING_DURATION_MINUTES || 30,
  );
  private readonly availabilityDays = Number(
    process.env.BOOKING_AVAILABILITY_DAYS || 30,
  );
  private readonly minimumLeadHours = Number(
    process.env.BOOKING_MIN_LEAD_HOURS || 2,
  );
  private readonly senderEmail = process.env.DEFAULT_FROM_EMAIL || '';
  private readonly organizerEmail = process.env.BOOKING_ORGANIZER_EMAIL || '';
  private readonly internalNotificationRecipients = this.parseEmailList(
    process.env.BOOKING_INTERNAL_NOTIFY_EMAILS,
  ).length
    ? this.parseEmailList(process.env.BOOKING_INTERNAL_NOTIFY_EMAILS)
    : this.parseEmailList(
      process.env.BOOKING_INTERNAL_NOTIFY_EMAIL || this.senderEmail,
    );

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly mailerService: MailerService,
    private readonly microsoftService: MicrosoftService,
  ) { }

  async getAvailability(requestedTimezone?: string): Promise<BookingAvailabilityResponse> {
    const tz = requestedTimezone || this.timezone;
    const tzLabel = requestedTimezone || this.timezoneLabel;
    const slots = await this.buildAvailability();

    const daysMap = new Map<
      string,
      {
        date: string;
        slots: Array<{
          value: string;
          label: string;
          startAt: string;
          endAt: string;
        }>;
      }
    >();

    for (const slot of slots) {
      const targetDate = formatInTimeZone(slot.startAt, tz, 'yyyy-MM-dd');
      const targetLabel = formatInTimeZone(slot.startAt, tz, 'h:mm a');
      const existingDay = daysMap.get(targetDate);

      const slotPayload = {
        value: slot.value,
        label: targetLabel,
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
      };

      if (existingDay) {
        existingDay.slots.push(slotPayload);
      } else {
        daysMap.set(targetDate, { date: targetDate, slots: [slotPayload] });
      }
    }

    return {
      timezone: tz,
      timezoneLabel: tzLabel,
      durationMinutes: this.durationMinutes,
      days: Array.from(daysMap.values()),
    };
  }

  async createBooking(data: CreateBookingDto): Promise<BookingResponse> {
    const tz = data.timezone || this.timezone;
    const availability = await this.buildAvailability();
    const matchedSlot = availability.find((slot) => {
      const targetDate = formatInTimeZone(slot.startAt, tz, 'yyyy-MM-dd');
      return targetDate === data.slotDate && slot.value === data.slotValue;
    });

    if (!matchedSlot) {
      throw new ConflictException(
        'The selected time is no longer available. Please choose another slot.',
      );
    }

    const trimmedAddress = data.address?.trim();
    const trimmedNote = data.note?.trim();
    const fullName = data.fullName.trim();
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();

    const reminderScheduled =
      matchedSlot.startAt.getTime() - Date.now() > 60 * 60 * 1000;

    const booking = this.bookingsRepository.create({
      fullName,
      email,
      phone,
      address: trimmedAddress,
      note: trimmedNote,
      slotDate: matchedSlot.date,
      slotValue: matchedSlot.value,
      slotLabel: matchedSlot.label,
      slotStartAt: matchedSlot.startAt,
      slotEndAt: matchedSlot.endAt,
      timezone: tz,
      reminderScheduled,
    });

    try {
      await this.bookingsRepository.save(booking);
    } catch (error) {
      const code = (error as { code?: string })?.code;

      if (code === '23505') {
        throw new ConflictException(
          'That slot has just been booked by someone else. Please pick another time.',
        );
      }

      throw error;
    }

    try {
      const meeting = await this.createCalendarEvent({
        fullName,
        email,
        phone,
        address: trimmedAddress,
        note: trimmedNote,
        slot: matchedSlot,
      });

      booking.microsoftEventId = meeting.eventId;
      booking.meetingJoinUrl = meeting.joinUrl;
      await this.bookingsRepository.save(booking);
    } catch (error) {
      await this.bookingsRepository.delete({ id: booking.id });
      throw error;
    }

    try {
      await this.sendBookingConfirmationEmail(booking);
    } catch {
      this.logger.warn(
        `Booking ${booking.id} was created but the booking confirmation email could not be sent.`,
      );
    }

    try {
      await this.sendInternalBookingNotification(booking);
    } catch {
      this.logger.warn(
        `Booking ${booking.id} was created but the internal booking notification email could not be sent.`,
      );
    }

    return this.toBookingResponse(booking);
  }

  async sendUpcomingBookingReminders() {
    const now = new Date();
    const reminderWindowStart = addMinutes(now, 55);
    const reminderWindowEnd = addMinutes(now, 65);

    const bookings = await this.bookingsRepository.find({
      where: {
        status: 'scheduled',
        reminderScheduled: true,
        reminderSentAt: IsNull(),
        slotStartAt: Between(reminderWindowStart, reminderWindowEnd),
      },
      order: {
        slotStartAt: 'ASC',
      },
    });

    for (const booking of bookings) {
      await this.sendReminderEmail(booking);
      booking.reminderSentAt = new Date();
      await this.bookingsRepository.save(booking);
    }
  }

  private async buildAvailability(): Promise<SlotResult[]> {
    const now = new Date();
    const minimumStartTime = addMinutes(now, this.minimumLeadHours * 60);
    const windowEnd = addDays(now, this.availabilityDays + 1);

    const existingBookings = await this.bookingsRepository.find({
      where: {
        status: 'scheduled',
        slotStartAt: Between(now, windowEnd),
      },
      select: {
        slotStartAt: true,
      },
    });

    const bookedSlots = new Set(
      existingBookings.map((booking) => booking.slotStartAt.toISOString()),
    );

    const results: SlotResult[] = [];

    for (let dayOffset = 0; dayOffset < this.availabilityDays; dayOffset += 1) {
      const dayDate = addDays(now, dayOffset);
      const date = formatInTimeZone(dayDate, this.timezone, 'yyyy-MM-dd');
      const weekday = Number(formatInTimeZone(dayDate, this.timezone, 'i'));



      for (const slotDefinition of bookingSlotDefinitions) {
        const startAt = fromZonedTime(
          `${date}T${slotDefinition.value}:00`,
          this.timezone,
        );
        const endAt = addMinutes(startAt, this.durationMinutes);
        const slotKey = startAt.toISOString();

        if (startAt <= minimumStartTime || bookedSlots.has(slotKey)) {
          continue;
        }

        results.push({
          date,
          value: slotDefinition.value,
          label: slotDefinition.label,
          startAt,
          endAt,
        });
      }
    }

    return results;
  }

  private async createCalendarEvent({
    fullName,
    email,
    phone,
    address,
    note,
    slot,
  }: {
    fullName: string;
    email: string;
    phone: string;
    address?: string;
    note?: string;
    slot: SlotResult;
  }) {
    if (!this.organizerEmail) {
      throw new InternalServerErrorException(
        'BOOKING_ORGANIZER_EMAIL must be configured before creating bookings.',
      );
    }

    const accessToken = await this.microsoftService.getAccessToken();

    const eventPayload = {
      subject: `Skarion Consultation Call - ${fullName}`,
      body: {
        contentType: 'HTML',
        content: this.buildEventBody({
          fullName,
          email,
          phone,
          address,
          note,
          slot,
        }),
      },
      start: {
        dateTime: slot.startAt.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: slot.endAt.toISOString(),
        timeZone: 'UTC',
      },
      allowNewTimeProposals: false,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      location: {
        displayName: 'Microsoft Teams',
      },
      transactionId: randomUUID(),
    };

    try {
      const response = await axios.post<MicrosoftCalendarEventResponse>(
        `${this.graphBaseUrl}/users/${this.organizerEmail}/calendar/events`,
        eventPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Prefer: `outlook.timezone="${this.timezone}"`,
          },
        },
      );

      return {
        eventId: response.data.id,
        joinUrl: response.data.onlineMeeting?.joinUrl || response.data.webLink,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Failed to create Microsoft calendar event (${error.response?.status ?? 'no-status'})`,
          JSON.stringify(error.response?.data ?? error.message),
        );
      } else {
        this.logger.error(
          'Failed to create Microsoft calendar event',
          error instanceof Error ? error.stack : undefined,
        );
      }

      throw new InternalServerErrorException(
        'Unable to create the calendar event for this booking.',
      );
    }
  }

  private async sendBookingConfirmationEmail(booking: Booking) {
    const formattedStart = this.formatBookingDate(booking.slotStartAt);
    
    const html = buildMeetingConfirmationEmail({
      fullName: booking.fullName,
      formattedStart,
      joinLink: booking.meetingJoinUrl
    });

    const text = buildMeetingConfirmationText({
      fullName: booking.fullName,
      formattedStart,
      joinLink: booking.meetingJoinUrl
    });

    await this.mailerService.sendMail({
      recipients: [booking.email],
      subject: `Your Skarion Session is Confirmed - ${formattedStart}`,
      html,
      text,
      attachments: [
        {
          filename: 'skarion-booking.ics',
          contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
          contentBase64: Buffer.from(
            this.buildCalendarInvite(booking),
            'utf-8',
          ).toString('base64'),
        },
      ],
    });
  }

  private async sendInternalBookingNotification(booking: Booking) {
    if (!this.internalNotificationRecipients.length) {
      return;
    }

    const formattedStart = this.formatBookingDate(booking.slotStartAt);

    const html = buildInternalBookingNotificationEmail({
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      formattedStart,
      address: booking.address,
      note: booking.note,
      joinLink: booking.meetingJoinUrl,
    });

    const text = buildInternalBookingNotificationText({
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      formattedStart,
      address: booking.address,
      note: booking.note,
      joinLink: booking.meetingJoinUrl,
    });

    await this.mailerService.sendMail({
      recipients: this.internalNotificationRecipients,
      subject: `New booking: ${booking.fullName} on ${booking.slotDate}`,
      html,
      text,
    });
  }

  private async sendReminderEmail(booking: Booking) {
    const recipients = Array.from(
      new Set([
        booking.email,
        ...this.internalNotificationRecipients,
      ].filter(Boolean)),
    );

    const formattedStart = this.formatBookingDate(booking.slotStartAt);

    const html = buildBookingReminderEmail({
      fullName: booking.fullName,
      formattedStart,
      joinLink: booking.meetingJoinUrl,
    });

    const text = buildBookingReminderText({
      fullName: booking.fullName,
      formattedStart,
      joinLink: booking.meetingJoinUrl,
    });

    await this.mailerService.sendMail({
      recipients,
      subject: 'Reminder: your Skarion call starts in 1 hour',
      html,
      text,
    });
  }

  private buildEventBody({
    fullName,
    email,
    phone,
    address,
    note,
    slot,
  }: {
    fullName: string;
    email: string;
    phone: string;
    address?: string;
    note?: string;
    slot: SlotResult;
  }) {
    const details = [
      `<p><strong>Booked by:</strong> ${fullName}</p>`,
      `<p><strong>Email:</strong> ${email}</p>`,
      `<p><strong>Phone:</strong> ${phone}</p>`,
      `<p><strong>Meeting time:</strong> ${this.formatBookingDate(slot.startAt)}</p>`,
    ];

    if (address) {
      details.push(`<p><strong>Address:</strong> ${address}</p>`);
    }

    if (note) {
      details.push(`<p><strong>Note:</strong> ${note}</p>`);
    }

    return details.join('');
  }

  private buildCalendarInvite(booking: Booking) {
    const organizerEmail = this.organizerEmail || this.senderEmail;
    const descriptionLines = [
      'Thanks for booking a call with Skarion.',
      `Meeting time: ${this.formatBookingDate(booking.slotStartAt)}`,
      booking.meetingJoinUrl ? `Join the meeting: ${booking.meetingJoinUrl}` : '',
    ].filter(Boolean);

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Skarion//Bookings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${booking.microsoftEventId || booking.id}@skarion.com`,
      `DTSTAMP:${this.toICSDateTime(new Date())}`,
      `DTSTART:${this.toICSDateTime(booking.slotStartAt)}`,
      `DTEND:${this.toICSDateTime(booking.slotEndAt)}`,
      `SUMMARY:${this.escapeICSText('Skarion Booking Call')}`,
      `DESCRIPTION:${this.escapeICSText(descriptionLines.join('\n'))}`,
      `ORGANIZER;CN=Skarion:mailto:${organizerEmail}`,
      `ATTENDEE;CN=${this.escapeICSText(booking.fullName)};RSVP=TRUE:mailto:${booking.email}`,
      `LOCATION:${this.escapeICSText(booking.meetingJoinUrl || 'Microsoft Teams')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');
  }

  private toICSDateTime(value: Date) {
    return value
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
  }

  private escapeICSText(value: string) {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  private parseEmailList(value?: string) {
    return Array.from(
      new Set(
        (value || '')
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
      ),
    );
  }

  private formatBookingDate(value: Date) {
    const formattedDate = formatInTimeZone(
      value,
      this.timezone,
      "EEEE, MMMM d, yyyy 'at' h:mm a",
    );

    return `${formattedDate} (${this.timezoneLabel})`;
  }

  private toBookingResponse(booking: Booking): BookingResponse {
    return {
      id: booking.id,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      address: booking.address,
      note: booking.note,
      slotDate: booking.slotDate,
      slotValue: booking.slotValue,
      slotLabel: booking.slotLabel,
      slotStartAt: booking.slotStartAt,
      slotEndAt: booking.slotEndAt,
      timezone: booking.timezone,
      meetingJoinUrl: booking.meetingJoinUrl,
      reminderScheduled: booking.reminderScheduled,
      createdAt: booking.createdAt,
    };
  }
}
