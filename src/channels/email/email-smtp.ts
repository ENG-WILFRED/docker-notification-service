import nodemailer from 'nodemailer';
import config from '../../config';
import logger from '../../logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!config.smtp.host || !config.smtp.username || !config.smtp.password) {
      throw new Error(
        '[EMAIL] SMTP configuration incomplete. Set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD.'
      );
    }
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465, // true for 465, false for other ports
      auth: {
        user: config.smtp.username,
        pass: config.smtp.password,
      },
    });
  }
  return transporter;
}

export async function sendEmail(
  to: string,
  templateName: string,
  content: string
): Promise<void> {
  // Provide plaintext fallback by stripping HTML tags
  const plaintext = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

  const emailTransporter = getTransporter();

  try {
    logger.info(`[EMAIL] Sending via SMTP to ${to}...`, { source: 'EMAIL' });

    const info = await emailTransporter.sendMail({
      from: config.smtp.from,
      to: to,
      subject: `Notification: ${templateName}`,
      text: plaintext,
      html: content,
    });

    if (info.messageId) {
      logger.info(`[EMAIL] ✓ Sent to ${to}, MessageID: ${info.messageId}`, {
        source: 'EMAIL',
        messageId: info.messageId,
      });
    } else {
      throw new Error(`SMTP send failed: no messageId in response`);
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[EMAIL] ✗ Send failed: ${errMsg}`, {
      source: 'EMAIL',
      error: errMsg,
    });
    logger.error('[EMAIL] SMTP Config:', {
      source: 'EMAIL',
      host: config.smtp.host,
      port: config.smtp.port,
      from: config.smtp.from,
    });

    throw err;
  }
}

export default { sendEmail };
