import { Module, Global } from '@nestjs/common';
import { MicrosoftService } from './microsoft.service';

@Global()
@Module({
  providers: [MicrosoftService],
  exports: [MicrosoftService],
})
export class MicrosoftModule {}
