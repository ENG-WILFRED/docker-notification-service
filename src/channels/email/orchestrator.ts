import config from '../../config';
import logger from '../../logger';
import {
  EmailProvider,
  GmailProvider,
  SendGridProvider,
  MailgunProvider,
  AWSSESProvider,
  PostmarkProvider,
} from './providers';

class EmailOrchestrator {
  private providers: EmailProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const emailCfg = config.email || {};

    // Primary provider based on config
    if (emailCfg.provider === 'gmail' && emailCfg.gmail?.appPassword && emailCfg.gmail?.from) {
      this.providers.push(
        new GmailProvider(emailCfg.gmail.from, emailCfg.gmail.appPassword)
      );
    }

    if (emailCfg.provider === 'sendgrid' && emailCfg.sendgrid?.apiKey && emailCfg.sendgrid?.from) {
      this.providers.push(
        new SendGridProvider(emailCfg.sendgrid.apiKey, emailCfg.sendgrid.from)
      );
    }

    if (emailCfg.provider === 'mailgun' && emailCfg.mailgun?.apiKey && emailCfg.mailgun?.domain && emailCfg.mailgun?.from) {
      this.providers.push(
        new MailgunProvider(emailCfg.mailgun.apiKey, emailCfg.mailgun.domain, emailCfg.mailgun.from)
      );
    }

    if (emailCfg.provider === 'ses' && emailCfg.ses?.accessKeyId && emailCfg.ses?.secretAccessKey && emailCfg.ses?.from) {
      this.providers.push(
        new AWSSESProvider(
          emailCfg.ses.accessKeyId,
          emailCfg.ses.secretAccessKey,
          emailCfg.ses.region || 'us-east-1',
          emailCfg.ses.from
        )
      );
    }

    if (emailCfg.provider === 'postmark' && emailCfg.postmark?.serverToken && emailCfg.postmark?.from) {
      this.providers.push(
        new PostmarkProvider(emailCfg.postmark.serverToken, emailCfg.postmark.from)
      );
    }

    // Add fallback providers in order of priority
    if (!this.providers.length || emailCfg.fallbackProviders?.includes('gmail')) {
      if (emailCfg.gmail?.appPassword && emailCfg.gmail?.from) {
        this.providers.push(
          new GmailProvider(emailCfg.gmail.from, emailCfg.gmail.appPassword)
        );
      }
    }

    if (!this.providers.length || emailCfg.fallbackProviders?.includes('sendgrid')) {
      if (emailCfg.sendgrid?.apiKey && emailCfg.sendgrid?.from) {
        this.providers.push(
          new SendGridProvider(emailCfg.sendgrid.apiKey, emailCfg.sendgrid.from)
        );
      }
    }

    if (!this.providers.length || emailCfg.fallbackProviders?.includes('mailgun')) {
      if (emailCfg.mailgun?.apiKey && emailCfg.mailgun?.domain && emailCfg.mailgun?.from) {
        this.providers.push(
          new MailgunProvider(emailCfg.mailgun.apiKey, emailCfg.mailgun.domain, emailCfg.mailgun.from)
        );
      }
    }

    if (!this.providers.length || emailCfg.fallbackProviders?.includes('ses')) {
      if (emailCfg.ses?.accessKeyId && emailCfg.ses?.secretAccessKey && emailCfg.ses?.from) {
        this.providers.push(
          new AWSSESProvider(
            emailCfg.ses.accessKeyId,
            emailCfg.ses.secretAccessKey,
            emailCfg.ses.region || 'us-east-1',
            emailCfg.ses.from
          )
        );
      }
    }

    if (!this.providers.length || emailCfg.fallbackProviders?.includes('postmark')) {
      if (emailCfg.postmark?.serverToken && emailCfg.postmark?.from) {
        this.providers.push(
          new PostmarkProvider(emailCfg.postmark.serverToken, emailCfg.postmark.from)
        );
      }
    }

    if (this.providers.length > 0) {
      logger.info(`[EMAIL] Initialized with ${this.providers.length} provider(s)`, {
        source: 'EMAIL_ORCHESTRATOR',
        providers: this.providers.map(p => p.name),
      });
    }
  }

  async send(
    to: string,
    subject: string,
    text: string,
    html: string
  ): Promise<void> {
    if (this.providers.length === 0) {
      logger.info(`[EMAIL] Mock → ${to}`, { source: 'EMAIL_ORCHESTRATOR' });
      logger.info('[EMAIL] No email providers configured', { source: 'EMAIL_ORCHESTRATOR' });
      logger.info(`[EMAIL] Subject: ${subject}`, { source: 'EMAIL_ORCHESTRATOR' });
      return;
    }

    let lastError: Error | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];

      try {
        logger.info(`[EMAIL] Attempting send via ${provider.name} (${i + 1}/${this.providers.length})`, {
          source: 'EMAIL_ORCHESTRATOR',
          to,
          subject,
        });

        await provider.send(to, subject, text, html);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn(`[EMAIL] ${provider.name} failed: ${lastError.message}`, {
          source: 'EMAIL_ORCHESTRATOR',
          provider: provider.name,
          attempt: i + 1,
          totalAttempts: this.providers.length,
        });

        // Try next provider
        if (i < this.providers.length - 1) {
          continue;
        }
      }
    }

    // All providers failed
    logger.error(
      `[EMAIL] ✗ All ${this.providers.length} provider(s) failed for ${to}`,
      {
        source: 'EMAIL_ORCHESTRATOR',
        lastError: lastError?.message,
        providers: this.providers.map(p => p.name),
      }
    );

    throw lastError || new Error('All email providers failed');
  }

  getProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}

const emailOrchestrator = new EmailOrchestrator();

export async function sendEmail(
  to: string,
  templateName: string,
  content: string
): Promise<void> {
  const plaintext = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

  await emailOrchestrator.send(
    to,
    `Notification: ${templateName}`,
    plaintext,
    content
  );
}

export { EmailOrchestrator };
export default { sendEmail };
