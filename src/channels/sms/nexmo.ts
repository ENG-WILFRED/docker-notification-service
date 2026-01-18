import logger from '../../logger';
import { SmsProvider } from './base';

/**
 * Nexmo/Vonage Provider
 */
export class NexmoProvider implements SmsProvider {
  name = 'Nexmo/Vonage';

  constructor(private apiKey: string, private apiSecret: string, private from: string) {}

  async send(to: string, message: string): Promise<void> {
    const res = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        to,
        from: this.from,
        text: message,
      }).toString(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Nexmo error: ${res.status} - ${error}`);
    }

    const data = await res.json() as { messages?: Array<{ status?: string; 'error-text'?: string; 'message-id'?: string }> };
    if (data.messages?.[0]?.status !== '0') {
      throw new Error(`Nexmo error: ${data.messages?.[0]?.['error-text']}`);
    }

    logger.info(`[SMS] ✓ Nexmo sent to ${to}, MessageId: ${data.messages?.[0]?.['message-id']}`, {
      source: 'SMS_NEXMO',
    });
  }
}
