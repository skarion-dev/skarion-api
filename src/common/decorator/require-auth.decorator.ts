import { applyDecorators, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';

export function RequireAuth() {
  return applyDecorators(
    UseGuards(ClerkAuthGuard),
  );
}
