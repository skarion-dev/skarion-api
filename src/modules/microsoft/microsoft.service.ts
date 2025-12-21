import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MicrosoftService {
  private clientId = process.env.MS_CLIENT_ID!;
  private clientSecret = process.env.MS_CLIENT_SECRET!;
  private tenantId = process.env.MS_TENANT_ID!;
  private scope = 'https://graph.microsoft.com/.default';

  async getAccessToken(): Promise<string> {
    const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: this.scope,
    });

    try {
      const response = await axios.post(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error obtaining Microsoft access token:', error);
      throw new HttpException(
        'Failed to authenticate with Microsoft',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
