import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorator/require-permissions.decorator';
import { BookingsService } from './bookings.service';
import {
  BookingSettingsResponse,
  BookingAdminResponse,
  BookingResponse,
  RescheduleBookingDto,
  rescheduleBookingSchema,
  updateMeetingSummarySchema,
  updateBookingStatusSchema,
  UpdateBookingSettingsDto,
  updateBookingSettingsSchema,
} from './dtos';

@ApiTags('Bookings (Admin)')
@ApiSecurity('bearer')
@Controller('bookings/admin')
@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('MANAGE_BOOKING_SETTINGS')
export class BookingsAdminController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List consultation bookings and booking stats' })
  @ApiResponse({ status: 200, type: BookingAdminResponse })
  getBookings() {
    return this.bookingsService.getAdminBookings();
  }

  @Patch(':id/reschedule')
  @UsePipes(new ZodValidationPipe(rescheduleBookingSchema))
  @ApiOperation({ summary: 'Reschedule a consultation booking' })
  @ApiResponse({ status: 200, type: BookingResponse })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleBookingDto) {
    return this.bookingsService.rescheduleBooking(id, dto);
  }

  @Patch(':id/summary')
  @ApiOperation({ summary: 'Add or edit a consultation meeting summary' })
  @ApiResponse({ status: 200, type: BookingResponse })
  updateSummary(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateMeetingSummarySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`,
        ),
      );
    }
    return this.bookingsService.updateMeetingSummary(
      id,
      parsed.data.meetingSummary,
    );
  }

  @Delete(':id/summary')
  @ApiOperation({ summary: 'Delete a consultation meeting summary' })
  @ApiResponse({ status: 200, type: BookingResponse })
  deleteSummary(@Param('id') id: string) {
    return this.bookingsService.updateMeetingSummary(id, null);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the consultation booking status' })
  @ApiResponse({ status: 200, type: BookingResponse })
  updateStatus(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateBookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`,
        ),
      );
    }
    return this.bookingsService.updateBookingStatus(id, parsed.data.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a consultation booking' })
  @ApiResponse({ status: 200, type: BookingResponse })
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancelBooking(id);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get current booking settings' })
  @ApiResponse({
    status: 200,
    description: 'Current booking settings',
    type: BookingSettingsResponse,
  })
  getSettings() {
    return this.bookingsService.getBookingSettings();
  }

  @Patch('settings')
  @UsePipes(new ZodValidationPipe(updateBookingSettingsSchema))
  @ApiOperation({ summary: 'Update booking settings' })
  @ApiResponse({
    status: 200,
    description: 'Updated booking settings',
    type: BookingSettingsResponse,
  })
  updateSettings(@Body() dto: UpdateBookingSettingsDto) {
    return this.bookingsService.updateBookingSettings(dto);
  }
}
