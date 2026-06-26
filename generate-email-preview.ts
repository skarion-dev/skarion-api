import { buildMeetingConfirmationEmail } from './src/modules/mailer/email-templates.service';
import * as fs from 'fs';
import * as path from 'path';

// Set environment variables for testing
process.env.ASSET_BASE_URL = '/public';
process.env.SKARION_SUPPORT_EMAIL = 'support@skarion.com';
process.env.SKARION_COMPANY_ADDRESS = '123 Skarion Street, New York, NY';

// Generate the email
const emailHtml = buildMeetingConfirmationEmail({
  fullName: 'John Doe',
  formattedStart: 'Friday, June 25, 2026 at 7:00 PM (Eastern Time)',
  joinLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NjI5ZmM2MGMtZThkZi00YjhkLTlkNzAtNjY4MjhkNjY5NjY5',
});

// Write to test file
const outputPath = path.join(__dirname, 'test-email-preview.html');
fs.writeFileSync(outputPath, emailHtml);

console.log('Test email preview generated at:', outputPath);
