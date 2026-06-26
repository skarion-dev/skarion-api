import { Controller, Get, Header, Post, Query } from '@nestjs/common';
import { MailerService } from './mailer.service';
import * as dtos from './dtos';
import {
  buildMeetingConfirmationEmail,
  buildTeamChatInviteEmail,
  buildBookingReminderEmail,
  buildInternalBookingNotificationEmail,
} from './email-templates.service';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('send')
  sendMail() {
    const sendEmailDTO: dtos.SendMailOptions = {
      recipients: ['rianulamin.r@gmail.com'],
      subject: 'Test Email',
      text: 'Hello, this is a test email!',
      html: '<p>Hello, this is a test email!</p>',
    };
    return this.mailerService.sendMail(sendEmailDTO);
  }

  @Get('preview/meeting-confirmation')
  @Header('Content-Type', 'text/html')
  previewMeetingConfirmation(
    @Query('fullName') fullName = 'John Doe',
    @Query('formattedStart') formattedStart = 'Friday, June 25, 2026 at 7:00 PM (Eastern Time)',
    @Query('joinLink') joinLink = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NjI5ZmM2MGMtZThkZi00YjhkLTlkNzAtNjY4MjhkNjY5NjY5',
  ) {
    return buildMeetingConfirmationEmail({ fullName, formattedStart, joinLink });
  }

  @Get('preview/team-chat-invite')
  @Header('Content-Type', 'text/html')
  previewTeamChatInvite(
    @Query('name') name = 'Jane Smith',
    @Query('courseName') courseName = 'Outside Plant Engineering course',
    @Query('inviteLink') inviteLink = 'https://teams.microsoft.com/l/chat/19%3achat_NjI5ZmM2MGMtZThkZi00YjhkLTlkNzAtNjY4MjhkNjY5NjY5',
  ) {
    return buildTeamChatInviteEmail({ name, courseName, inviteLink });
  }

  @Get('preview/booking-reminder')
  @Header('Content-Type', 'text/html')
  previewBookingReminder(
    @Query('fullName') fullName = 'John Doe',
    @Query('formattedStart') formattedStart = 'Friday, June 25, 2026 at 7:00 PM (Eastern Time)',
    @Query('joinLink') joinLink = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NjI5ZmM2MGMtZThkZi00YjhkLTlkNzAtNjY4MjhkNjY5NjY5',
  ) {
    return buildBookingReminderEmail({ fullName, formattedStart, joinLink });
  }

  @Get('preview/internal-notification')
  @Header('Content-Type', 'text/html')
  previewInternalNotification(
    @Query('fullName') fullName = 'John Doe',
    @Query('email') email = 'john.doe@example.com',
    @Query('phone') phone = '+1 555 123 4567',
    @Query('formattedStart') formattedStart = 'Friday, June 25, 2026 at 7:00 PM (Eastern Time)',
    @Query('address') address = '123 Main St, Anytown USA',
    @Query('note') note = 'Looking forward to the consultation!',
    @Query('joinLink') joinLink = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NjI5ZmM2MGMtZThkZi00YjhkLTlkNzAtNjY4MjhkNjY5NjY5',
  ) {
    return buildInternalBookingNotificationEmail({ fullName, email, phone, formattedStart, address, note, joinLink });
  }
}
