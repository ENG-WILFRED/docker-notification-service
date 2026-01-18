import logger from '../../logger';
import { EmailProvider } from './base';

/**
 * Mailgun Provider
 */
export class MailgunProvider implements EmailProvider {
  name = 'Mailgun';

  constructor(private apiKey: string, private domain: string, private from: string) {}

  async send(to: string, subject: string, text: string, html: string): Promise<void> {
    const formData = new FormData();
    formData.append('from', this.from);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', text);
    formData.append('html', html);

    const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');

    const res = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: formData as any,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Mailgun error: ${res.status} - ${error}`);
    }

    const data = await res.json() as { id?: string };
    logger.info(`[EMAIL] ✓ Mailgun sent to ${to}, ID: ${data.id}`, { source: 'EMAIL_MAILGUN' });
  }
}
