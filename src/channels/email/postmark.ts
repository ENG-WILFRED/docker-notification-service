import logger from '../../logger';
import { EmailProvider } from './base';

/**
 * Postmark Provider
 */
export class PostmarkProvider implements EmailProvider {
  name = 'Postmark';

  constructor(private serverToken: string, private from: string) {}

  async send(to: string, subject: string, text: string, html: string): Promise<void> {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': this.serverToken,
      },
      body: JSON.stringify({
        From: this.from,
        To: to,
        Subject: subject,
        TextBody: text,
        HtmlBody: html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Postmark error: ${res.status} - ${error}`);
    }

    const data = await res.json() as { MessageID?: string };
    logger.info(`[EMAIL] ✓ Postmark sent to ${to}, MessageId: ${data.MessageID}`, {
      source: 'EMAIL_POSTMARK',
    });
  }
}
