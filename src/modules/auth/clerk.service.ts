// src/modules/auth/clerk.service.ts
import { Injectable } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { appConfig } from 'src/config/app-config';

@Injectable()
export class ClerkService {
  private readonly clerk = createClerkClient({
    secretKey: appConfig.env.CLERK_SECRET_KEY!,
    publishableKey: appConfig.env.CLERK_PUBLISHABLE_KEY!,
  });

  private buildRequestUrl(req: any): string {
    const proto =
      (req.headers['x-forwarded-proto'] as string) ??
      req.protocol ??
      'http';

    const host =
      (req.headers['x-forwarded-host'] as string) ??
      req.headers.host;

    const path = req.originalUrl ?? req.url ?? '';

    const safeHost = host || 'localhost';

    return `${proto}://${safeHost}${path}`;
  }

  async authenticateRequest(req: any) {
    const requestUrl = this.buildRequestUrl(req);

    const clerkRequest = new Request(requestUrl, {
      method: req.method,
      headers: req.headers as any,
    });

    return this.clerk.authenticateRequest(clerkRequest, {
      // jwtKey: appConfig.env.CLERK_SECRET_KEY,
    });
  }

  async getUser(userId: string) {
    return this.clerk.users.getUser(userId);
  }

  async getSession(sessionId: string) {
    return this.clerk.sessions.getSession(sessionId);
  }
}
