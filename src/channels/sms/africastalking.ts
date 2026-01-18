import logger from '../../logger';
import { SmsProvider } from './base';

/**
 * Africa's Talking Provider
 */
export class AfricasTalkingProvider implements SmsProvider {
  name = "Africa's Talking";

  constructor(private apiKey: string, private username: string) {}

  async send(to: string, message: string): Promise<void> {
    // Normalize mobile number
    let mobile = String(to).trim();
    if (mobile.startsWith('+')) mobile = mobile.slice(1);
    if (/^0\d{9}$/.test(mobile)) {
      mobile = '254' + mobile.slice(1);
    }

    const mobileAT = mobile.startsWith('+') ? mobile : '+' + mobile;

    const payload = {
      username: this.username,
      message,
      phoneNumbers: [mobileAT],
    };

    const res = await fetch('https://api.africastalking.com/version1/messaging/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apiKey: this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Africa's Talking error: ${res.status} - ${error}`);
    }

    const data = await res.json() as { SMSMessageData?: { Recipients?: Array<any> } };
    logger.info(`[SMS] ✓ Africa's Talking sent to ${to}, Recipients: ${data.SMSMessageData?.Recipients?.length}`, {
      source: 'SMS_AT',
    });
  }
}
