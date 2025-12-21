import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
  imports: [MailerModule],
})
export class TeamModule {}
