import logger from '../../logger';
import { SmsProvider } from './base';

/**
 * AWS SNS Provider
 */
export class AWSSNSProvider implements SmsProvider {
  name = 'AWS SNS';

  constructor(private accessKeyId: string, private secretAccessKey: string, private region: string) {}

  async send(to: string, message: string): Promise<void> {
    const endpoint = `https://sns.${this.region}.amazonaws.com/`;

    const auth = Buffer.from(`${this.accessKeyId}:${this.secretAccessKey}`).toString('base64');

    const payload = {
      PhoneNumber: to,
      Message: message,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        Authorization: `Basic ${auth}`,
        'X-Amz-Target': 'AmazonSNS.Publish',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`AWS SNS error: ${res.status} - ${error}`);
    }

    const data = await res.json() as { MessageId?: string };
    logger.info(`[SMS] ✓ AWS SNS sent to ${to}, MessageId: ${data.MessageId}`, {
      source: 'SMS_SNS',
    });
  }
}
