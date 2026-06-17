import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }, z.string().max(maxLength).optional());

const bookingSlotValues = [
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '21:00',
  '22:00',
  '23:00',
] as const;

export const bookingSlotDefinitions = [
  { value: '10:00', label: '10:00 AM', hour: 10, minute: 0 },
  { value: '11:00', label: '11:00 AM', hour: 11, minute: 0 },
  { value: '12:00', label: '12:00 PM', hour: 12, minute: 0 },
  { value: '13:00', label: '1:00 PM', hour: 13, minute: 0 },
  { value: '14:00', label: '2:00 PM', hour: 14, minute: 0 },
  { value: '21:00', label: '9:00 PM', hour: 21, minute: 0 },
  { value: '22:00', label: '10:00 PM', hour: 22, minute: 0 },
  { value: '23:00', label: '11:00 PM', hour: 23, minute: 0 },
] as const;

export const createBookingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.email(),
  ),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?1\s?)?(\([0-9]{3}\)|[0-9]{3})[\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$/, 'Enter a valid 10-digit US phone number'),
  timezone: z.string().optional(),
  address: optionalTrimmedString(255),
  note: optionalTrimmedString(1000),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotValue: z.enum(bookingSlotValues),
});

export class CreateBookingDto extends createZodDto(createBookingSchema) {}

export class BookingSlotResponse {
  @ApiProperty()
  value: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  startAt: string;

  @ApiProperty()
  endAt: string;
}

export class BookingAvailabilityDayResponse {
  @ApiProperty()
  date: string;

  @ApiProperty({ type: [BookingSlotResponse] })
  slots: BookingSlotResponse[];
}

export class BookingAvailabilityResponse {
  @ApiProperty()
  timezone: string;

  @ApiProperty()
  timezoneLabel: string;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty({ type: [BookingAvailabilityDayResponse] })
  days: BookingAvailabilityDayResponse[];
}

export class BookingResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ required: false, nullable: true })
  address?: string;

  @ApiProperty({ required: false, nullable: true })
  note?: string;

  @ApiProperty()
  slotDate: string;

  @ApiProperty()
  slotValue: string;

  @ApiProperty()
  slotLabel: string;

  @ApiProperty()
  slotStartAt: Date;

  @ApiProperty()
  slotEndAt: Date;

  @ApiProperty()
  timezone: string;

  @ApiProperty({ required: false, nullable: true })
  meetingJoinUrl?: string;

  @ApiProperty()
  reminderScheduled: boolean;

  @ApiProperty()
  createdAt: Date;
}
