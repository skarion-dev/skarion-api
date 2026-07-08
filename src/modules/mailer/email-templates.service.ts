function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

type BaseEmailProps = {
  title: string;
  preheader?: string;
  content: string;
  heroImageUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  helpCenterUrl?: string;
  logoUrl?: string;
  companyAddress?: string;
};

function buildBaseEmail({
  title,
  preheader,
  content,
  heroImageUrl,
  supportEmail,
  supportPhone,
  helpCenterUrl,
  logoUrl,
  companyAddress,
}: BaseEmailProps): string {
  const finalSupportEmail = supportEmail ?? process.env.SKARION_SUPPORT_EMAIL ?? process.env.SUPPORT_EMAIL ?? 'support@skarion.com';
  const finalSupportPhone = supportPhone ?? process.env.SKARION_SUPPORT_PHONE ?? '+1-800-123-4567';
  const finalHelpCenterUrl = helpCenterUrl ?? process.env.SKARION_HELP_CENTER_URL ?? '#';
  const finalLogoUrl = logoUrl ?? process.env.SKARION_LOGO_URL ?? `${process.env.ASSET_BASE_URL ?? 'http://localhost:5001'}/public/logo.svg`;
  const finalHeroImageUrl = heroImageUrl ?? process.env.SKARION_HERO_URL ?? `${process.env.ASSET_BASE_URL ?? 'http://localhost:5001'}/public/image.jpg`;        
  const finalCompanyAddress = companyAddress ?? process.env.SKARION_COMPANY_ADDRESS ?? 'Fairfax, Virginia';

  const safeTitle = escapeHtml(title);
  const safeSupportEmail = escapeHtml(finalSupportEmail);
  const safeSupportPhone = escapeHtml(finalSupportPhone);
  const safeHelpCenterUrl = escapeHtml(finalHelpCenterUrl);
  const safeLogoUrl = escapeHtml(finalLogoUrl);
  const safeHeroImageUrl = escapeHtml(finalHeroImageUrl);
  const safeCompanyAddress = escapeHtml(finalCompanyAddress);
  const currentYear = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />    
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>${safeTitle}</title>

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

  <body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    ${preheader ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${preheader}</div>` : ''}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e293b; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border:1px solid #ffffff; border-radius:24px; overflow:hidden;">
            <tr>
              <td class="content-padding" style="padding:30px 40px 25px 40px;"> 
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <img src="${safeLogoUrl}" width="45" alt="Skarion" style="display:block; border:0; outline:none; text-decoration:none; max-width:45px; height:auto;" />
                          </td>

                        </tr>
                      </table>
                    </td>

                  </tr>
                </table>
              </td>
            </tr>

            ${safeHeroImageUrl ? `
            <tr>
              <td class="content-padding" style="padding:0 40px 0px 40px;">     
                <img src="${safeHeroImageUrl}" width="520" height="180" alt="Skarion" class="hero-image" style="display:block; width:520px; max-width:100%; height:180px; object-fit:cover; border:0; border-radius:18px 18px 0 0; outline:none; text-decoration:none;" />

              </td>
            </tr>
            ` : ''}

            <tr>
              <td class="content-padding" style="padding:0 40px 0 40px;">       
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e293b; border-radius:${safeHeroImageUrl ? '0 0 14px 14px' : '14px'}; margin-top:${safeHeroImageUrl ? '-1px' : '0'};">
                  <tr>
                    <td style="padding:30px 34px;">
                      ${content}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="content-padding" style="padding:20px 40px 0 40px;">    
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1e293b; border-radius:14px;">       
                  <tr>
                    <td style="padding:24px 30px;">
                      <h2 style="margin:0 0 10px 0; font-size:16px; line-height:22px; font-weight:700; color:#ffffff;">
                        Need help?
                      </h2>

                      <p style="margin:0; font-size:14px; line-height:22px; color:#cbd5e1;">
                        If you have any questions, simply reply to this email or contact us at <a href="mailto:${safeSupportEmail}" style="color:#ff686b; text-decoration:underline;">${safeSupportEmail}</a>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="content-padding" style="padding:28px 40px 34px 40px;"> 
                <p style="margin:0 0 12px 0; font-size:12px; line-height:20px; color:#122461;">
                  This email was sent from Skarion. If you did not expect this email, please contact our support team.
                </p>

                <p style="margin:0 0 12px 0; font-size:12px; line-height:20px; color:#122461;">
                  ${safeCompanyAddress}
                </p>

                <p style="margin:0; font-size:12px; line-height:20px; color:#122461;">
                  © ${currentYear} Skarion. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

type BookingConfirmationEmailProps = {
  fullName: string;
  formattedStart: string;
  joinLink?: string;
  supportEmail?: string;
  supportPhone?: string;
  helpCenterUrl?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  companyAddress?: string;
};

export function buildMeetingConfirmationEmail({
  fullName,
  formattedStart,
  joinLink,
  supportEmail,
  supportPhone,
  helpCenterUrl,
  logoUrl,
  heroImageUrl,
  companyAddress,
}: BookingConfirmationEmailProps): string {
  const safeName = escapeHtml(fullName);
  const safeFormattedStart = escapeHtml(formattedStart);
  const safeJoinLink = escapeHtml(joinLink ?? '#');

  const content = `
    <h1 style="margin:0 0 18px 0; font-size:24px; line-height:32px; font-weight:700; color:#ffffff;">
      Your session is confirmed
    </h1>

    <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      Hi ${safeName},
    </p>

    <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      Your session with <strong style="color:#ffffff;">Skarion</strong> has been <strong style="color:#ffffff;">confirmed</strong> and scheduled for <strong style="color:#ffffff;">${safeFormattedStart}</strong>.
    </p>

    <p style="margin:0 0 22px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      A calendar invitation is attached for your convenience, allowing you to add the meeting to your calendar with a single click.
    </p>

    ${safeJoinLink ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px 0;">
      <tr>
        <td align="center" bgcolor="#ff686b" style="border-radius:8px;">        
          <a href="${safeJoinLink}" target="_blank" class="button" style="display:inline-block; padding:14px 24px; font-size:14px; line-height:18px; font-weight:700; color:#1e293b; text-decoration:none; background-color:#ffffff; border-radius:8px;">
            Join Meeting
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px 0; font-size:14px; line-height:22px; color:#cbd5e1;">
      Or use this joining link:
    </p>

    <p style="margin:0; font-size:14px; line-height:22px; word-break:break-all;">
      <a href="${safeJoinLink}" target="_blank" style="color:#ff686b; text-decoration:underline;">${safeJoinLink}</a>
    </p>
    ` : ''}
  `;

  return buildBaseEmail({
    title: 'Your Skarion Session is Confirmed',
    preheader: `Your session with Skarion is confirmed for ${formattedStart}`,  
    content,
    supportEmail,
    supportPhone,
    helpCenterUrl,
    logoUrl,
    heroImageUrl,
    companyAddress,
  });
}

export function buildMeetingConfirmationText({
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
    joinLink ? `Joining link: ${joinLink}` : '',
    '',
    "If you have any additional information or questions ahead of the meeting, simply reply to this email.",
    '',
    'Best Regards,',
    'Skarion',
  ].filter(Boolean).join('\n');
}

type TeamChatInviteProps = {
  name: string;
  courseName: string;
  inviteLink: string;
  supportEmail?: string;
  supportPhone?: string;
  helpCenterUrl?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  companyAddress?: string;
};

export function buildTeamChatInviteEmail({
  name,
  courseName,
  inviteLink,
  supportEmail,
  supportPhone,
  helpCenterUrl,
  logoUrl,
  heroImageUrl,
  companyAddress,
}: TeamChatInviteProps): string {
  const safeName = escapeHtml(name);
  const safeCourseName = escapeHtml(courseName);
  const safeInviteLink = escapeHtml(inviteLink);

  const content = `
    <h1 style="margin:0 0 18px 0; font-size:24px; line-height:32px; font-weight:700; color:#ffffff;">
      Welcome to Skarion!
    </h1>

    <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      Dear ${safeName},
    </p>

    <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      Thank you for enrolling in our <strong style="color:#ffffff;">${safeCourseName}</strong> course. We're excited to welcome you to Skarion and are truly glad to have you join our learning world.
    </p>

    <p style="margin:0 0 22px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      To support you throughout the program, we've created a dedicated Microsoft Teams group chat where you'll receive guidance, updates, and direct support from our instructors and team.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px 0;">
      <tr>
        <td align="center" bgcolor="#ff686b" style="border-radius:8px;">        
          <a href="${safeInviteLink}" target="_blank" class="button" style="display:inline-block; padding:14px 24px; font-size:14px; line-height:18px; font-weight:700; color:#1e293b; text-decoration:none; background-color:#ffffff; border-radius:8px;">
            Join the Chat
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px 0; font-size:14px; line-height:22px; color:#cbd5e1;">
      Or use this link:
    </p>

    <p style="margin:0; font-size:14px; line-height:22px; word-break:break-all;">
      <a href="${safeInviteLink}" target="_blank" style="color:#ff686b; text-decoration:underline;">${safeInviteLink}</a>
    </p>
  `;

  return buildBaseEmail({
    title: `Welcome to the ${courseName} Program at Skarion`,
    preheader: `Welcome to Skarion! Join the ${courseName} group chat here`,    
    content,
    supportEmail,
    supportPhone,
    helpCenterUrl,
    logoUrl,
    heroImageUrl,
    companyAddress,
  });
}

export function buildTeamChatInviteText({
  name,
  courseName,
  inviteLink,
}: Pick<TeamChatInviteProps, 'name' | 'courseName' | 'inviteLink'>): string {   
  return [
    `Dear ${name},`,
    '',
    `Thank you for enrolling in our ${courseName} course. We're excited to welcome you to Skarion and are truly glad to have you join our learning world.`,   
    '',
    "To support you throughout the program, we've created a dedicated Microsoft Teams group chat where you'll receive guidance, updates, and direct support from our instructors and team.",
    '',
    `Please join the group using the link below:`,
    `Join the chat here: ${inviteLink}`,
    '',
    "If you have any questions or need assistance at any point, feel free to reach out. we're here to help you succeed.",
    '',
    "Once again, welcome aboard. We look forward to supporting you on your journey into Skarion.",
    '',
    'Warm regards,',
    'Skarion',
  ].join('\n');
}

type BookingReminderProps = {
  fullName: string;
  formattedStart: string;
  joinLink?: string;
  supportEmail?: string;
  supportPhone?: string;
  helpCenterUrl?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  companyAddress?: string;
};

export function buildBookingReminderEmail({
  fullName,
  formattedStart,
  joinLink,
  supportEmail,
  supportPhone,
  helpCenterUrl,
  logoUrl,
  heroImageUrl,
  companyAddress,
}: BookingReminderProps): string {
  const safeName = escapeHtml(fullName);
  const safeFormattedStart = escapeHtml(formattedStart);
  const safeJoinLink = escapeHtml(joinLink ?? '#');

  const content = `
    <h1 style="margin:0 0 18px 0; font-size:24px; line-height:32px; font-weight:700; color:#ffffff;">
      Reminder: Your Skarion Call Starts Soon!
    </h1>

    <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      Hi ${safeName},
    </p>

    <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      Just a reminder that your Skarion call starts in 1 hour!
    </p>

    <p style="margin:0 0 22px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      <strong style="color:#ffffff;">${safeFormattedStart}</strong>
    </p>

    ${safeJoinLink ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px 0;">
      <tr>
        <td align="center" bgcolor="#ff686b" style="border-radius:8px;">        
          <a href="${safeJoinLink}" target="_blank" class="button" style="display:inline-block; padding:14px 24px; font-size:14px; line-height:18px; font-weight:700; color:#1e293b; text-decoration:none; background-color:#ffffff; border-radius:8px;">
            Join Meeting
          </a>
        </td>
      </tr>
    </table>
    ` : ''}
  `;

  return buildBaseEmail({
    title: 'Reminder: your Skarion call starts in 1 hour',
    preheader: `Reminder: your Skarion call with ${fullName} starts in 1 hour!`,
    content,
    supportEmail,
    supportPhone,
    helpCenterUrl,
    logoUrl,
    heroImageUrl,
    companyAddress,
  });
}

export function buildBookingReminderText({
  fullName,
  formattedStart,
  joinLink,
}: Pick<BookingReminderProps, 'fullName' | 'formattedStart' | 'joinLink'>): string {
  return [
    `Hi ${fullName},`,
    '',
    'This is a reminder that the Skarion booking call starts in 1 hour.',       
    '',
    formattedStart,
    '',
    joinLink ? `Join the meeting: ${joinLink}` : '',
    '',
    'Regards,',
    'Skarion',
  ].filter(Boolean).join('\n');
}

type InternalBookingNotificationProps = {
  fullName: string;
  email: string;
  phone: string;
  formattedStart: string;
  address?: string;
  note?: string;
  joinLink?: string;
  supportEmail?: string;
  supportPhone?: string;
  helpCenterUrl?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  companyAddress?: string;
};

export function buildInternalBookingNotificationEmail({
  fullName,
  email,
  phone,
  formattedStart,
  address,
  note,
  joinLink,
  supportEmail,
  supportPhone,
  helpCenterUrl,
  logoUrl,
  heroImageUrl,
  companyAddress,
}: InternalBookingNotificationProps): string {
  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeFormattedStart = escapeHtml(formattedStart);
  const safeAddress = address ? escapeHtml(address) : undefined;
  const safeNote = note ? escapeHtml(note) : undefined;
  const safeJoinLink = joinLink ? escapeHtml(joinLink) : undefined;

  const content = `
    <h1 style="margin:0 0 18px 0; font-size:24px; line-height:32px; font-weight:700; color:#ffffff;">
      New Skarion Booking!
    </h1>

    <p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#dbeafe;">
      A new booking has been created:
    </p>

    <table style="width:100%; border:none; border-spacing:0 8px;">
      <tr><td style="width:120px;"><strong style="color:#ffffff;">Name:</strong></td><td style="color:#dbeafe;">${safeFullName}</td></tr>
      <tr><td><strong style="color:#ffffff;">Email:</strong></td><td style="color:#dbeafe;">${safeEmail}</td></tr>
      <tr><td><strong style="color:#ffffff;">Phone:</strong></td><td style="color:#dbeafe;">${safePhone}</td></tr>
      <tr><td><strong style="color:#ffffff;">Meeting time:</strong></td><td style="color:#dbeafe;">${safeFormattedStart}</td></tr>
      ${safeAddress ? `<tr><td><strong style="color:#ffffff;">Address:</strong></td><td style="color:#dbeafe;">${safeAddress}</td></tr>` : ''}
      ${safeNote ? `<tr><td><strong style="color:#ffffff;">Note:</strong></td><td style="color:#dbeafe;">${safeNote}</td></tr>` : ''}
    </table>

    ${safeJoinLink ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 0 0;">
      <tr>
        <td align="center" bgcolor="#ff686b" style="border-radius:8px;">        
          <a href="${safeJoinLink}" target="_blank" class="button" style="display:inline-block; padding:14px 24px; font-size:14px; line-height:18px; font-weight:700; color:#1e293b; text-decoration:none; background-color:#ffffff; border-radius:8px;">
            Join Meeting
          </a>
        </td>
      </tr>
    </table>
    ` : ''}
  `;

  return buildBaseEmail({
    title: `New booking: ${fullName} on ${formattedStart}`,
    preheader: `New Skarion booking from ${fullName}`,
    content,
    supportEmail,
    supportPhone,
    helpCenterUrl,
    logoUrl,
    heroImageUrl,
    companyAddress,
  });
}

export function buildInternalBookingNotificationText({
  fullName,
  email,
  phone,
  formattedStart,
  address,
  note,
  joinLink,
}: Pick<InternalBookingNotificationProps, 'fullName' | 'email' | 'phone' | 'formattedStart' | 'address' | 'note' | 'joinLink'>): string {
  const lines = [
    'A new Skarion booking has been created.',
    '',
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Meeting time: ${formattedStart}`,
  ];

  if (address) lines.push(`Address: ${address}`);
  if (note) lines.push(`Note: ${note}`);
  if (joinLink) lines.push(`Join the meeting: ${joinLink}`);

  return lines.join('\n');
}
