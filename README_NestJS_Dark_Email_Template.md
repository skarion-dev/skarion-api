# Skarion NestJS Email Template Implementation Guide

This guide explains how to replace the current plain Skarion booking-confirmation email with a polished, dark, card-style email template inspired by the provided reference image.

The reference design uses:

- A dark navy outer background
- A centered 600px email container
- Top header with logo and optional social icons
- A colorful hero/banner image
- A main content card
- A strong CTA button
- A secondary fallback link
- A help/support block
- Footer disclaimer and company address

Because email clients are tiny haunted browsers from 2009, this implementation uses table-based HTML, inline styles, hosted images, and conservative CSS.

---

## 1. Final Email Behavior

When a user books a Skarion session, the user should receive an email that says:

```html
Hi {{fullName}},

Your session with Skarion has been confirmed and scheduled for {{formattedStart}}.

A calendar invitation is attached for your convenience, allowing you to add the meeting to your calendar with a single click.

Here is the joining link to the meeting:
{{joinLink}}

If you have any additional information or questions ahead of the meeting, simply reply to this email, and we'll be happy to assist you.

Best Regards,
Skarion
```

But instead of sending that as plain HTML paragraphs, it will be wrapped inside a professional branded email layout.

---

## 2. Recommended Folder Structure

Add this structure inside your existing NestJS project:

```txt
src/
  mail/
    mail.module.ts
    mail.service.ts
    templates/
      booking-confirmation.hbs
    types/
      booking-confirmation-email.type.ts
    utils/
      calendar-invite.util.ts
```

If you already have a mail module/service, do not create duplicates like a chaos goblin. Merge the template and methods into your existing module.

---

## 3. Install Required Packages

Install these packages:

```bash
npm install @nestjs-modules/mailer nodemailer handlebars ics @nestjs/config
npm install -D @types/nodemailer
```

For pnpm:

```bash
pnpm add @nestjs-modules/mailer nodemailer handlebars ics @nestjs/config
pnpm add -D @types/nodemailer
```

For yarn:

```bash
yarn add @nestjs-modules/mailer nodemailer handlebars ics @nestjs/config
yarn add -D @types/nodemailer
```

---

## 4. Add Environment Variables

Add these values to your `.env` file:

```env
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_FROM_NAME=Skarion
MAIL_FROM_ADDRESS=no-reply@skarion.com

APP_BASE_URL=https://yourdomain.com
ASSET_BASE_URL=https://yourdomain.com
SUPPORT_EMAIL=support@skarion.com
COMPANY_ADDRESS=Your Company Address Here
```

### Notes

- `APP_BASE_URL` is used for links like login, dashboard, booking page, etc.
- `ASSET_BASE_URL` is used for logo and hero images.
- Images inside emails must use absolute URLs. Relative paths like `/logo.png` will not work reliably in inboxes, because email clients apparently enjoy making developers miserable.

---

## 5. Add Email Assets

Place your email assets somewhere publicly accessible.

Recommended public asset paths:

```txt
public/
  email/
    skarion-logo.png
    booking-hero.png
```

The final URLs should look like:

```txt
https://yourdomain.com/email/skarion-logo.png
https://yourdomain.com/email/booking-hero.png
```

### Asset Guidelines

Use these sizes:

```txt
Logo:       120px wide or less
Hero image: 600px wide x 220px high
Format:     PNG or JPG
File size:  Under 300 KB if possible
```

Do not use SVG directly inside emails unless you enjoy debugging Gmail, Outlook, and their collective crimes against layout.

---

## 6. Configure NestJS to Copy Template Files

NestJS does not automatically copy `.hbs` template files into the `dist` folder. Add this to `nest-cli.json`:

```json
{
  "compilerOptions": {
    "assets": [
      {
        "include": "mail/templates/**/*",
        "outDir": "dist"
      }
    ],
    "watchAssets": true
  }
}
```

If your `nest-cli.json` already has `compilerOptions`, only add the `assets` and `watchAssets` parts.

Final example:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": [
      {
        "include": "mail/templates/**/*",
        "outDir": "dist"
      }
    ],
    "watchAssets": true
  }
}
```

---

## 7. Create the Email Context Type

Create this file:

```txt
src/mail/types/booking-confirmation-email.type.ts
```

```ts
export type BookingConfirmationEmailContext = {
  fullName: string;
  formattedStart: string;
  joinLink: string;
  logoUrl: string;
  heroImageUrl: string;
  supportEmail: string;
  companyAddress: string;
  currentYear: number;
  dashboardUrl?: string;
};

export type SendBookingConfirmationEmailInput = {
  to: string;
  fullName: string;
  formattedStart: string;
  joinLink: string;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
};
```

---

## 8. Create the Calendar Invite Utility

Create this file:

```txt
src/mail/utils/calendar-invite.util.ts
```

```ts
import { createEvent } from 'ics';

function toIcsDateArray(date: Date): [number, number, number, number, number] {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
}

export async function createBookingCalendarInvite(params: {
  fullName: string;
  joinLink: string;
  startDate: Date;
  endDate: Date;
}): Promise<string> {
  const { fullName, joinLink, startDate, endDate } = params;

  return new Promise((resolve, reject) => {
    createEvent(
      {
        title: 'Skarion Session',
        description: `Your Skarion session is confirmed. Join here: ${joinLink}`,
        location: joinLink,
        start: toIcsDateArray(startDate),
        end: toIcsDateArray(endDate),
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        organizer: {
          name: 'Skarion',
          email: process.env.MAIL_FROM_ADDRESS || 'no-reply@skarion.com',
        },
        attendees: [
          {
            name: fullName,
            email: '',
            rsvp: false,
            partstat: 'ACCEPTED',
            role: 'REQ-PARTICIPANT',
          },
        ],
      },
      (error, value) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(value);
      },
    );
  });
}
```

### Important

The attendee email is kept empty above because the utility does not receive the recipient email. If you want the attendee email in the `.ics` invite, update the utility like this:

```ts
export async function createBookingCalendarInvite(params: {
  fullName: string;
  attendeeEmail: string;
  joinLink: string;
  startDate: Date;
  endDate: Date;
})
```

Then pass `attendeeEmail` into the attendees array.

---

## 9. Create the Mail Module

Create this file:

```txt
src/mail/mail.module.ts
```

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secure = configService.get<string>('MAIL_SECURE') === 'true';

        return {
          transport: {
            host: configService.get<string>('MAIL_HOST'),
            port: Number(configService.get<string>('MAIL_PORT') || 587),
            secure,
            auth: {
              user: configService.get<string>('MAIL_USER'),
              pass: configService.get<string>('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: `"${configService.get<string>('MAIL_FROM_NAME') || 'Skarion'}" <${
              configService.get<string>('MAIL_FROM_ADDRESS') || 'no-reply@skarion.com'
            }>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

---

## 10. Register MailModule in AppModule

Open your main module:

```txt
src/app.module.ts
```

Add `MailModule`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailModule,
  ],
})
export class AppModule {}
```

If `ConfigModule.forRoot()` already exists in your app, do not add it twice. Duplicate global config is the kind of nonsense that breeds bugs in the walls.

---

## 11. Create the Handlebars Email Template

Create this file:

```txt
src/mail/templates/booking-confirmation.hbs
```

Paste this template:

```hbs
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Skarion Session Confirmed</title>

    <style>
      @media only screen and (max-width: 620px) {
        .email-container {
          width: 100% !important;
        }

        .content-padding {
          padding-left: 22px !important;
          padding-right: 22px !important;
        }

        .hero-image {
          width: 100% !important;
          height: auto !important;
        }

        .button {
          width: 100% !important;
          display: block !important;
        }
      }
    </style>
  </head>

  <body style="margin:0; padding:0; background-color:#0b1020; font-family:Arial, Helvetica, sans-serif; color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0b1020; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px; background-color:#111827; border:1px solid #29364d; border-radius:24px; overflow:hidden;">
            <!-- Header -->
            <tr>
              <td class="content-padding" style="padding:30px 40px 22px 40px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      <img src="{{logoUrl}}" width="130" alt="Skarion" style="display:block; border:0; outline:none; text-decoration:none; max-width:130px; height:auto;" />
                    </td>
                    <td align="right" style="vertical-align:middle; font-size:12px; color:#94a3b8;">
                      <span style="color:#94a3b8;">Session Confirmation</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Hero Image -->
            <tr>
              <td class="content-padding" style="padding:0 40px 0 40px;">
                <img src="{{heroImageUrl}}" width="520" alt="Skarion session confirmed" class="hero-image" style="display:block; width:520px; max-width:100%; height:auto; border:0; border-radius:18px; outline:none; text-decoration:none;" />
              </td>
            </tr>

            <!-- Main Card -->
            <tr>
              <td class="content-padding" style="padding:28px 40px 0 40px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e293b; border-radius:14px;">
                  <tr>
                    <td style="padding:30px 34px;">
                      <h1 style="margin:0 0 18px 0; font-size:24px; line-height:32px; font-weight:700; color:#ffffff;">
                        Your session is confirmed
                      </h1>

                      <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
                        Hi {{fullName}},
                      </p>

                      <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
                        Your session with <strong style="color:#ffffff;">Skarion</strong> has been <strong style="color:#ffffff;">confirmed</strong> and scheduled for
                        <strong style="color:#ffffff;">{{formattedStart}}</strong>.
                      </p>

                      <p style="margin:0 0 22px 0; font-size:15px; line-height:24px; color:#dbeafe;">
                        A calendar invitation is attached for your convenience, allowing you to add the meeting to your calendar with a single click.
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px 0;">
                        <tr>
                          <td align="center" bgcolor="#7c5cff" style="border-radius:8px;">
                            <a href="{{joinLink}}" target="_blank" class="button" style="display:inline-block; padding:14px 24px; font-size:14px; line-height:18px; font-weight:700; color:#ffffff; text-decoration:none; background-color:#7c5cff; border-radius:8px;">
                              Join Meeting
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 8px 0; font-size:14px; line-height:22px; color:#cbd5e1;">
                        Or use this joining link:
                      </p>

                      <p style="margin:0; font-size:14px; line-height:22px; word-break:break-all;">
                        <a href="{{joinLink}}" target="_blank" style="color:#8b5cf6; text-decoration:underline;">{{joinLink}}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Help Box -->
            <tr>
              <td class="content-padding" style="padding:20px 40px 0 40px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e293b; border-radius:14px;">
                  <tr>
                    <td style="padding:24px 30px;">
                      <h2 style="margin:0 0 10px 0; font-size:16px; line-height:22px; font-weight:700; color:#ffffff;">
                        Need help?
                      </h2>

                      <p style="margin:0; font-size:14px; line-height:22px; color:#cbd5e1;">
                        If you have any additional information or questions ahead of the meeting, simply reply to this email or contact us at
                        <a href="mailto:{{supportEmail}}" style="color:#8b5cf6; text-decoration:underline;">{{supportEmail}}</a>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="content-padding" style="padding:28px 40px 34px 40px;">
                <p style="margin:0 0 12px 0; font-size:12px; line-height:20px; color:#94a3b8;">
                  This email was sent to confirm your scheduled Skarion session. If you did not book this session, please contact our support team.
                </p>

                <p style="margin:0 0 12px 0; font-size:12px; line-height:20px; color:#94a3b8;">
                  {{companyAddress}}
                </p>

                <p style="margin:0; font-size:12px; line-height:20px; color:#64748b;">
                  © {{currentYear}} Skarion. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 12. Create the Mail Service

Create this file:

```txt
src/mail/mail.service.ts
```

```ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import {
  SendBookingConfirmationEmailInput,
  BookingConfirmationEmailContext,
} from './types/booking-confirmation-email.type';
import { createBookingCalendarInvite } from './utils/calendar-invite.util';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendBookingConfirmationEmail(input: SendBookingConfirmationEmailInput): Promise<void> {
    const assetBaseUrl = this.configService.get<string>('ASSET_BASE_URL');
    const supportEmail = this.configService.get<string>('SUPPORT_EMAIL') || 'support@skarion.com';
    const companyAddress = this.configService.get<string>('COMPANY_ADDRESS') || 'Skarion';

    if (!assetBaseUrl) {
      throw new Error('ASSET_BASE_URL is missing from environment variables.');
    }

    const context: BookingConfirmationEmailContext = {
      fullName: input.fullName,
      formattedStart: input.formattedStart,
      joinLink: input.joinLink,
      logoUrl: `${assetBaseUrl}/email/skarion-logo.png`,
      heroImageUrl: `${assetBaseUrl}/email/booking-hero.png`,
      supportEmail,
      companyAddress,
      currentYear: new Date().getFullYear(),
    };

    const attachments = [];

    if (input.startDate && input.endDate) {
      const calendarInvite = await createBookingCalendarInvite({
        fullName: input.fullName,
        joinLink: input.joinLink,
        startDate: input.startDate,
        endDate: input.endDate,
      });

      attachments.push({
        filename: 'skarion-session.ics',
        content: Buffer.from(calendarInvite),
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      });
    }

    try {
      await this.mailerService.sendMail({
        to: input.to,
        subject: `Your Skarion session is confirmed for ${input.formattedStart}`,
        template: 'booking-confirmation',
        context,
        attachments,
      });

      this.logger.log(`Booking confirmation email sent to ${input.to}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation email to ${input.to}`, error);
      throw error;
    }
  }
}
```

---

## 13. Connect It to Your Existing Booking Flow

Find the place in your project where you currently send this email:

```ts
const mailBody = `
  <p>Hi ${booking.fullName},</p>
  <p>Your session with Skarion has been <strong>confirmed</strong> and <strong>scheduled<strong> <strong>for ${formattedStart}</strong>.</p>
  <p>A calendar invitation is attached for your convenience, allowing you to add the meeting to your calendar with a single click.</p>
  <p>Here is the Joining Link to the meeting -</p>${joinLink}
  <p>If you have any additional information or questions ahead of the meeting, simply reply to this email, and we'll be happy to assist you.</p>
  <p>Best Regards<br />Skarion</p>
`;
```

Replace that entire HTML-string approach with this:

```ts
await this.mailService.sendBookingConfirmationEmail({
  to: booking.email,
  fullName: booking.fullName,
  formattedStart,
  joinLink,
  startDate: booking.startTime,
  endDate: booking.endTime,
  timezone: booking.timezone,
});
```

Make sure the service where this is called has `MailService` injected:

```ts
import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BookingService {
  constructor(private readonly mailService: MailService) {}

  async confirmBooking(bookingId: string) {
    const booking = await this.findBookingById(bookingId);

    const formattedStart = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: booking.timezone || 'America/New_York',
    }).format(new Date(booking.startTime));

    await this.mailService.sendBookingConfirmationEmail({
      to: booking.email,
      fullName: booking.fullName,
      formattedStart,
      joinLink: booking.joinLink,
      startDate: new Date(booking.startTime),
      endDate: new Date(booking.endTime),
      timezone: booking.timezone,
    });

    return booking;
  }
}
```

### Fix the Current HTML Bug

Your current body has this issue:

```html
<strong>scheduled<strong>
```

It should be:

```html
<strong>scheduled</strong>
```

The new template avoids this problem by keeping the HTML in a real template file instead of stuffing it into a string like some cursed sandwich.

---

## 14. If Your Booking Module Cannot See MailService

Import `MailModule` into the module that owns the booking service.

Example:

```ts
import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
```

If `MailModule` is already global or imported at a higher level, you may not need to do this.

---

## 15. Optional: Add a Preview Route for Development

Email templates are painful to test through real inboxes every time. Add a dev-only preview route so you can inspect the template in your browser.

Create:

```txt
src/mail/mail-preview.controller.ts
```

```ts
import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';

@Controller('dev/mail-preview')
export class MailPreviewController {
  constructor(private readonly configService: ConfigService) {}

  @Get('booking-confirmation')
  @Header('Content-Type', 'text/html')
  previewBookingConfirmation() {
    if (process.env.NODE_ENV === 'production') {
      return 'Preview disabled in production.';
    }

    const templatePath = join(process.cwd(), 'src/mail/templates/booking-confirmation.hbs');
    const templateSource = readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    const assetBaseUrl = this.configService.get<string>('ASSET_BASE_URL') || 'http://localhost:3000';

    return template({
      fullName: 'John Doe',
      formattedStart: 'Friday, June 28, 2026 at 11:00 AM',
      joinLink: 'https://meet.google.com/example-link',
      logoUrl: `${assetBaseUrl}/email/skarion-logo.png`,
      heroImageUrl: `${assetBaseUrl}/email/booking-hero.png`,
      supportEmail: 'support@skarion.com',
      companyAddress: 'Skarion, USA',
      currentYear: new Date().getFullYear(),
    });
  }
}
```

Then register it in `MailModule`:

```ts
import { MailPreviewController } from './mail-preview.controller';

@Module({
  imports: [/* existing imports */],
  controllers: [MailPreviewController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

Now visit:

```txt
http://localhost:3000/dev/mail-preview/booking-confirmation
```

Use this only in development.

---

## 16. Optional: Use a Queue for Email Sending

For production, it is better to queue emails instead of sending them directly inside request-response flow.

Install BullMQ:

```bash
npm install @nestjs/bullmq bullmq ioredis
```

Recommended flow:

```txt
Booking confirmed
  ↓
Add email job to queue
  ↓
Return success response to frontend
  ↓
Email worker sends message in background
```

This prevents the booking confirmation API from failing just because SMTP decided to take a smoke break.

---

## 17. Email Client Compatibility Rules

Follow these rules while editing the template:

### Use

```txt
Table layout
Inline styles
Absolute image URLs
PNG/JPG images
Simple fonts like Arial
600px max-width container
Fallback text links below buttons
```

### Avoid

```txt
CSS Grid
Flexbox as the main layout
External CSS files
JavaScript
Video tags
SVG images
Relative image paths
Complex animations
Large background images
```

Emails are not webpages. They are webpages after being dragged through a swamp and judged by Outlook.

---

## 18. Testing Checklist

Before deploying, test these items:

```txt
[ ] Email sends successfully in local development
[ ] Template renders correctly in browser preview
[ ] Logo loads from public URL
[ ] Hero image loads from public URL
[ ] CTA button opens the meeting link
[ ] Fallback join link works
[ ] Calendar .ics file is attached
[ ] Email subject includes the session date/time
[ ] Email renders correctly on mobile
[ ] Email renders correctly in Gmail
[ ] Email renders correctly in Outlook
[ ] Email renders correctly in Apple Mail
[ ] No broken template variables appear, such as {{fullName}}
[ ] Production SMTP credentials are valid
[ ] SPF, DKIM, and DMARC are configured for sending domain
```

---

## 19. Production Deployment Notes

### 1. Use a Real Email Provider

Recommended options:

```txt
SendGrid
Amazon SES
Postmark
Mailgun
Brevo
Resend SMTP
Google Workspace SMTP
```

Avoid sending from random free Gmail accounts in production. That is not infrastructure. That is a cry for deliverability help.

### 2. Configure Domain Authentication

Set up:

```txt
SPF
DKIM
DMARC
```

Without these, your beautiful email may go directly to spam, where dreams and cold outreach campaigns go to decay.

### 3. Use HTTPS Asset URLs

Every image URL should start with:

```txt
https://
```

Not:

```txt
http://
localhost
relative/path
```

### 4. Keep Email Size Reasonable

Try to keep the final HTML below 100 KB. Gmail may clip large messages.

---

## 20. Final Implementation Summary

You will add:

```txt
1. MailModule
2. MailService
3. Handlebars template
4. Booking confirmation context type
5. Optional calendar invite utility
6. Public logo and hero assets
7. Environment variables
8. Booking flow integration
```

After implementation, your old plain email body will become a branded Skarion email that follows the reference design while still supporting the dynamic booking fields:

```txt
fullName
formattedStart
joinLink
calendar invitation
support email
company footer
```

This keeps your current NestJS architecture clean, reusable, and far less embarrassing than dumping giant HTML strings inside a service method like a backend developer who lost a bet.
