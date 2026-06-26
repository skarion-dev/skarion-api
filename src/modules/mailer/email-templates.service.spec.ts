import { buildMeetingConfirmationEmail, buildMeetingConfirmationText } from './email-templates.service';

describe('Email Templates', () => {
  describe('buildMeetingConfirmationEmail', () => {
    it('should generate a valid HTML email', () => {
      const result = buildMeetingConfirmationEmail({
        fullName: 'Jane Smith',
        formattedStart: 'Monday, July 1, 2026 at 10:00 AM',
        joinLink: 'https://example.com/join',
        supportEmail: 'test@skarion.com',
        companyAddress: 'Test Address',
      });

      expect(result).toContain('Jane Smith');
      expect(result).toContain('Monday, July 1, 2026 at 10:00 AM');
      expect(result).toContain('https://example.com/join');
      expect(result).toContain('test@skarion.com');
      expect(result).toContain('Test Address');
    });

    it('should handle missing optional fields gracefully', () => {
      const result = buildMeetingConfirmationEmail({
        fullName: 'John Doe',
        formattedStart: 'Tuesday, July 2, 2026 at 2:00 PM',
      });

      expect(result).toContain('John Doe');
      expect(result).toContain('Tuesday, July 2, 2026 at 2:00 PM');
      expect(result).not.toContain('undefined');
    });
  });

  describe('buildMeetingConfirmationText', () => {
    it('should generate a valid plain text email', () => {
      const result = buildMeetingConfirmationText({
        fullName: 'Alice Johnson',
        formattedStart: 'Wednesday, July 3, 2026 at 4:00 PM',
        joinLink: 'https://example.com/join',
      });

      expect(result).toContain('Alice Johnson');
      expect(result).toContain('Wednesday, July 3, 2026 at 4:00 PM');
      expect(result).toContain('https://example.com/join');
    });
  });
});
