import config from '../../config';
import logger from '../../logger';
import { sendViaHttpProvider } from './http';
import { sendViaAfricasTalkingProvider } from './africastalking';

export async function sendViaSms(
  to: string,
  templateName: string,
  content: string
): Promise<void> {
  const smsCfg = config.sms;
  const provider = (smsCfg && smsCfg.provider) || 'http';

  if (!smsCfg) {
    logger.info(`[SMS] Mock → ${to} (${templateName})`, { source: 'SMS' });
    logger.info('[SMS] To enable real SMS: set SMS_PROVIDER and provider-specific environment variables', {
      source: 'SMS',
    });
    logger.info(`[SMS] Content: ${content}`, { source: 'SMS' });
    return;
  }

  try {
    if (provider === 'http') {
      await sendViaHttpProvider(to, templateName, content, smsCfg);
      return;
    }

    if (provider === 'africastalking') {
      await sendViaAfricasTalkingProvider(to, templateName, content, smsCfg);
      return;
    }

    logger.info(`[SMS] Unknown provider '${provider}', falling back to mock for ${to}`, {
      source: 'SMS',
    });
    logger.info(`[SMS] Content: ${content}`, { source: 'SMS' });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[SMS] ✗ Send failed: ${errMsg}`, {
      source: 'SMS',
      error: errMsg,
    });

    throw err;
  }
}

export { sendViaHttpProvider } from './http';
export { sendViaAfricasTalkingProvider } from './africastalking';

export default { sendViaSms };
