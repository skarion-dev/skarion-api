import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { FormsService } from './forms.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorator/require-permissions.decorator';

@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  // Webhook for Power Automate to push data to
  // It is public so Power Automate can reach it without complex auth
  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.formsService.processWebhook(payload);
  }

  // Dashboard endpoint to view schedules
  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('MANAGE_USERS')
  async getForms(@Query('referralCode') referralCode?: string) {
    return this.formsService.getFormResponses(referralCode);
  }
}
