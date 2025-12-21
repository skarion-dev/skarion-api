import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SendMailOptions } from './dtos';
import { MicrosoftService } from '../microsoft/microsoft.service';

@Injectable()
export class MailerService {
  private senderEmail = process.env.DEFAULT_FROM_EMAIL!;

  constructor(private readonly microsoftService: MicrosoftService) {}

  async sendMail(sendEmailDTO: SendMailOptions) {
    const { recipients, subject, text, html, placeholders } = sendEmailDTO;
    const accessToken = await this.microsoftService.getAccessToken();

    const url = `https://graph.microsoft.com/v1.0/users/${this.senderEmail}/sendMail`;

    const mail = {
      message: {
        subject,
        body: {
          contentType: html ? 'HTML' : 'Text',
          content: html || text,
        },
        toRecipients: recipients.map((recipient) => ({
          emailAddress: { address: recipient },
        })),
      },
    };

    try {
      const response = await axios.post(url, mail, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return {
        success: true,
        message: `Email sent successfully to ${recipients.join(', ')}`,
        graphResponse: response.data,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
