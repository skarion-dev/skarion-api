import { Body, Controller, Post } from '@nestjs/common';
import { MailerService } from './mailer.service';
import * as dtos from './dtos';

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
}
