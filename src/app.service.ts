import { Injectable, Logger } from '@nestjs/common';
import { IAuthenticatedUser } from './common/interfaces/current-user-payload.interface';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  healthCheck(): string {
    return 'Hello World!';
  }

  me(currentUser: IAuthenticatedUser) {
    return currentUser;
  }

  @Cron('0 */10 * * * *')
  async keepAlive() {
    const backendUrl =
      process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

    try {
      this.logger.log(
        `Pinging health-check endpoint at ${backendUrl}/health-check to keep alive...`,
      );
      const response = await axios.get(`${backendUrl}/health-check`);
      this.logger.log(`Keep-alive ping successful: ${response.status}`);
    } catch (error) {
      this.logger.error(
        'Keep-alive ping failed',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
