import {
  Body,
  Controller,
  Get,
  Patch,
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
