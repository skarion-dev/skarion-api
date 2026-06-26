# Skarion Meeting Confirmation Email Template

This README explains how to replace the current plain Skarion confirmation email body with a polished, responsive, email-client-safe HTML template inspired by the provided reference design.

The goal is to create a dark, premium-looking confirmation email that includes:

- Branded Skarion header
- Professional welcome/confirmation title
- Session schedule information
- Calendar invite notice
- Clear meeting joining button
- Support/reply instruction
- Clean footer and automated email note
- Mobile-friendly layout
- Inline CSS for reliable email rendering

Because email clients still behave like they were assembled during a power outage in 2008, this template uses table-based layout and inline CSS instead of modern web layout features.

---

## 1. Current Email Body

The current email body is:

```html
<p>Hi ${booking.fullName},</p>
<p>Your session with Skarion has been <strong>confirmed</strong> and <strong>scheduled<strong> <strong>for ${formattedStart}</strong>.</p>
<p>A calendar invitation is attached for your convenience, allowing you to add the meeting to your calendar with a single click.</p>
<p>Here is the Joining Link to the meeting -</p>${joinLink}
<p>If you have any additional information or questions ahead of the meeting, simply reply to this email, and we'll be happy to assist you.</p>
<p>Best Regards<br />Skarion</p>
```

### Issue in current body

This line contains broken HTML:

```html
<strong>scheduled<strong>
```

It should be:

```html
<strong>scheduled</strong>
```

The new template fixes this and turns the joining link into a proper button.

---

## 2. Recommended Final Design Structure

The email should follow this layout:

```text
Outer dark background
└── Centered email container, max-width 600px
    ├── Blue Skarion brand header
    ├── Hero/title section
    ├── Main message body
    ├── Session details card
    ├── Join meeting CTA button
    ├── Calendar invitation note
    ├── Support/reply note
    └── Footer
```

Recommended colors:

```text
Page background: #05070D
Email card background: #111827
Brand blue: #2563EB
Accent cyan: #38BDF8
Main text: #F9FAFB
Secondary text: #D1D5DB
Muted text: #9CA3AF
Border: #263244
Button text: #FFFFFF
```

---

## 3. Required Dynamic Variables

The template should receive these values from the backend:

| Variable | Purpose | Example |
|---|---|---|
| `booking.fullName` | Recipient name | `Tawkir Arifin` |
| `formattedStart` | Formatted session date/time | `June 25, 2026 at 7:00 PM BDT` |
| `joinLink` | Meeting URL | `https://meet.google.com/abc-defg-hij` |
| `companyName` | Company name | `Skarion` |
| `supportEmail` | Reply/support email | `support@skarion.com` |
| `logoUrl` | Optional hosted logo URL | `https://your-domain.com/logo.png` |
| `heroImageUrl` | Optional hosted hero/banner image URL | `https://your-domain.com/email-hero.png` |

Do not attach local images directly unless your email provider supports CID attachments. The safer approach is to host images publicly on your website, CDN, S3, Cloudinary, or similar storage. Email clients are dramatic little creatures and may block images, so the template must still look good without them.

---

## 4. Folder Structure

Use this structure:

```text
project-root/
├── src/
│   ├── emails/
│   │   ├── templates/
│   │   │   └── meetingConfirmationEmail.js
│   │   └── sendMeetingConfirmation.js
│   ├── utils/
│   │   └── formatDateTime.js
│   └── config/
│       └── emailConfig.js
├── .env
└── package.json
```

If your project already has an email or mailer folder, place the template inside that existing structure instead of creating a decorative folder jungle.

---

## 5. Install Required Packages

For a Node.js backend using Nodemailer:

```bash
npm install nodemailer
```

If you are using SendGrid, Resend, Mailgun, Postmark, or AWS SES, the HTML template still works. Only the sending function changes.

---

## 6. Environment Variables

Add these to `.env`:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM_NAME=Skarion
EMAIL_FROM_ADDRESS=no-reply@skarion.com
SUPPORT_EMAIL=support@skarion.com
SKARION_LOGO_URL=https://your-domain.com/assets/skarion-logo.png
SKARION_HERO_URL=https://your-domain.com/assets/meeting-confirmation-hero.png
```

For production, use a verified domain email such as:

```text
no-reply@skarion.com
support@skarion.com
```

Avoid sending production emails from Gmail SMTP unless your grand strategy is to fight spam filters for sport.

---

## 7. Email Template File

Create this file:

```text
src/emails/templates/meetingConfirmationEmail.js
```

Paste the following code:

```js
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMeetingConfirmationEmail({
  fullName,
  formattedStart,
  joinLink,
  companyName = 'Skarion',
  supportEmail = 'support@skarion.com',
  logoUrl = '',
  heroImageUrl = ''
}) {
  const safeName = escapeHtml(fullName || 'there');
  const safeFormattedStart = escapeHtml(formattedStart || 'your scheduled time');
  const safeJoinLink = escapeHtml(joinLink || '#');
  const safeCompanyName = escapeHtml(companyName);
  const safeSupportEmail = escapeHtml(supportEmail);
  const safeLogoUrl = escapeHtml(logoUrl);
  const safeHeroImageUrl = escapeHtml(heroImageUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeCompanyName} Session Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#05070D; font-family:Arial, Helvetica, sans-serif; color:#F9FAFB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#05070D; margin:0; padding:0; width:100%;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#111827; border-radius:18px; overflow:hidden; border:1px solid #263244;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#2563EB; padding:22px 24px;">
              ${safeLogoUrl
                ? `<img src="${safeLogoUrl}" alt="${safeCompanyName}" width="140" style="display:block; max-width:140px; height:auto; border:0; outline:none; text-decoration:none;" />`
                : `<div style="font-size:24px; font-weight:700; color:#FFFFFF; letter-spacing:0.3px;">${safeCompanyName}</div>`
              }
            </td>
          </tr>

          <!-- Hero Image -->
          ${safeHeroImageUrl
            ? `<tr>
                <td align="center" style="padding:28px 32px 0 32px;">
                  <img src="${safeHeroImageUrl}" alt="Session confirmed" width="536" style="display:block; width:100%; max-width:536px; height:auto; border-radius:12px; border:0; outline:none; text-decoration:none;" />
                </td>
              </tr>`
            : ''
          }

          <!-- Title -->
          <tr>
            <td align="center" style="padding:32px 32px 8px 32px;">
              <h1 style="margin:0; font-size:28px; line-height:36px; font-weight:700; color:#F9FAFB;">
                Your Skarion Session is Confirmed
              </h1>
            </td>
          </tr>

          <!-- Subtitle -->
          <tr>
            <td align="center" style="padding:0 32px 24px 32px;">
              <p style="margin:0; font-size:15px; line-height:24px; color:#D1D5DB;">
                We have scheduled your session and attached a calendar invitation for easy access.
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:8px 40px 0 40px;">
              <p style="margin:0 0 18px 0; font-size:15px; line-height:24px; color:#F9FAFB;">
                Hi ${safeName},
              </p>

              <p style="margin:0 0 22px 0; font-size:15px; line-height:24px; color:#D1D5DB;">
                Your session with <strong style="color:#F9FAFB;">${safeCompanyName}</strong> has been <strong style="color:#F9FAFB;">confirmed</strong> and scheduled for the time below.
              </p>
            </td>
          </tr>

          <!-- Details Card -->
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0B1220; border:1px solid #263244; border-radius:14px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.8px;">
                      Session Date & Time
                    </p>
                    <p style="margin:0; font-size:18px; line-height:28px; color:#F9FAFB; font-weight:700;">
                      ${safeFormattedStart}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 40px 28px 40px;">
              <a href="${safeJoinLink}" target="_blank" style="display:inline-block; background-color:#2563EB; color:#FFFFFF; text-decoration:none; font-size:16px; line-height:20px; font-weight:700; padding:15px 28px; border-radius:10px;">
                Join Meeting
              </a>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <p style="margin:0; font-size:13px; line-height:21px; color:#9CA3AF; text-align:center;">
                If the button does not work, copy and paste this link into your browser:<br />
                <a href="${safeJoinLink}" target="_blank" style="color:#38BDF8; text-decoration:underline; word-break:break-all;">${safeJoinLink}</a>
              </p>
            </td>
          </tr>

          <!-- Calendar Note -->
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #263244;">
                <tr>
                  <td style="padding-top:24px;">
                    <p style="margin:0 0 14px 0; font-size:15px; line-height:24px; color:#D1D5DB;">
                      A calendar invitation is attached to this email so you can add the session to your calendar with a single click.
                    </p>
                    <p style="margin:0; font-size:15px; line-height:24px; color:#D1D5DB;">
                      If you have any additional information or questions before the meeting, simply reply to this email and our team will assist you.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 40px 28px 40px;">
              <p style="margin:0; font-size:15px; line-height:24px; color:#F9FAFB;">
                Best Regards,<br />
                <strong>${safeCompanyName}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#0B1220; padding:24px 32px; border-top:1px solid #263244;">
              <p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#9CA3AF;">
                Need help? Contact us at
                <a href="mailto:${safeSupportEmail}" style="color:#38BDF8; text-decoration:none;">${safeSupportEmail}</a>
              </p>
              <p style="margin:0; font-size:12px; line-height:18px; color:#6B7280; font-style:italic;">
                This is an automated confirmation email. You can reply directly if you need assistance.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

module.exports = { buildMeetingConfirmationEmail };
```

---

## 8. Sending Function Using Nodemailer

Create this file:

```text
src/emails/sendMeetingConfirmation.js
```

Paste this code:

```js
const nodemailer = require('nodemailer');
const { buildMeetingConfirmationEmail } = require('./templates/meetingConfirmationEmail');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendMeetingConfirmationEmail({ booking, formattedStart, joinLink, calendarAttachment }) {
  if (!booking?.email) {
    throw new Error('Booking email is required.');
  }

  if (!joinLink) {
    throw new Error('Meeting join link is required.');
  }

  const html = buildMeetingConfirmationEmail({
    fullName: booking.fullName,
    formattedStart,
    joinLink,
    companyName: 'Skarion',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@skarion.com',
    logoUrl: process.env.SKARION_LOGO_URL || '',
    heroImageUrl: process.env.SKARION_HERO_URL || ''
  });

  const text = `
Hi ${booking.fullName || 'there'},

Your session with Skarion has been confirmed and scheduled for ${formattedStart}.

Join the meeting here:
${joinLink}

A calendar invitation is attached for your convenience.

If you have any additional information or questions before the meeting, reply to this email and our team will assist you.

Best Regards,
Skarion
  `.trim();

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Skarion'}" <${process.env.EMAIL_FROM_ADDRESS || 'no-reply@skarion.com'}>`,
    to: booking.email,
    subject: `Your Skarion Session is Confirmed - ${formattedStart}`,
    html,
    text,
    attachments: calendarAttachment
      ? [
          {
            filename: 'skarion-session.ics',
            content: calendarAttachment,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }
        ]
      : []
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendMeetingConfirmationEmail };
```

---

## 9. Replace Existing Mail Body

Wherever the current email body is generated, replace this old logic:

```js
const body = `
  <p>Hi ${booking.fullName},</p>
  <p>Your session with Skarion has been <strong>confirmed</strong> and <strong>scheduled<strong> <strong>for ${formattedStart}</strong>.</p>
  <p>A calendar invitation is attached for your convenience, allowing you to add the meeting to your calendar with a single click.</p>
  <p>Here is the Joining Link to the meeting -</p>${joinLink}
  <p>If you have any additional information or questions ahead of the meeting, simply reply to this email, and we'll be happy to assist you.</p>
  <p>Best Regards<br />Skarion</p>
`;
```

With:

```js
const { sendMeetingConfirmationEmail } = require('./src/emails/sendMeetingConfirmation');

await sendMeetingConfirmationEmail({
  booking,
  formattedStart,
  joinLink,
  calendarAttachment
});
```

Adjust the relative import path based on your actual project location. JavaScript imports are apparently humanity’s favorite tiny maze.

---

## 10. Calendar Invitation Attachment

If you already generate an `.ics` calendar invitation, pass it as `calendarAttachment`.

Example `.ics` content:

```js
function createCalendarInvite({ title, description, location, startDateUtc, endDateUtc, organizerEmail, attendeeEmail }) {
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Skarion//Meeting Confirmation//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@skarion.com
DTSTAMP:${formatIcsDate(new Date())}
DTSTART:${formatIcsDate(startDateUtc)}
DTEND:${formatIcsDate(endDateUtc)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
ORGANIZER;CN=Skarion:mailto:${organizerEmail}
ATTENDEE;CN=Participant;RSVP=TRUE:mailto:${attendeeEmail}
END:VEVENT
END:VCALENDAR`;
}

function formatIcsDate(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}
```

Important: `startDateUtc` and `endDateUtc` should be real UTC dates, not display strings.

---

## 11. Formatting the Session Date

Create this helper:

```text
src/utils/formatDateTime.js
```

```js
function formatDateTime(date, timeZone = 'Asia/Dhaka') {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone
  }).format(new Date(date));
}

module.exports = { formatDateTime };
```

Usage:

```js
const { formatDateTime } = require('./src/utils/formatDateTime');

const formattedStart = formatDateTime(booking.startTime, 'Asia/Dhaka');
```

For US-based users, pass a US timezone such as:

```js
America/New_York
America/Chicago
America/Denver
America/Los_Angeles
```

---

## 12. Image Requirements

For the reference-style design, prepare these images:

### Logo

Recommended:

```text
File type: PNG or SVG
Background: transparent
Width: 280px or larger
Displayed width in email: 140px
```

### Hero Image

Recommended:

```text
File type: JPG or PNG
Size: 1200px × 400px
Displayed width in email: 536px
Theme: career growth, training, mentorship, online meeting, professional success
```

The reference email uses a wide hero image under the title area. For Skarion, better image ideas are:

- Online consultation session
- Career coaching dashboard
- Student/professional joining a video meeting
- Abstract blue tech/career growth graphic
- Professional learning platform interface

Do not use images that look like crypto, banking, or finance unless Skarion suddenly becomes a suspicious wallet app, which would be a plot twist nobody ordered.

---

## 13. Email Client Compatibility Rules

Use these rules while editing the template:

### Do

- Use inline CSS
- Use table-based layout
- Keep width around `600px`
- Use fallback plain text
- Use absolute image URLs
- Use real `<a>` links for buttons
- Test in Gmail, Outlook, Apple Mail, and mobile

### Do not

- Use external CSS files
- Use JavaScript inside email
- Use CSS Grid or Flexbox for core layout
- Use background videos
- Depend on custom fonts
- Put important information only inside images
- Use massive images that slow down loading

---

## 14. Mobile Responsiveness

The template is already mobile-safe because:

- The outer table uses `width="100%"`
- The inner container uses `max-width:600px`
- Images use `width:100%; max-width:...`
- Text spacing is simple and readable

If you want more advanced mobile styling, you can add media queries, but some email clients ignore them with the confidence of a broken printer.

---

## 15. Security and Data Safety

The template includes an `escapeHtml()` function. Keep it.

It protects the email HTML from breaking if a user enters weird text in their booking name, such as:

```text
<script>alert('hello')</script>
```

Without escaping, user-provided text could damage the email layout or create security issues.

Always escape:

- Full name
- Meeting title
- Displayed date/time
- Support email
- Any user-submitted note

---

## 16. Testing Locally

Create a temporary test file:

```text
testEmailTemplate.js
```

```js
const fs = require('fs');
const { buildMeetingConfirmationEmail } = require('./src/emails/templates/meetingConfirmationEmail');

const html = buildMeetingConfirmationEmail({
  fullName: 'Tawkir Arifin',
  formattedStart: 'June 25, 2026 at 7:00 PM BDT',
  joinLink: 'https://meet.google.com/example-link',
  companyName: 'Skarion',
  supportEmail: 'support@skarion.com',
  logoUrl: '',
  heroImageUrl: ''
});

fs.writeFileSync('preview-meeting-confirmation.html', html);
console.log('Preview file created: preview-meeting-confirmation.html');
```

Run:

```bash
node testEmailTemplate.js
```

Open the generated file in your browser to preview the layout.

Browser preview is useful for layout checking, but final testing must happen inside real inboxes because Outlook exists to humble developers.

---

## 17. Production Testing Checklist

Before sending to real users, test the following:

```text
[ ] Recipient name appears correctly
[ ] Session date/time appears correctly
[ ] Join Meeting button opens the correct meeting URL
[ ] Fallback link is clickable
[ ] Calendar invitation is attached
[ ] Email has a plain-text fallback
[ ] Logo loads correctly
[ ] Hero image loads correctly
[ ] Email looks good without images loaded
[ ] Email looks good on mobile
[ ] Email looks acceptable in Outlook
[ ] Sender domain is verified
[ ] SPF, DKIM, and DMARC records are configured
[ ] Email does not land in spam
```

---

## 18. Recommended Subject Lines

Use one of these:

```text
Your Skarion Session is Confirmed
Your Skarion Consultation is Scheduled
Skarion Session Confirmed - ${formattedStart}
Your Meeting with Skarion is Confirmed
```

Best default:

```js
subject: `Your Skarion Session is Confirmed - ${formattedStart}`
```

---

## 19. Final Recommended Copy

Use this copy inside the designed email:

```text
Hi [First Name],

Your session with Skarion has been confirmed and scheduled for [Date and Time].

A calendar invitation is attached to this email so you can add the session to your calendar with a single click.

Click the button below to join the meeting:

[Join Meeting]

If you have any additional information or questions before the meeting, simply reply to this email and our team will assist you.

Best Regards,
Skarion
```

This keeps the message clear, professional, and action-focused without turning the email into a tragic corporate poetry recital.

---

## 20. Deployment Steps

Follow this order:

1. Create the email template file.
2. Add environment variables.
3. Add or update the email sending function.
4. Replace the old plain HTML body.
5. Add the `.ics` calendar attachment if not already implemented.
6. Test using a real booking object.
7. Send test emails to Gmail and Outlook.
8. Fix spacing, images, or link issues.
9. Verify SPF, DKIM, and DMARC.
10. Deploy to production.

---

## 21. Example Usage in Booking Flow

```js
const { sendMeetingConfirmationEmail } = require('./src/emails/sendMeetingConfirmation');
const { formatDateTime } = require('./src/utils/formatDateTime');

async function handleBookingConfirmation(booking) {
  const formattedStart = formatDateTime(booking.startTime, booking.timeZone || 'Asia/Dhaka');

  const joinLink = booking.meetingLink;

  const calendarAttachment = createCalendarInvite({
    title: 'Skarion Session',
    description: `Your confirmed session with Skarion. Join here: ${joinLink}`,
    location: joinLink,
    startDateUtc: booking.startTime,
    endDateUtc: booking.endTime,
    organizerEmail: process.env.EMAIL_FROM_ADDRESS,
    attendeeEmail: booking.email
  });

  await sendMeetingConfirmationEmail({
    booking,
    formattedStart,
    joinLink,
    calendarAttachment
  });
}
```

---

## 22. Notes for Future Improvements

Possible future additions:

- Add calendar buttons for Google Calendar, Outlook, and Apple Calendar
- Add reschedule/cancel links
- Add personalized program name
- Add assigned advisor name
- Add WhatsApp or phone support link
- Add tracking parameters to the meeting URL
- Add post-meeting follow-up email template
- Add reminder email template 24 hours before the session

Keep the confirmation email simple first. Make it reliable, readable, and clickable. Then add extra features once the basics stop catching fire.
