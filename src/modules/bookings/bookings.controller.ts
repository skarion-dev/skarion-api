import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  BookingAvailabilityResponse,
  BookingResponse,
  createBookingSchema,
} from './dtos';
import { BookingsService } from './bookings.service';

const ALLOWED_RESUME_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  @UsePipes(ZodValidationPipe)
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
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponse,
  })
  @UseInterceptors(
    FileInterceptor('resume', {
      limits: { fileSize: MAX_RESUME_SIZE },
    }),
  )
  createBooking(
    @Body() body: Record<string, string>,
    @UploadedFile() resume?: Express.Multer.File,
  ) {
    // ── Validate the resume file ──────────────────────────────────────────
    if (!resume) {
      throw new BadRequestException('A resume file is required.');
    }

    if (!ALLOWED_RESUME_MIMES.has(resume.mimetype)) {
      throw new BadRequestException(
        'Resume must be a PDF or Word document (.pdf, .doc, .docx).',
      );
    }

    // ── Validate the body fields using the Zod schema directly ────────────
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
      throw new BadRequestException(messages);
    }

    return this.bookingsService.createBooking(parsed.data, resume);
  }
}
