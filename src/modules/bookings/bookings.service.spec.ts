import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { Repository } from 'typeorm';
import { Booking } from 'src/entities/booking.entity';
import { BookingSettings } from 'src/entities/booking-settings.entity';
import { SharepointService } from '../etl/sharepoint.service';
import { MailerService } from '../mailer/mailer.service';
import { MicrosoftService } from '../microsoft/microsoft.service';
import { BookingsService } from './bookings.service';
import { createBookingSchema } from './dtos';

type TestableBookingsService = {
  createCalendarEvent: (data: {
    fullName: string;
    email: string;
    phone: string;
    slot: {
      date: string;
      value: string;
      label: string;
      startAt: Date;
      endAt: Date;
    };
    timezone: string;
  }) => Promise<{ eventId: string; joinUrl?: string }>;
  sendBookingConfirmationEmail: jest.Mock;
  sendInternalBookingNotification: jest.Mock;
  formatBookingDate: (value: Date, timezone: string) => string;
  buildCalendarInvite: (booking: Booking) => string;
  toMicrosoftEventDateTime: (
    value: Date,
    timezone: string,
  ) => { dateTime: string; timeZone: string };
};

describe('BookingsService timezone handling', () => {
  let service: BookingsService;
  let bookingsRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let microsoftService: { getAccessToken: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-04T00:00:00.000Z'));

    process.env.BOOKING_TIMEZONE = 'America/New_York';
    process.env.BOOKING_DURATION_MINUTES = '30';
    process.env.BOOKING_AVAILABILITY_DAYS = '30';
    process.env.BOOKING_MIN_LEAD_HOURS = '2';
    process.env.BOOKING_ORGANIZER_EMAIL = 'organizer@example.com';

    bookingsRepository = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((data: Partial<Booking>) => ({
        id: 'booking-id',
        createdAt: new Date(),
        ...data,
      })),
      save: jest.fn((booking: Booking) => Promise.resolve(booking)),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const settingsRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
    };
    microsoftService = {
      getAccessToken: jest.fn().mockResolvedValue('access-token'),
    };

    service = new BookingsService(
      bookingsRepository as unknown as Repository<Booking>,
      settingsRepository as unknown as Repository<BookingSettings>,
      { sendMail: jest.fn() } as unknown as MailerService,
      microsoftService as unknown as MicrosoftService,
      { uploadBookingResume: jest.fn() } as unknown as SharepointService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('requires a valid IANA timezone when creating a booking', () => {
    const missingTimezone = createBookingSchema.safeParse({
      fullName: 'Central Candidate',
      email: 'candidate@example.com',
      phone: '312-555-0100',
      slotDate: '2026-01-04',
      slotValue: '10:00',
    });
    const invalidTimezone = createBookingSchema.safeParse({
      fullName: 'Central Candidate',
      email: 'candidate@example.com',
      phone: '312-555-0100',
      timezone: 'CST',
      slotDate: '2026-01-04',
      slotValue: '10:00',
    });
    const utcTimezone = createBookingSchema.safeParse({
      fullName: 'UTC Candidate',
      email: 'candidate@example.com',
      phone: '312-555-0100',
      timezone: 'UTC',
      slotDate: '2026-01-04',
      slotValue: '10:00',
    });

    expect(missingTimezone.success).toBe(false);
    expect(invalidTimezone.success).toBe(false);
    expect(utcTimezone.success).toBe(true);
  });

  it('returns Eastern organizer slots translated to Central Time', async () => {
    const availability = await service.getAvailability('America/Chicago');
    const sunday = availability.days.find((day) => day.date === '2026-01-04');
    const tenEastern = sunday?.slots.find((slot) => slot.value === '10:00');

    expect(availability.timezone).toBe('America/Chicago');
    expect(availability.timezoneLabel).toContain('Central');
    expect(tenEastern).toEqual({
      value: '10:00',
      label: '9:00 AM',
      startAt: '2026-01-04T15:00:00.000Z',
      endAt: '2026-01-04T15:30:00.000Z',
    });
  });

  it('rejects invalid availability timezones instead of falling back to Eastern', async () => {
    await expect(service.getAvailability('CST')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('formats winter and summer appointments in the candidate timezone', () => {
    const internals = service as unknown as TestableBookingsService;

    expect(
      internals.formatBookingDate(
        new Date('2026-01-04T15:00:00.000Z'),
        'America/Chicago',
      ),
    ).toContain('9:00 AM CST');
    expect(
      internals.formatBookingDate(
        new Date('2026-07-05T14:00:00.000Z'),
        'America/Chicago',
      ),
    ).toContain('9:00 AM CDT');
  });

  it('stores and propagates the confirmed candidate timezone', async () => {
    const availability = await service.getAvailability('America/Chicago');
    const slot = availability.days
      .find((day) => day.date === '2026-01-04')
      ?.slots.find((candidateSlot) => candidateSlot.value === '10:00');
    expect(slot).toBeDefined();

    const internals = service as unknown as TestableBookingsService;
    internals.createCalendarEvent = jest.fn().mockResolvedValue({
      eventId: 'event-id',
      joinUrl: 'https://teams.example/join',
    });
    internals.sendBookingConfirmationEmail = jest
      .fn()
      .mockResolvedValue(undefined);
    internals.sendInternalBookingNotification = jest
      .fn()
      .mockResolvedValue(undefined);

    const result = await service.createBooking({
      fullName: 'Central Candidate',
      email: 'candidate@example.com',
      phone: '312-555-0100',
      timezone: 'America/Chicago',
      slotDate: '2026-01-04',
      slotValue: '10:00',
      slotStartAt: slot?.startAt,
    });

    expect(bookingsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: 'America/Chicago',
        slotDate: '2026-01-04',
        slotLabel: '9:00 AM',
        slotStartAt: new Date('2026-01-04T15:00:00.000Z'),
      }),
    );
    expect(internals.createCalendarEvent).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: 'America/Chicago' }),
    );
    expect(result.timezone).toBe('America/Chicago');
    expect(result.slotLabel).toBe('9:00 AM');
  });

  it('creates the Graph event in Central Time and keeps ICS timestamps portable UTC', async () => {
    const post = jest
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({
        data: { joinWebUrl: 'https://teams.example/join' },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'event-id',
          onlineMeeting: { joinUrl: 'https://teams.example/join' },
        },
      });
    const internals = service as unknown as TestableBookingsService;
    const startAt = new Date('2026-01-04T15:00:00.000Z');
    const endAt = new Date('2026-01-04T15:30:00.000Z');

    await internals.createCalendarEvent({
      fullName: 'Central Candidate',
      email: 'candidate@example.com',
      phone: '312-555-0100',
      timezone: 'America/Chicago',
      slot: {
        date: '2026-01-04',
        value: '10:00',
        label: '10:00 AM',
        startAt,
        endAt,
      },
    });

    const graphPayload = post.mock.calls[1]?.[1] as {
      body: { content: string };
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
    };
    const graphOptions = post.mock.calls[1]?.[2] as {
      headers: Record<string, string>;
    };

    expect(graphPayload.start).toEqual({
      dateTime: '2026-01-04T09:00:00',
      timeZone: 'Central Standard Time',
    });
    expect(graphPayload.end).toEqual({
      dateTime: '2026-01-04T09:30:00',
      timeZone: 'Central Standard Time',
    });
    expect(graphPayload.body.content).toContain('9:00 AM CST');
    expect(graphPayload.body.content).not.toContain('10:00 AM EST');
    expect(graphOptions.headers).not.toHaveProperty('Prefer');

    const invite = internals.buildCalendarInvite({
      id: 'booking-id',
      fullName: 'Central Candidate',
      email: 'candidate@example.com',
      slotStartAt: startAt,
      slotEndAt: endAt,
      timezone: 'America/Chicago',
      meetingJoinUrl: 'https://teams.example/join',
    } as Booking);

    expect(invite).toContain('DTSTART:20260104T150000Z');
    expect(invite).toContain('DTEND:20260104T153000Z');
    expect(invite).toContain('9:00 AM CST');
    expect(invite).not.toContain('10:00 AM EST');
  });

  it('rejects a stale or tampered slot instant even when the displayed slot matches', async () => {
    const availability = await service.getAvailability('America/Chicago');
    const slot = availability.days
      .find((day) => day.date === '2026-01-04')
      ?.slots.find((candidateSlot) => candidateSlot.value === '10:00');
    expect(slot).toBeDefined();

    await expect(
      service.createBooking({
        fullName: 'Central Candidate',
        email: 'candidate@example.com',
        phone: '312-555-0100',
        timezone: 'America/Chicago',
        slotDate: '2026-01-04',
        slotValue: '10:00',
        slotStartAt: '2026-01-04T16:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('uses the candidate local date when a late organizer slot crosses midnight', async () => {
    const availability = await service.getAvailability('Europe/London');
    const rolledOverSlot = availability.days
      .find((day) => day.date === '2026-01-05')
      ?.slots.find((slot) => slot.value === '23:00');

    expect(rolledOverSlot).toEqual({
      value: '23:00',
      label: '4:00 AM',
      startAt: '2026-01-05T04:00:00.000Z',
      endAt: '2026-01-05T04:30:00.000Z',
    });
  });

  it('uses a UTC Graph payload for valid IANA zones without a Windows mapping', () => {
    const internals = service as unknown as TestableBookingsService;

    expect(
      internals.toMicrosoftEventDateTime(
        new Date('2026-01-05T04:00:00.000Z'),
        'Europe/London',
      ),
    ).toEqual({
      dateTime: '2026-01-05T04:00:00.000Z',
      timeZone: 'UTC',
    });
  });

  it('keeps Arizona on MST in winter and summer', () => {
    const internals = service as unknown as TestableBookingsService;

    expect(
      internals.formatBookingDate(
        new Date('2026-01-04T16:00:00.000Z'),
        'America/Phoenix',
      ),
    ).toContain('9:00 AM MST');
    expect(
      internals.formatBookingDate(
        new Date('2026-07-05T16:00:00.000Z'),
        'America/Phoenix',
      ),
    ).toContain('9:00 AM MST');
  });

  it('turns a database uniqueness race into a user-facing slot conflict', async () => {
    bookingsRepository.save.mockRejectedValueOnce({ code: '23505' });

    await expect(
      service.createBooking({
        fullName: 'Central Candidate',
        email: 'candidate@example.com',
        phone: '312-555-0100',
        timezone: 'America/Chicago',
        slotDate: '2026-01-04',
        slotValue: '10:00',
        slotStartAt: '2026-01-04T15:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('removes the provisional booking if calendar creation fails', async () => {
    const internals = service as unknown as TestableBookingsService;
    internals.createCalendarEvent = jest
      .fn()
      .mockRejectedValue(new InternalServerErrorException('Graph failed'));

    await expect(
      service.createBooking({
        fullName: 'Central Candidate',
        email: 'candidate@example.com',
        phone: '312-555-0100',
        timezone: 'America/Chicago',
        slotDate: '2026-01-04',
        slotValue: '10:00',
        slotStartAt: '2026-01-04T15:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(bookingsRepository.delete).toHaveBeenCalledWith({
      id: 'booking-id',
    });
  });
});
