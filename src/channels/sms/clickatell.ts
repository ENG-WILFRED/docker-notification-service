import logger from '../../logger';
import { SmsProvider } from './base';

/**
 * Clickatell Provider
 */
export class ClickatellProvider implements SmsProvider {
  name = 'Clickatell';

  constructor(private apiKey: string) {}

  async send(to: string, message: string): Promise<void> {
    const res = await fetch('https://platform.clickatell.com/messages/http/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.apiKey,
      },
      body: JSON.stringify({
        content: message,
        to: [to.replace(/^\+/, '')],
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Clickatell error: ${res.status} - ${error}`);
    }

    await res.json();
    logger.info(`[SMS] ✓ Clickatell sent to ${to}`, { source: 'SMS_CLICKATELL' });
  }
}
