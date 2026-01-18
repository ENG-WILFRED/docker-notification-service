import config from '../../config';
import logger from '../../logger';
import {
  SmsProvider,
  TwilioProvider,
  AWSSNSProvider,
  NexmoProvider,
  AfricasTalkingProvider,
  ClickatellProvider,
} from './providers';

class SmsOrchestrator {
  private providers: SmsProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const smsCfg = config.sms || {};

    // Primary provider based on config
    if (smsCfg.provider === 'twilio' && smsCfg.twilio?.accountSid && smsCfg.twilio?.authToken && smsCfg.twilio?.fromNumber) {
      this.providers.push(
        new TwilioProvider(smsCfg.twilio.accountSid, smsCfg.twilio.authToken, smsCfg.twilio.fromNumber)
      );
    }

    if (smsCfg.provider === 'sns' && smsCfg.sns?.accessKeyId && smsCfg.sns?.secretAccessKey) {
      this.providers.push(
        new AWSSNSProvider(smsCfg.sns.accessKeyId, smsCfg.sns.secretAccessKey, smsCfg.sns.region || 'us-east-1')
      );
    }

    if (smsCfg.provider === 'nexmo' && smsCfg.nexmo?.apiKey && smsCfg.nexmo?.apiSecret && smsCfg.nexmo?.from) {
      this.providers.push(
        new NexmoProvider(smsCfg.nexmo.apiKey, smsCfg.nexmo.apiSecret, smsCfg.nexmo.from)
      );
    }

    if (smsCfg.provider === 'africastalking' && smsCfg.africastalking?.apiKey && smsCfg.africastalking?.username) {
      this.providers.push(
        new AfricasTalkingProvider(smsCfg.africastalking.apiKey, smsCfg.africastalking.username)
      );
    }

    if (smsCfg.provider === 'clickatell' && smsCfg.clickatell?.apiKey) {
      this.providers.push(
        new ClickatellProvider(smsCfg.clickatell.apiKey)
      );
    }

    // Add fallback providers in order of priority
    if (!this.providers.length || smsCfg.fallbackProviders?.includes('twilio')) {
      if (smsCfg.twilio?.accountSid && smsCfg.twilio?.authToken && smsCfg.twilio?.fromNumber) {
        this.providers.push(
          new TwilioProvider(smsCfg.twilio.accountSid, smsCfg.twilio.authToken, smsCfg.twilio.fromNumber)
        );
      }
    }

    if (!this.providers.length || smsCfg.fallbackProviders?.includes('sns')) {
      if (smsCfg.sns?.accessKeyId && smsCfg.sns?.secretAccessKey) {
        this.providers.push(
          new AWSSNSProvider(smsCfg.sns.accessKeyId, smsCfg.sns.secretAccessKey, smsCfg.sns.region || 'us-east-1')
        );
      }
    }

    if (!this.providers.length || smsCfg.fallbackProviders?.includes('nexmo')) {
      if (smsCfg.nexmo?.apiKey && smsCfg.nexmo?.apiSecret && smsCfg.nexmo?.from) {
        this.providers.push(
          new NexmoProvider(smsCfg.nexmo.apiKey, smsCfg.nexmo.apiSecret, smsCfg.nexmo.from)
        );
      }
    }

    if (!this.providers.length || smsCfg.fallbackProviders?.includes('africastalking')) {
      if (smsCfg.africastalking?.apiKey && smsCfg.africastalking?.username) {
        this.providers.push(
          new AfricasTalkingProvider(smsCfg.africastalking.apiKey, smsCfg.africastalking.username)
        );
      }
    }

    if (!this.providers.length || smsCfg.fallbackProviders?.includes('clickatell')) {
      if (smsCfg.clickatell?.apiKey) {
        this.providers.push(
          new ClickatellProvider(smsCfg.clickatell.apiKey)
        );
      }
    }

    if (this.providers.length > 0) {
      logger.info(`[SMS] Initialized with ${this.providers.length} provider(s)`, {
        source: 'SMS_ORCHESTRATOR',
        providers: this.providers.map(p => p.name),
      });
    }
  }

  async send(to: string, message: string): Promise<void> {
    if (this.providers.length === 0) {
      logger.info(`[SMS] Mock → ${to}`, { source: 'SMS_ORCHESTRATOR' });
      logger.info('[SMS] No SMS providers configured', { source: 'SMS_ORCHESTRATOR' });
      logger.info(`[SMS] Message: ${message}`, { source: 'SMS_ORCHESTRATOR' });
      return;
    }

    let lastError: Error | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];

      try {
        logger.info(`[SMS] Attempting send via ${provider.name} (${i + 1}/${this.providers.length})`, {
          source: 'SMS_ORCHESTRATOR',
          to,
        });

        await provider.send(to, message);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn(`[SMS] ${provider.name} failed: ${lastError.message}`, {
          source: 'SMS_ORCHESTRATOR',
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
      `[SMS] ✗ All ${this.providers.length} provider(s) failed for ${to}`,
      {
        source: 'SMS_ORCHESTRATOR',
        lastError: lastError?.message,
        providers: this.providers.map(p => p.name),
      }
    );

    throw lastError || new Error('All SMS providers failed');
  }

  getProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}

const smsOrchestrator = new SmsOrchestrator();

export async function sendViaSms(
  to: string,
  templateName: string,
  content: string
): Promise<void> {
  // Remove HTML tags and normalize text
  const plaintext = content
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  await smsOrchestrator.send(to, plaintext);
}

export { SmsOrchestrator };
export default { sendViaSms };
