import logger from '../../logger';
import { EmailProvider } from './base';

/**
 * AWS SES Provider
 */
export class AWSSESProvider implements EmailProvider {
  name = 'AWS SES';

  constructor(
    private accessKeyId: string,
    private secretAccessKey: string,
    private region: string,
    private from: string
  ) {}

  async send(to: string, subject: string, text: string, html: string): Promise<void> {
    const endpoint = `https://email.${this.region}.amazonaws.com/`;

    const payload = {
      Source: this.from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: text },
          Html: { Data: html },
        },
      },
    };

    const auth = Buffer.from(`${this.accessKeyId}:${this.secretAccessKey}`).toString('base64');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        Authorization: `Basic ${auth}`,
        'X-Amz-Target': 'AmazonSimpleEmailService.SendEmail',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`AWS SES error: ${res.status} - ${error}`);
    }

    const data = await res.json() as { MessageId?: string };
    logger.info(`[EMAIL] ✓ AWS SES sent to ${to}, MessageId: ${data.MessageId}`, {
      source: 'EMAIL_SES',
    });
  }
}
