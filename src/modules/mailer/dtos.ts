export interface SendMailOptions {
  recipients: string[];
  subject: string;
  text?: string;
  html?: string;
  placeholders?: Record<string, string>;
}
