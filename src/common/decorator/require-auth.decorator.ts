import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

export function RequireAuth() {
  return applyDecorators(ApiBearerAuth('jwt'), UseGuards(AuthGuard));
}
