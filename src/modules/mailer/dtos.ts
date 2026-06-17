export interface MailAttachment {
  filename: string;
  contentType: string;
  contentBase64: string;
}

export interface SendMailOptions {
  recipients: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
  placeholders?: Record<string, string>;
}
