import logger from '../../logger';
import { SmsProvider } from './base';

/**
 * Twilio Provider
 */
export class TwilioProvider implements SmsProvider {
  name = 'Twilio';

  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string
  ) {}

  async send(to: string, message: string): Promise<void> {
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    const formData = new FormData();
    formData.append('To', to);
    formData.append('From', this.fromNumber);
    formData.append('Body', message);

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
        },
        body: formData as any,
      }
    );

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Twilio error: ${res.status} - ${error}`);
    }

    const data = await res.json() as { sid?: string };
    logger.info(`[SMS] ✓ Twilio sent to ${to}, SID: ${data.sid}`, { source: 'SMS_TWILIO' });
  }
}
