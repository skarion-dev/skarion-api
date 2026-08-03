import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { Server } from 'node:http';
import request from 'supertest';
import { BookingSettings } from 'src/entities/booking-settings.entity';
import { Booking } from 'src/entities/booking.entity';
import { SharepointService } from '../etl/sharepoint.service';
import { MailerService } from '../mailer/mailer.service';
import { MicrosoftService } from '../microsoft/microsoft.service';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

type SentMail = {
  recipients: string[];
  text: string;
  attachments: Array<{ contentBase64: string }>;
};

describe('Booking HTTP integration', () => {
  let app: INestApplication;
  let httpServer: Server;
  let bookingsRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let mailerService: {
    sendMail: jest.MockedFunction<(message: SentMail) => Promise<void>>;
  };
  let sharepointService: { uploadBookingResume: jest.Mock };

  beforeAll(async () => {
    process.env.BOOKING_TIMEZONE = 'America/New_York';
    process.env.BOOKING_DURATION_MINUTES = '30';
    process.env.BOOKING_AVAILABILITY_DAYS = '30';
    process.env.BOOKING_MIN_LEAD_HOURS = '2';
    process.env.BOOKING_ORGANIZER_EMAIL = 'organizer@example.com';
    process.env.BOOKING_INTERNAL_NOTIFY_EMAILS = 'team@example.com';
    process.env.DEFAULT_FROM_EMAIL = 'sender@example.com';

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
    mailerService = { sendMail: jest.fn().mockResolvedValue(undefined) };
    sharepointService = {
      uploadBookingResume: jest.fn().mockResolvedValue({
        url: 'https://sharepoint.example/resume.pdf',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: bookingsRepository,
        },
        {
          provide: getRepositoryToken(BookingSettings),
          useValue: { findOneBy: jest.fn().mockResolvedValue(null) },
        },
        { provide: MailerService, useValue: mailerService },
        {
          provide: MicrosoftService,
          useValue: { getAccessToken: jest.fn().mockResolvedValue('token') },
        },
        { provide: SharepointService, useValue: sharepointService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('books a Central slot through multipart HTTP and propagates it to every transport', async () => {
    const graphPost = jest
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

    const availabilityResponse = await request(httpServer)
      .get('/bookings/availability')
      .query({ timezone: 'America/Chicago' })
      .expect(200);
    const availability = availabilityResponse.body as {
      days: Array<{
        date: string;
        slots: Array<{ value: string; label: string; startAt: string }>;
      }>;
    };
    const dayWithSlot = availability.days.find((day) =>
      day.slots.some((candidateSlot) => candidateSlot.value === '10:00'),
    );
    const slot = dayWithSlot?.slots.find(
      (candidateSlot) => candidateSlot.value === '10:00',
    );

    expect(slot).toEqual(
      expect.objectContaining({
        label: '9:00 AM',
      }),
    );

    await request(httpServer)
      .post('/bookings')
      .field('fullName', 'Central Candidate')
      .field('email', 'candidate@example.com')
      .field('phone', '312-555-0100')
      .field('timezone', 'America/Chicago')
      .field('slotDate', dayWithSlot?.date ?? '')
      .field('slotValue', '10:00')
      .field('slotStartAt', slot?.startAt ?? '')
      .attach('resume', Buffer.from('%PDF-1.4 integration resume'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as {
          timezone: string;
          slotLabel: string;
          slotStartAt: string;
        };
        expect(body).toEqual(
          expect.objectContaining({
            timezone: 'America/Chicago',
            slotLabel: '9:00 AM',
            slotStartAt: slot?.startAt,
          }),
        );
      });

    expect(sharepointService.uploadBookingResume).toHaveBeenCalledTimes(1);
    expect(bookingsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: 'America/Chicago',
        slotLabel: '9:00 AM',
      }),
    );

    const graphEvent = graphPost.mock.calls[1]?.[1] as {
      start: { dateTime: string; timeZone: string };
      body: { content: string };
    };
    expect(graphEvent.start.timeZone).toBe('Central Standard Time');
    expect(graphEvent.start.dateTime).toMatch(/T09:00:00$/);
    expect(graphEvent.body.content).toMatch(/9:00 AM C[DS]T/);

    const candidateMail = mailerService.sendMail.mock.calls.find(
      ([message]) => message.recipients[0] === 'candidate@example.com',
    )?.[0];
    expect(candidateMail).toBeDefined();
    if (!candidateMail) throw new Error('Candidate email was not sent');
    expect(candidateMail.text).toMatch(/9:00 AM C[DS]T/);
    const expectedICSStart = (slot?.startAt ?? '')
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
    expect(
      Buffer.from(
        candidateMail.attachments[0].contentBase64,
        'base64',
      ).toString('utf8'),
    ).toContain(`DTSTART:${expectedICSStart}`);
  });
});
