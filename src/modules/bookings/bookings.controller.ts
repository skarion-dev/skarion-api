import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  BookingAvailabilityResponse,
  BookingResponse,
  CreateBookingDto,
} from './dtos';
import { BookingsService } from './bookings.service';

@ApiTags('Bookings')
@Controller('bookings')
@UsePipes(ZodValidationPipe)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Get the public booking availability calendar' })
  @ApiResponse({
    status: 200,
    description: 'Available booking dates and time slots',
    type: BookingAvailabilityResponse,
  })
  getAvailability(@Query('timezone') timezone?: string) {
    return this.bookingsService.getAvailability(timezone);
  }

  @Post()
  @ApiOperation({ summary: 'Create a public booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponse,
  })
  createBooking(@Body() data: CreateBookingDto) {
    return this.bookingsService.createBooking(data);
  }
}
