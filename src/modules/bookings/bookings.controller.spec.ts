import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController HTTP contract', () => {
  let app: INestApplication;
  let httpServer: Server;
  let bookingsService: {
    getAvailability: jest.Mock;
    createBooking: jest.Mock;
  };

  beforeEach(async () => {
    bookingsService = {
      getAvailability: jest.fn().mockResolvedValue({
        timezone: 'America/Chicago',
        timezoneLabel: 'Central Time',
        durationMinutes: 30,
        days: [],
      }),
      createBooking: jest.fn().mockResolvedValue({
        id: 'booking-id',
        timezone: 'America/Chicago',
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: bookingsService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  it('passes the requested IANA timezone to availability', async () => {
    await request(httpServer)
      .get('/bookings/availability')
      .query({ timezone: 'America/Chicago' })
      .expect(200)
      .expect((response) => {
        const body = response.body as { timezone: string };
        expect(body.timezone).toBe('America/Chicago');
      });

    expect(bookingsService.getAvailability).toHaveBeenCalledWith(
      'America/Chicago',
    );
  });

  it('accepts the confirmed timezone, exact instant, and PDF in multipart form data', async () => {
    await request(httpServer)
      .post('/bookings')
      .field('fullName', 'Central Candidate')
      .field('email', 'candidate@example.com')
      .field('phone', '312-555-0100')
      .field('timezone', 'America/Chicago')
      .field('slotDate', '2026-01-04')
      .field('slotValue', '10:00')
      .field('slotStartAt', '2026-01-04T15:00:00.000Z')
      .attach('resume', Buffer.from('%PDF-1.4 test resume'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as { timezone: string };
        expect(body.timezone).toBe('America/Chicago');
      });

    expect(bookingsService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: 'America/Chicago',
        slotStartAt: '2026-01-04T15:00:00.000Z',
      }),
      expect.objectContaining({
        originalname: 'resume.pdf',
        mimetype: 'application/pdf',
      }),
    );
  });

  it('rejects an ambiguous timezone abbreviation before service execution', async () => {
    await request(httpServer)
      .post('/bookings')
      .field('fullName', 'Central Candidate')
      .field('email', 'candidate@example.com')
      .field('phone', '312-555-0100')
      .field('timezone', 'CST')
      .field('slotDate', '2026-01-04')
      .field('slotValue', '10:00')
      .attach('resume', Buffer.from('%PDF-1.4 test resume'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expect(bookingsService.createBooking).not.toHaveBeenCalled();
  });

  it('rejects missing and unsupported resume uploads', async () => {
    const addValidFields = (pending: request.Test) =>
      pending
        .field('fullName', 'Central Candidate')
        .field('email', 'candidate@example.com')
        .field('phone', '312-555-0100')
        .field('timezone', 'America/Chicago')
        .field('slotDate', '2026-01-04')
        .field('slotValue', '10:00');

    await addValidFields(request(httpServer).post('/bookings')).expect(400);

    await addValidFields(request(httpServer).post('/bookings'))
      .attach('resume', Buffer.from('plain text'), {
        filename: 'resume.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(bookingsService.createBooking).not.toHaveBeenCalled();
  });
});
