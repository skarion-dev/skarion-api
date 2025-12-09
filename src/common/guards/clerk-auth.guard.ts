import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClerkService } from 'src/modules/auth/clerk.service';
import { IAuthenticatedUser } from '../interfaces/current-user-payload.interface';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly clerkService: ClerkService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    const requestState = await this.clerkService.authenticateRequest(req);
    // console.log('requestState', requestState);

    const { isAuthenticated } = requestState as any;

    if (!isAuthenticated) {
      throw new UnauthorizedException(
        'User not authenticated. Please ensure a valid session is provided.',
      );
    }
    

    const auth = (requestState.toAuth()?.sessionClaims) as unknown as IAuthenticatedUser;

    // console.log('auth', auth);

    if (!auth.id) {
      throw new UnauthorizedException(
        'User not found. Please ensure a valid session is provided.',
      );
    }

    req.auth = auth;

    return true;
  }
}
