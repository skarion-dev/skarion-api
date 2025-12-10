import { Injectable } from '@nestjs/common';
import { IAuthenticatedUser } from './common/interfaces/current-user-payload.interface';

@Injectable()
export class AppService {
  healthCheck(): string {
    return 'Hello World!';
  }

  me(currentUser: IAuthenticatedUser) {
    return currentUser;
  }
}
