import {
  BadRequestException,
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
import { BookingSettings } from 'src/entities/booking-settings.entity';
import { MailerService } from '../mailer/mailer.service';
import { MicrosoftService } from '../microsoft/microsoft.service';
import { SharepointService } from '../etl/sharepoint.service';
import {
  buildMeetingConfirmationEmail,
  buildMeetingConfirmationText,
  buildBookingReminderEmail,
  buildBookingReminderText,
  buildInternalBookingNotificationEmail,
  buildInternalBookingNotificationText,
} from '../mailer/email-templates.service';
import {
  bookingSlotDefinitions,
  BookingSettingsResponse,
  createBookingSchema,
  isValidBookingTimezone,
  type BookingAvailabilityResponse,
  type BookingResponse,
  type UpdateBookingSettingsData,
} from './dtos';
import { z } from 'zod';

type CreateBookingData = z.infer<typeof createBookingSchema>;

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

type MicrosoftOnlineMeetingResponse = {
  joinWebUrl?: string;
};

const MICROSOFT_TIMEZONE_BY_IANA: Readonly<Record<string, string>> = {
  'America/New_York': 'Eastern Standard Time',
  'America/Chicago': 'Central Standard Time',
  'America/Denver': 'Mountain Standard Time',
  'America/Phoenix': 'US Mountain Standard Time',
  'America/Los_Angeles': 'Pacific Standard Time',
  'America/Anchorage': 'Alaskan Standard Time',
  'Pacific/Honolulu': 'Hawaiian Standard Time',
  'America/Puerto_Rico': 'SA Western Standard Time',
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly graphBaseUrl = 'https://graph.microsoft.com/v1.0';

  // ── Env-var defaults (used when no DB settings row exists) ───────────────
  private readonly defaultTimezone =
    process.env.BOOKING_TIMEZONE || 'America/New_York';
  private readonly defaultDurationMinutes = Number(
    process.env.BOOKING_DURATION_MINUTES || 30,
  );
  private readonly defaultAvailabilityDays = Number(
    process.env.BOOKING_AVAILABILITY_DAYS || 30,
  );
  private readonly defaultMinimumLeadHours = Number(
    process.env.BOOKING_MIN_LEAD_HOURS || 2,
  );
  private readonly defaultBookingUnavailableUntil: Date | null = process.env
    .BOOKING_UNAVAILABLE_UNTIL
    ? new Date(process.env.BOOKING_UNAVAILABLE_UNTIL)
    : null;
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
    @InjectRepository(BookingSettings)
    private readonly bookingSettingsRepository: Repository<BookingSettings>,
    private readonly mailerService: MailerService,
    private readonly microsoftService: MicrosoftService,
    private readonly sharepointService: SharepointService,
  ) {}

  // ── Public: get current settings (for admin dashboard) ───────────────────
  async getBookingSettings(): Promise<BookingSettingsResponse> {
    const settings = await this.loadSettings();
    return {
      enabledSlots: settings.enabledSlots,
      enabledWeekdays: settings.enabledWeekdays.map(Number),
      durationMinutes: settings.durationMinutes,
      availabilityDays: settings.availabilityDays,
      minimumLeadHours: settings.minimumLeadHours,
      bookingUnavailableUntil: settings.bookingUnavailableUntil
        ? settings.bookingUnavailableUntil.toISOString()
        : null,
      updatedAt: settings.updatedAt,
      allSlotDefinitions: bookingSlotDefinitions,
    };
  }

  // ── Public: update settings (admin only) ─────────────────────────────────
  async updateBookingSettings(
    data: UpdateBookingSettingsData,
  ): Promise<BookingSettingsResponse> {
    let settings = await this.bookingSettingsRepository.findOneBy({ id: 1 });

    if (!settings) {
      settings = this.bookingSettingsRepository.create({
        id: 1,
        enabledSlots: [
          '10:00',
          '11:00',
          '12:00',
          '13:00',
          '14:00',
          '21:00',
          '22:00',
          '23:00',
        ],
        enabledWeekdays: [1, 2, 3, 4, 7],
        durationMinutes: this.defaultDurationMinutes,
        availabilityDays: this.defaultAvailabilityDays,
        minimumLeadHours: this.defaultMinimumLeadHours,
        bookingUnavailableUntil: this.defaultBookingUnavailableUntil,
      });
    }

    if (data.enabledSlots !== undefined)
      settings.enabledSlots = data.enabledSlots;
    if (data.enabledWeekdays !== undefined)
      settings.enabledWeekdays = data.enabledWeekdays;
    if (data.durationMinutes !== undefined)
      settings.durationMinutes = data.durationMinutes;
    if (data.availabilityDays !== undefined)
      settings.availabilityDays = data.availabilityDays;
    if (data.minimumLeadHours !== undefined)
      settings.minimumLeadHours = data.minimumLeadHours;
    if ('bookingUnavailableUntil' in data) {
      settings.bookingUnavailableUntil = data.bookingUnavailableUntil
        ? new Date(data.bookingUnavailableUntil)
        : null;
    }

    await this.bookingSettingsRepository.save(settings);
    return this.getBookingSettings();
  }

  async getAvailability(
    requestedTimezone?: string,
  ): Promise<BookingAvailabilityResponse> {
    const settings = await this.loadSettings();
    const tz = requestedTimezone || this.defaultTimezone;
    this.assertValidTimezone(tz);
    const tzLabel = this.getTimezoneLabel(tz);
    const slots = await this.buildAvailability(settings);

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
      durationMinutes: settings.durationMinutes,
      days: Array.from(daysMap.values()),
    };
  }

  async createBooking(
    data: CreateBookingData,
    resumeFile?: Express.Multer.File,
  ): Promise<BookingResponse> {
    const settings = await this.loadSettings();
    const tz = data.timezone;
    this.assertValidTimezone(tz);
    const availability = await this.buildAvailability(settings);
    const requestedStartAt = data.slotStartAt
      ? new Date(data.slotStartAt).getTime()
      : null;
    const matchedSlot = availability.find((slot) => {
      const targetDate = formatInTimeZone(slot.startAt, tz, 'yyyy-MM-dd');
      const matchesIdentity =
        targetDate === data.slotDate && slot.value === data.slotValue;
      const matchesInstant =
        requestedStartAt === null ||
        slot.startAt.getTime() === requestedStartAt;

      return matchesIdentity && matchesInstant;
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

    // ── Upload resume to SharePoint ─────────────────────────────────────────
    let resumeUrl: string | undefined;
    let resumeBuffer: Buffer | undefined;
    let resumeOriginalName: string | undefined;
    let resumeContentType: string | undefined;

    if (resumeFile) {
      resumeBuffer = resumeFile.buffer;
      resumeOriginalName = resumeFile.originalname;
      resumeContentType = resumeFile.mimetype;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = fullName
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const ext = resumeOriginalName.substring(
        resumeOriginalName.lastIndexOf('.'),
      );
      const uploadFileName = `${safeName}_${timestamp}${ext}`;

      try {
        const result = await this.sharepointService.uploadBookingResume(
          uploadFileName,
          resumeBuffer,
        );
        resumeUrl = result.url;
      } catch (error) {
        this.logger.error(
          'Failed to upload booking resume to SharePoint',
          error instanceof Error ? error.stack : undefined,
        );
        throw new InternalServerErrorException(
          'Unable to upload your resume. Please try again.',
        );
      }
    }

    const booking = this.bookingsRepository.create({
      fullName,
      email,
      phone,
      address: trimmedAddress,
      note: trimmedNote,
      slotDate: formatInTimeZone(matchedSlot.startAt, tz, 'yyyy-MM-dd'),
      slotValue: matchedSlot.value,
      slotLabel: formatInTimeZone(matchedSlot.startAt, tz, 'h:mm a'),
      slotStartAt: matchedSlot.startAt,
      slotEndAt: matchedSlot.endAt,
      timezone: tz,
      reminderScheduled,
      resumeUrl,
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
        timezone: tz,
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
      await this.sendInternalBookingNotification(booking, {
        buffer: resumeBuffer,
        originalName: resumeOriginalName,
        contentType: resumeContentType,
      });
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

  // ── Load settings from DB, falling back to env-var defaults ─────────────
  private async loadSettings(): Promise<BookingSettings> {
    const row = await this.bookingSettingsRepository.findOneBy({ id: 1 });
    if (row) {
      // simple-array columns come back as strings; coerce weekdays to numbers
      row.enabledWeekdays = (row.enabledWeekdays as unknown as string[])
        .map(Number)
        .filter((n) => !isNaN(n));
      return row;
    }

    // Return a transient (unsaved) entity with env-var defaults
    const defaults = new BookingSettings();
    defaults.id = 1;
    defaults.enabledSlots = [
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '21:00',
      '22:00',
      '23:00',
    ];
    defaults.enabledWeekdays = [1, 2, 3, 4, 7];
    defaults.durationMinutes = this.defaultDurationMinutes;
    defaults.availabilityDays = this.defaultAvailabilityDays;
    defaults.minimumLeadHours = this.defaultMinimumLeadHours;
    defaults.bookingUnavailableUntil = this.defaultBookingUnavailableUntil;
    defaults.updatedAt = new Date(0);
    return defaults;
  }

  private async buildAvailability(
    settings: BookingSettings,
  ): Promise<SlotResult[]> {
    const now = new Date();
    const minimumStartTime = addMinutes(now, settings.minimumLeadHours * 60);
    const windowEnd = addDays(now, settings.availabilityDays + 1);

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

    // Build a Set for O(1) lookups
    const enabledSlotSet = new Set(settings.enabledSlots);
    const enabledWeekdaySet = new Set(settings.enabledWeekdays.map(Number));

    const results: SlotResult[] = [];

    for (
      let dayOffset = 0;
      dayOffset < settings.availabilityDays;
      dayOffset += 1
    ) {
      const dayDate = addDays(now, dayOffset);
      const date = formatInTimeZone(
        dayDate,
        this.defaultTimezone,
        'yyyy-MM-dd',
      );
      const weekday = Number(
        formatInTimeZone(dayDate, this.defaultTimezone, 'i'),
      );

      // Only include days that are enabled in settings
      if (!enabledWeekdaySet.has(weekday)) {
        continue;
      }

      for (const slotDefinition of bookingSlotDefinitions) {
        // Skip slots that have been disabled by admin
        if (!enabledSlotSet.has(slotDefinition.value)) {
          continue;
        }

        const startAt = fromZonedTime(
          `${date}T${slotDefinition.value}:00`,
          this.defaultTimezone,
        );
        const endAt = addMinutes(startAt, settings.durationMinutes);
        const slotKey = startAt.toISOString();

        if (
          startAt <= minimumStartTime ||
          (settings.bookingUnavailableUntil !== null &&
            startAt <= settings.bookingUnavailableUntil) ||
          bookedSlots.has(slotKey)
        ) {
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
    timezone,
  }: {
    fullName: string;
    email: string;
    phone: string;
    address?: string;
    note?: string;
    slot: SlotResult;
    timezone: string;
  }) {
    if (!this.organizerEmail) {
      throw new InternalServerErrorException(
        'BOOKING_ORGANIZER_EMAIL must be configured before creating bookings.',
      );
    }

    const accessToken = await this.microsoftService.getAccessToken();

    // ── Step 1: Create the online meeting with auto-recording enabled ────
    let onlineMeetingJoinUrl: string | undefined;

    try {
      const meetingResponse = await axios.post<MicrosoftOnlineMeetingResponse>(
        `${this.graphBaseUrl}/users/${this.organizerEmail}/onlineMeetings`,
        {
          subject: `Skarion Consultation Call - ${fullName}`,
          startDateTime: slot.startAt.toISOString(),
          endDateTime: slot.endAt.toISOString(),
          recordAutomatically: true,
          autoAdmittedUsers: 'everyone',
          isEntryExitAnnounced: false,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      onlineMeetingJoinUrl = meetingResponse.data?.joinWebUrl;

      this.logger.log(
        `Online meeting created with auto-recording: ${onlineMeetingJoinUrl}`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Failed to create online meeting with auto-recording (${error.response?.status ?? 'no-status'})`,
          JSON.stringify(error.response?.data ?? error.message),
        );
      } else {
        this.logger.error(
          'Failed to create online meeting with auto-recording',
          error instanceof Error ? error.stack : undefined,
        );
      }
      // Fall back to letting the calendar event create the Teams meeting
    }

    // ── Step 2: Create the calendar event ────────────────────────────────
    const eventStart = this.toMicrosoftEventDateTime(slot.startAt, timezone);
    const eventEnd = this.toMicrosoftEventDateTime(slot.endAt, timezone);
    const eventPayload: Record<string, unknown> = {
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
          timezone,
        }),
      },
      start: eventStart,
      end: eventEnd,
      allowNewTimeProposals: false,
      location: {
        displayName: 'Microsoft Teams',
      },
      attendees: Array.from(
        new Set(
          [
            email,
            this.senderEmail,
            ...this.internalNotificationRecipients,
          ].filter(Boolean),
        ),
      ).map((addr) => ({
        emailAddress: {
          address: addr,
          ...(addr === email ? { name: fullName } : {}),
        },
        type: 'required',
      })),
      transactionId: randomUUID(),
    };

    // If the online meeting was created successfully, embed its join URL
    // in the event body. Otherwise fall back to inline Teams meeting creation.
    if (onlineMeetingJoinUrl) {
      eventPayload.isOnlineMeeting = true;
      eventPayload.onlineMeetingProvider = 'teamsForBusiness';
    } else {
      eventPayload.isOnlineMeeting = true;
      eventPayload.onlineMeetingProvider = 'teamsForBusiness';
    }

    try {
      const response = await axios.post<MicrosoftCalendarEventResponse>(
        `${this.graphBaseUrl}/users/${this.organizerEmail}/calendar/events`,
        eventPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Prefer the pre-created meeting URL (which has recording enabled)
      const joinUrl =
        onlineMeetingJoinUrl ||
        response.data.onlineMeeting?.joinUrl ||
        response.data.webLink;

      return {
        eventId: response.data.id,
        joinUrl,
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
    const formattedStart = this.formatBookingDate(
      booking.slotStartAt,
      booking.timezone,
    );

    await this.mailerService.sendMail({
      recipients: [booking.email],
      subject: 'Your Skarion Session is Confirmed',
      html: buildMeetingConfirmationEmail({
        fullName: booking.fullName,
        formattedStart,
        joinLink: booking.meetingJoinUrl,
      }),
      text: buildMeetingConfirmationText({
        fullName: booking.fullName,
        formattedStart,
        joinLink: booking.meetingJoinUrl,
      }),
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

  private async sendInternalBookingNotification(
    booking: Booking,
    resume?: {
      buffer?: Buffer;
      originalName?: string;
      contentType?: string;
    },
  ) {
    if (!this.internalNotificationRecipients.length) {
      return;
    }

    const formattedStart = this.formatBookingDateForInternalTeam(booking);
    const attachments: Array<{
      filename: string;
      contentType: string;
      contentBase64: string;
    }> = [];

    if (resume?.buffer && resume.originalName) {
      attachments.push({
        filename: resume.originalName,
        contentType: resume.contentType || 'application/octet-stream',
        contentBase64: resume.buffer.toString('base64'),
      });
    }

    await this.mailerService.sendMail({
      recipients: this.internalNotificationRecipients,
      subject: `New booking: ${booking.fullName} on ${booking.slotDate}`,
      html: buildInternalBookingNotificationEmail({
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        formattedStart,
        address: booking.address,
        note: booking.note,
        joinLink: booking.meetingJoinUrl,
      }),
      text: buildInternalBookingNotificationText({
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        formattedStart,
        address: booking.address,
        note: booking.note,
        joinLink: booking.meetingJoinUrl,
      }),
      attachments,
    });
  }

  private async sendReminderEmail(booking: Booking) {
    const recipients = Array.from(
      new Set(
        [booking.email, ...this.internalNotificationRecipients].filter(Boolean),
      ),
    );

    const formattedStart = this.formatBookingDate(
      booking.slotStartAt,
      booking.timezone,
    );

    await this.mailerService.sendMail({
      recipients,
      subject: 'Reminder: your Skarion call starts in 1 hour',
      html: buildBookingReminderEmail({
        fullName: booking.fullName,
        formattedStart,
        joinLink: booking.meetingJoinUrl,
      }),
      text: buildBookingReminderText({
        fullName: booking.fullName,
        formattedStart,
        joinLink: booking.meetingJoinUrl,
      }),
    });
  }

  private buildEventBody({
    fullName,
    email,
    phone,
    address,
    note,
    slot,
    timezone,
  }: {
    fullName: string;
    email: string;
    phone: string;
    address?: string;
    note?: string;
    slot: SlotResult;
    timezone: string;
  }) {
    const details = [
      `<p><strong>Booked by:</strong> ${fullName}</p>`,
      `<p><strong>Email:</strong> ${email}</p>`,
      `<p><strong>Phone:</strong> ${phone}</p>`,
      `<p><strong>Meeting time:</strong> ${this.formatBookingDate(slot.startAt, timezone)}</p>`,
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
      `Meeting time: ${this.formatBookingDate(booking.slotStartAt, booking.timezone)}`,
      booking.meetingJoinUrl
        ? `Join the meeting: ${booking.meetingJoinUrl}`
        : '',
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

  private assertValidTimezone(timezone: string) {
    if (!isValidBookingTimezone(timezone)) {
      throw new BadRequestException(
        `Invalid timezone "${timezone}". Use an IANA timezone such as America/Chicago.`,
      );
    }
  }

  private toMicrosoftEventDateTime(value: Date, timezone: string) {
    const microsoftTimezone = MICROSOFT_TIMEZONE_BY_IANA[timezone];

    if (!microsoftTimezone) {
      return {
        dateTime: value.toISOString(),
        timeZone: 'UTC',
      };
    }

    return {
      dateTime: formatInTimeZone(value, timezone, "yyyy-MM-dd'T'HH:mm:ss"),
      timeZone: microsoftTimezone,
    };
  }

  private getTimezoneLabel(timezone: string, value = new Date()) {
    this.assertValidTimezone(timezone);

    const label = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longGeneric',
    })
      .formatToParts(value)
      .find((part) => part.type === 'timeZoneName')?.value;

    return label || timezone;
  }

  private formatBookingDate(value: Date, timezone: string) {
    this.assertValidTimezone(timezone);
    const formattedDate = formatInTimeZone(
      value,
      timezone,
      "EEEE, MMMM d, yyyy 'at' h:mm a zzz",
    );

    return `${formattedDate} (${this.getTimezoneLabel(timezone, value)})`;
  }

  private formatBookingDateForInternalTeam(booking: Booking) {
    const candidateTime = this.formatBookingDate(
      booking.slotStartAt,
      booking.timezone,
    );

    if (booking.timezone === this.defaultTimezone) {
      return candidateTime;
    }

    const organizerTime = this.formatBookingDate(
      booking.slotStartAt,
      this.defaultTimezone,
    );

    return `${candidateTime}; organizer time: ${organizerTime}`;
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
