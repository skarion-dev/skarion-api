import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { RequireAuth } from './common/decorator/require-auth.decorator';
import { CurrentUser } from './common/decorator/current-user.decorator';
import { type IAuthenticatedUser } from './common/interfaces/current-user-payload.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('health-check')
  healthCheck(): string {
    return this.appService.healthCheck();
  }

  @Get('me')
  @RequireAuth()
  me(@CurrentUser() user: IAuthenticatedUser) {
    return this.appService.me(user);
  }
}
