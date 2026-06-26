# Skarion Booking Confirmation Email Template for a Running Next.js Project

This guide explains how to replace the current plain booking-confirmation email body with a branded Skarion email template inside an existing Next.js project.

The template follows the provided reference design:

- Centered mobile-friendly email card
- Skarion logo at the top
- Rounded hero section
- Short confirmation message
- Meeting date/time emphasis
- CTA button for the joining link
- Calendar invitation attachment support
- Dark footer with help/support details
- Email-client-safe HTML using tables and inline CSS, because email clients apparently enjoy living in 2006

---

## 1. Current Email Body to Replace

Your existing email body is currently similar to this:

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

This README upgrades that into a reusable production-friendly email system.

---

## 2. Recommended Folder Structure

Add the email logic inside your existing Next.js project like this:

```txt
src/
  app/
    api/
      bookings/
        route.ts                         # Example API route that triggers booking confirmation
    dev/
      email-preview/
        page.tsx                         # Optional local preview page

  lib/
    email/
      mailer.ts                          # Nodemailer transport and send function
      calendar.ts                        # ICS calendar attachment generator
      templates/
        booking-confirmation.ts          # Skarion HTML email template
      utils.ts                           # HTML escaping and asset helpers

public/
  email/
    skarion-logo.png                     # Skarion logo
    skarion-hero.png                     # Hero image/banner
```

If your project does not use the `src/` folder, place the same files directly under `app/`, `lib/`, and `public/`.

---

## 3. Install Required Packages

Use Nodemailer for SMTP email sending and `ics` for calendar invitations.

```bash
npm install nodemailer ics
npm install -D @types/nodemailer
```

If your current project already has a mail provider like Resend, SendGrid, Mailgun, or AWS SES, keep that provider and only reuse the HTML template from this README.

---

## 4. Add Environment Variables

Create or update `.env.local`:

```env
# App URL used to generate absolute image links inside emails
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# SMTP settings
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# Mail identity
MAIL_FROM="Skarion <no-reply@yourdomain.com>"
REPLY_TO_EMAIL=support@skarion.com

# Support details shown in footer
SKARION_SUPPORT_EMAIL=support@skarion.com
SKARION_SUPPORT_PHONE=+1-800-123-4567
SKARION_HELP_CENTER_URL=https://yourdomain.com/help
```

Important notes:

- `NEXT_PUBLIC_APP_URL` must be a real public URL in production.
- Email images should use absolute URLs like `https://yourdomain.com/email/skarion-logo.png`.
- Relative paths like `/email/logo.png` often fail inside email clients, because email clients enjoy being fragile little goblins.

---

## 5. Add Email Assets

Place your assets here:

```txt
public/email/skarion-logo.png
public/email/skarion-hero.png
```

Recommended asset sizes:

| Asset | Recommended Size | Notes |
|---|---:|---|
| `skarion-logo.png` | 160 x 48 px | Transparent PNG preferred |
| `skarion-hero.png` | 600 x 320 px | Rounded hero image similar to the reference |

The template uses these final public URLs:

```txt
https://yourdomain.com/email/skarion-logo.png
https://yourdomain.com/email/skarion-hero.png
```

For local development, images may not appear in Gmail/Outlook unless your local server is publicly accessible. That is not your fault for once.

---

## 6. Create Email Utility Helpers

Create this file:

```txt
src/lib/email/utils.ts
```

```ts
export function escapeHtml(value: string | undefined | null): string {
  if (!value) return '';

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is missing. Add it to your environment variables.');
  }

  return baseUrl.replace(/\/$/, '');
}

export function getEmailAssetUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${cleanPath}`;
}
```

Why this matters:

- `escapeHtml()` prevents user-submitted names from breaking the email HTML.
- `getEmailAssetUrl()` creates absolute URLs for images.
- Email clients do not understand your Next.js file structure. Truly shocking.

---

## 7. Create the Skarion Booking Confirmation Template

Create this file:

```txt
src/lib/email/templates/booking-confirmation.ts
```

```ts
import { escapeHtml, getEmailAssetUrl } from '../utils';

type BookingConfirmationEmailProps = {
  fullName: string;
  formattedStart: string;
  joinLink: string;
  supportEmail?: string;
  supportPhone?: string;
  helpCenterUrl?: string;
};

export function bookingConfirmationEmailTemplate({
  fullName,
  formattedStart,
  joinLink,
  supportEmail = process.env.SKARION_SUPPORT_EMAIL || 'support@skarion.com',
  supportPhone = process.env.SKARION_SUPPORT_PHONE || '+1-800-123-4567',
  helpCenterUrl = process.env.SKARION_HELP_CENTER_URL || '#',
}: BookingConfirmationEmailProps): string {
  const safeName = escapeHtml(fullName);
  const safeFormattedStart = escapeHtml(formattedStart);
  const safeJoinLink = escapeHtml(joinLink);
  const safeSupportEmail = escapeHtml(supportEmail);
  const safeSupportPhone = escapeHtml(supportPhone);
  const safeHelpCenterUrl = escapeHtml(helpCenterUrl);

  const logoUrl = getEmailAssetUrl('/email/skarion-logo.png');
  const heroUrl = getEmailAssetUrl('/email/skarion-hero.png');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>Your Skarion Session is Confirmed</title>
  </head>

  <body style="margin:0; padding:0; background-color:#f2f4f8; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Your Skarion session is confirmed for ${safeFormattedStart}. Calendar invitation attached.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f4f8; margin:0; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px; background-color:#ffffff; border-radius:24px; overflow:hidden; border:1px solid #e5e7eb;">
            <tr>
              <td align="center" style="padding:28px 24px 18px 24px;">
                <img src="${logoUrl}" width="142" alt="Skarion" style="display:block; border:0; outline:none; text-decoration:none; max-width:142px; height:auto;" />
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td background="${heroUrl}" style="background-image:url('${heroUrl}'); background-size:cover; background-position:center; background-color:#07111f; border-radius:30px; overflow:hidden; padding:56px 32px 38px 32px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="color:#ffffff;">
                            <div style="font-size:30px; line-height:36px; font-weight:700; letter-spacing:-0.5px;">
                              Welcome to<br />Skarion
                            </div>
                            <div style="margin-top:18px; font-size:14px; line-height:20px; font-weight:700; max-width:250px;">
                              Your career session has been scheduled successfully.
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:28px 34px 10px 34px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="font-size:14px; line-height:24px; color:#111827;">
                      <div style="margin-bottom:8px;"><strong>Session confirmed</strong> and scheduled.</div>
                      <div style="margin-bottom:8px;"><strong>Calendar invitation</strong> is attached for one-click saving.</div>
                      <div><strong>Joining link</strong> is ready below.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px 0 24px;">
                <div style="height:1px; background-color:#d1d5db; line-height:1px; font-size:1px;">&nbsp;</div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:28px 34px 30px 34px;">
                <h1 style="margin:0; font-size:24px; line-height:30px; color:#111827; font-weight:700; letter-spacing:-0.3px;">
                  Your session is ready
                </h1>

                <p style="margin:16px 0 0 0; font-size:14px; line-height:22px; color:#374151; max-width:460px;">
                  Hi ${safeName}, your session with Skarion has been <strong>confirmed</strong> and scheduled for:
                </p>

                <p style="margin:14px 0 0 0; font-size:16px; line-height:24px; color:#111827; font-weight:700;">
                  ${safeFormattedStart}
                </p>

                <p style="margin:14px 0 0 0; font-size:13px; line-height:21px; color:#4b5563; max-width:460px;">
                  A calendar invitation is attached so you can add the meeting to your calendar with a single click.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
                  <tr>
                    <td align="center" bgcolor="#14b8c4" style="border-radius:999px;">
                      <a href="${safeJoinLink}" target="_blank" style="display:inline-block; padding:13px 34px; font-size:14px; line-height:18px; color:#ffffff; text-decoration:none; font-weight:700; border-radius:999px;">
                        Join Meeting
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:18px 0 0 0; font-size:12px; line-height:18px; color:#6b7280; max-width:460px;">
                  If the button does not work, copy and paste this link into your browser:<br />
                  <a href="${safeJoinLink}" target="_blank" style="color:#0f6b7a; text-decoration:underline; word-break:break-all;">${safeJoinLink}</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="background-color:#050505; padding:28px 34px 26px 34px; color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:20px; line-height:24px; font-weight:700; color:#ffffff;">
                      Need help?
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:14px; font-size:14px; line-height:20px; color:#ffffff;">
                      Call us at <a href="tel:${safeSupportPhone}" style="color:#ffffff; text-decoration:underline; font-weight:700;">${safeSupportPhone}</a>,<br />
                      email us at <a href="mailto:${safeSupportEmail}" style="color:#ffffff; text-decoration:underline; font-weight:700;">${safeSupportEmail}</a>,<br />
                      or visit our <a href="${safeHelpCenterUrl}" style="color:#ffffff; text-decoration:underline; font-weight:700;">Help Center</a> anytime.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:28px; font-size:10px; line-height:16px; color:#bdbdbd;">
                      You are receiving this email because you booked a session with Skarion.<br />
                      If you have any additional information or questions ahead of the meeting, simply reply to this email.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px; font-size:10px; line-height:16px; color:#bdbdbd;">
                      Best Regards,<br />Skarion
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function bookingConfirmationTextTemplate({
  fullName,
  formattedStart,
  joinLink,
}: Pick<BookingConfirmationEmailProps, 'fullName' | 'formattedStart' | 'joinLink'>): string {
  return [
    `Hi ${fullName},`,
    '',
    `Your session with Skarion has been confirmed and scheduled for ${formattedStart}.`,
    '',
    'A calendar invitation is attached for your convenience.',
    '',
    `Joining link: ${joinLink}`,
    '',
    "If you have any additional information or questions ahead of the meeting, simply reply to this email.",
    '',
    'Best Regards,',
    'Skarion',
  ].join('\n');
}
```

---

## 8. Create Calendar Invitation Generator

Create this file:

```txt
src/lib/email/calendar.ts
```

```ts
import { createEvent, DateArray } from 'ics';

type CalendarInviteInput = {
  fullName: string;
  email: string;
  startDate: Date;
  endDate: Date;
  joinLink: string;
};

function toDateArray(date: Date): DateArray {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ];
}

function getDurationInMinutes(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(Math.round(diffMs / 60000), 15);
}

export async function createSkarionCalendarInvite({
  fullName,
  email,
  startDate,
  endDate,
  joinLink,
}: CalendarInviteInput): Promise<string> {
  const durationMinutes = getDurationInMinutes(startDate, endDate);

  return new Promise((resolve, reject) => {
    createEvent(
      {
        title: 'Skarion Session',
        description: `Your Skarion session is confirmed. Join here: ${joinLink}`,
        location: joinLink,
        url: joinLink,
        start: toDateArray(startDate),
        duration: { minutes: durationMinutes },
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        organizer: {
          name: 'Skarion',
          email: process.env.REPLY_TO_EMAIL || 'support@skarion.com',
        },
        attendees: [
          {
            name: fullName,
            email,
            rsvp: true,
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

Important:

- `startDate` and `endDate` should be actual `Date` objects.
- Make sure your booking system stores timezone correctly.
- `formattedStart` is only for display inside the email body.
- The `.ics` file is what allows users to add the meeting to their calendar.

---

## 9. Create Nodemailer Mailer

Create this file:

```txt
src/lib/email/mailer.ts
```

```ts
import nodemailer from 'nodemailer';
import { createSkarionCalendarInvite } from './calendar';
import {
  bookingConfirmationEmailTemplate,
  bookingConfirmationTextTemplate,
} from './templates/booking-confirmation';

type SendBookingConfirmationEmailInput = {
  to: string;
  fullName: string;
  formattedStart: string;
  joinLink: string;
  startDate: Date;
  endDate: Date;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is missing. Check SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendBookingConfirmationEmail({
  to,
  fullName,
  formattedStart,
  joinLink,
  startDate,
  endDate,
}: SendBookingConfirmationEmailInput) {
  const transporter = getTransporter();

  const html = bookingConfirmationEmailTemplate({
    fullName,
    formattedStart,
    joinLink,
  });

  const text = bookingConfirmationTextTemplate({
    fullName,
    formattedStart,
    joinLink,
  });

  const calendarInvite = await createSkarionCalendarInvite({
    fullName,
    email: to,
    startDate,
    endDate,
    joinLink,
  });

  return transporter.sendMail({
    from: process.env.MAIL_FROM || 'Skarion <no-reply@skarion.com>',
    to,
    replyTo: process.env.REPLY_TO_EMAIL || process.env.SKARION_SUPPORT_EMAIL,
    subject: `Your Skarion Session is Confirmed for ${formattedStart}`,
    html,
    text,
    attachments: [
      {
        filename: 'skarion-session.ics',
        content: calendarInvite,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ],
  });
}
```

---

## 10. Trigger the Email From an App Router API Route

Example route:

```txt
src/app/api/bookings/route.ts
```

```ts
import { NextResponse } from 'next/server';
import { sendBookingConfirmationEmail } from '@/lib/email/mailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const booking = {
      fullName: body.fullName,
      email: body.email,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      joinLink: body.joinLink,
    };

    if (!booking.fullName || !booking.email || !booking.joinLink) {
      return NextResponse.json(
        { message: 'fullName, email, and joinLink are required.' },
        { status: 400 },
      );
    }

    const formattedStart = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/New_York',
    }).format(booking.startDate);

    // 1. Save the booking in your database first.
    // Example:
    // const savedBooking = await db.booking.create({ data: booking });

    // 2. Send the confirmation email after successful booking creation.
    await sendBookingConfirmationEmail({
      to: booking.email,
      fullName: booking.fullName,
      formattedStart,
      joinLink: booking.joinLink,
      startDate: booking.startDate,
      endDate: booking.endDate,
    });

    return NextResponse.json({
      message: 'Booking confirmed and email sent successfully.',
    });
  } catch (error) {
    console.error('Booking confirmation email failed:', error);

    return NextResponse.json(
      { message: 'Booking created, but confirmation email failed.' },
      { status: 500 },
    );
  }
}
```

Adjust the route name based on your project. If your existing project already has a booking API route, do not create a duplicate route. Add the `sendBookingConfirmationEmail()` call inside the existing booking-confirmation logic.

---

## 11. Trigger the Email From a Server Action

If your running Next.js project uses Server Actions instead of API routes, use this pattern:

```ts
'use server';

import { sendBookingConfirmationEmail } from '@/lib/email/mailer';

export async function confirmBookingAction(formData: FormData) {
  const fullName = String(formData.get('fullName') || '');
  const email = String(formData.get('email') || '');
  const joinLink = String(formData.get('joinLink') || '');
  const startDate = new Date(String(formData.get('startDate')));
  const endDate = new Date(String(formData.get('endDate')));

  const formattedStart = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(startDate);

  // Save booking first.
  // await db.booking.create(...)

  await sendBookingConfirmationEmail({
    to: email,
    fullName,
    formattedStart,
    joinLink,
    startDate,
    endDate,
  });

  return { success: true };
}
```

---

## 12. Add a Local Email Preview Page

This helps you preview the email in the browser before sending test emails. Revolutionary concept: looking at the thing before shipping it.

Create this file:

```txt
src/app/dev/email-preview/page.tsx
```

```tsx
import { notFound } from 'next/navigation';
import { bookingConfirmationEmailTemplate } from '@/lib/email/templates/booking-confirmation';

export default function EmailPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const html = bookingConfirmationEmailTemplate({
    fullName: 'John Doe',
    formattedStart: 'Friday, July 10, 2026 at 3:00 PM',
    joinLink: 'https://meet.google.com/example-link',
  });

  return (
    <main style={{ background: '#f2f4f8', minHeight: '100vh', padding: 24 }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
```

Open this locally:

```txt
http://localhost:3000/dev/email-preview
```

---

## 13. If Your Project Uses the Pages Router

If your project still uses `pages/api`, add the mail call like this:

```txt
pages/api/bookings.ts
```

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendBookingConfirmationEmail } from '@/lib/email/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { fullName, email, startDate, endDate, joinLink } = req.body;

    const bookingStartDate = new Date(startDate);
    const bookingEndDate = new Date(endDate);

    const formattedStart = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/New_York',
    }).format(bookingStartDate);

    // Save booking first.
    // await db.booking.create(...)

    await sendBookingConfirmationEmail({
      to: email,
      fullName,
      formattedStart,
      joinLink,
      startDate: bookingStartDate,
      endDate: bookingEndDate,
    });

    return res.status(200).json({ message: 'Booking confirmed and email sent.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to send booking confirmation email.' });
  }
}
```

---

## 14. Replace Your Current Mail Body

Wherever your current code has this:

```ts
const mailBody = `...old HTML...`;
```

Replace it with:

```ts
const html = bookingConfirmationEmailTemplate({
  fullName: booking.fullName,
  formattedStart,
  joinLink,
});
```

Then pass `html` into your existing mail sender:

```ts
await transporter.sendMail({
  from: process.env.MAIL_FROM,
  to: booking.email,
  subject: `Your Skarion Session is Confirmed for ${formattedStart}`,
  html,
});
```

If your current mail sender already handles attachments, add the `.ics` attachment there as shown in the `mailer.ts` file.

---

## 15. Make the Design Match the Reference More Closely

The reference has these visual sections:

```txt
[White card]
  [Skarion logo]
  [Rounded hero image]
  [Three short feature lines]
  [Divider]
  [Main confirmation title]
  [Short message]
  [Rounded CTA button]
  [Black support footer]
```

The template already follows this structure. To fine-tune it:

| Design Area | Where to Edit |
|---|---|
| Logo size | `width="142"` in the logo `<img>` |
| Hero image | `public/email/skarion-hero.png` |
| Button color | `bgcolor="#14b8c4"` and CTA `background` styles |
| Card width | `max-width:620px` |
| Card roundness | `border-radius:24px` |
| Hero roundness | `border-radius:30px` |
| Footer background | `background-color:#050505` |

---

## 16. Email Client Compatibility Rules

Follow these rules unless you enjoy broken emails:

1. Use inline CSS.
2. Use table layout for the main email structure.
3. Use absolute image URLs.
4. Do not rely on Tailwind classes inside email HTML.
5. Do not use external fonts unless you accept inconsistent rendering.
6. Keep width around `600px` to `620px`.
7. Always include plain text fallback.
8. Test in Gmail and Outlook.

Email HTML is not normal web HTML. It is web HTML after being dragged through a swamp and judged by Outlook.

---

## 17. Recommended Production Behavior

### Option A: Send Email Immediately

Good for small booking volume.

```ts
await sendBookingConfirmationEmail(...);
```

### Option B: Queue the Email

Better for production systems with higher volume.

Recommended tools:

- BullMQ with Redis
- Inngest
- Trigger.dev
- QStash
- AWS SQS

Suggested production flow:

```txt
1. User books session
2. Save booking to database
3. Push email job to queue
4. Return success response to user
5. Worker sends email and logs result
```

This prevents the booking request from failing just because SMTP sneezes.

---

## 18. Error Handling Recommendation

Inside the booking flow:

```ts
try {
  await sendBookingConfirmationEmail({
    to: booking.email,
    fullName: booking.fullName,
    formattedStart,
    joinLink,
    startDate,
    endDate,
  });
} catch (error) {
  console.error('Failed to send Skarion booking confirmation email:', error);

  // Optional: save failed email attempt to database for retry.
  // await db.emailLog.create({ data: { bookingId: booking.id, status: 'FAILED' } });
}
```

Recommended email log table fields:

```txt
id
bookingId
recipientEmail
subject
status: SENT | FAILED | RETRYING
providerMessageId
errorMessage
createdAt
updatedAt
```

---

## 19. Testing Checklist

Before deploying, test these cases:

- Email sends successfully to Gmail.
- Email sends successfully to Outlook.
- Logo loads correctly.
- Hero image loads correctly.
- Join Meeting button opens the correct meeting link.
- Plain text fallback is readable.
- Calendar `.ics` file is attached.
- Calendar event has correct date and time.
- Reply-to email works.
- Long names do not break the layout.
- Long joining links wrap properly.
- Email still looks acceptable on mobile.

---

## 20. Deployment Checklist

Before going live:

```txt
[ ] Upload skarion-logo.png to public/email/
[ ] Upload skarion-hero.png to public/email/
[ ] Set NEXT_PUBLIC_APP_URL in production
[ ] Set SMTP_HOST
[ ] Set SMTP_PORT
[ ] Set SMTP_USER
[ ] Set SMTP_PASS
[ ] Set MAIL_FROM
[ ] Set REPLY_TO_EMAIL
[ ] Set SKARION_SUPPORT_EMAIL
[ ] Set SKARION_SUPPORT_PHONE
[ ] Test with Gmail
[ ] Test with Outlook
[ ] Confirm calendar invitation attachment
[ ] Confirm booking email fires only after booking is saved
```

---

## 21. Final Integration Summary

Use this implementation path:

```txt
1. Add email assets to public/email/
2. Add utils.ts
3. Add booking-confirmation.ts
4. Add calendar.ts
5. Add mailer.ts
6. Add environment variables
7. Call sendBookingConfirmationEmail() after booking confirmation
8. Test with real inboxes
9. Deploy
```

The final email should feel like a polished Skarion confirmation email, not a sad paragraph assembled during a server outage.
