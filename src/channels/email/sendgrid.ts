import logger from '../../logger';
import { EmailProvider } from './base';

/**
 * SendGrid Provider
 */
export class SendGridProvider implements EmailProvider {
  name = 'SendGrid';

  constructor(private apiKey: string, private fromEmail: string) {}

  async send(to: string, subject: string, text: string, html: string): Promise<void> {
    const payload = {
      personalizations: [
        {
          to: [{ email: to }],
        },
      ],
      from: { email: this.fromEmail },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`SendGrid error: ${res.status} - ${error}`);
    }

    logger.info(`[EMAIL] ✓ SendGrid sent to ${to}`, { source: 'EMAIL_SENDGRID' });
  }
}
