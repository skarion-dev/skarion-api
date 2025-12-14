import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';

export function RequireAuth() {
  return applyDecorators(UseGuards(AuthGuard));
}
