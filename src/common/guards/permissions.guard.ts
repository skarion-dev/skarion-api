import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorator/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.permissions) {
      return false; // User unauthenticated or has no permissions array assigned via AuthGuard
    }

    return requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );
  }
}
