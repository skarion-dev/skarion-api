import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkModule } from './modules/auth/ clerk.module';

@Module({
  imports: [DatabaseModule, ClerkModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
