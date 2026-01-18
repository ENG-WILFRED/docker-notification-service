import nodemailer from 'nodemailer';
import logger from '../../logger';
import { EmailProvider } from './base';

/**
 * Gmail/Google Workspace Provider
 */
export class GmailProvider implements EmailProvider {
  name = 'Gmail';
  private transporter: nodemailer.Transporter | null = null;

  constructor(from: string, appPassword: string) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: from,
        pass: appPassword,
      },
    });
  }

  async send(to: string, subject: string, text: string, html: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('Gmail transporter not initialized');
    }

    const info = await this.transporter.sendMail({
      from: undefined,
      to,
      subject,
      text,
      html,
    });

    if (!info.messageId) {
      throw new Error('Gmail: no messageId in response');
    }

    logger.info(`[EMAIL] ✓ Gmail sent to ${to}, MessageID: ${info.messageId}`, {
      source: 'EMAIL_GMAIL',
    });
  }
}
