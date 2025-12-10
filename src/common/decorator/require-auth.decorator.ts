import { applyDecorators, UseGuards } from '@nestjs/common';

export function RequireAuth() {
  return applyDecorators(UseGuards());
}
