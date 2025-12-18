import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SendMailOptions } from './dtos';

@Injectable()
export class MailerService {
    private clientId = process.env.MS_CLIENT_ID!;
    private clientSecret = process.env.MS_CLIENT_SECRET!;
    private tenantId = process.env.MS_TENANT_ID!;
    private senderEmail = process.env.DEFAULT_FROM_EMAIL!;
    private scope = 'https://graph.microsoft.com/.default';

    private async getAccessToken(): Promise<string> {
        const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);
        params.append('scope', this.scope);

        try {
            const response = await axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Error obtaining access token:', error);
            throw new Error('OAuth2 authentication failed');
        }
    }

    async sendMail(sendEmailDTO: SendMailOptions) {
        const { recipients, subject, text, html, placeholders } = sendEmailDTO;
        const accessToken = await this.getAccessToken();

        const url = `https://graph.microsoft.com/v1.0/users/${this.senderEmail}/sendMail`;

        const mail = {
            message: {
                subject,
                body: {
                    contentType: 'Text',
                    content: text || html,
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
