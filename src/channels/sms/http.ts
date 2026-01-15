import { SmsConfig } from '../../config';
import logger from '../../logger';

export async function sendViaHttpProvider(
  to: string,
  templateName: string,
  content: string,
  smsCfg: SmsConfig
): Promise<void> {
  if (!smsCfg.url || !smsCfg.apiKey) {
    logger.info(`[SMS] Mock → ${to} (${templateName})`, { source: 'SMS_HTTP' });
    logger.info('[SMS] To enable real HTTP SMS: set SMS_URL and SMS_API_KEY environment variables', {
      source: 'SMS_HTTP',
    });
    logger.info(`[SMS] Content: ${content}`, { source: 'SMS_HTTP' });
    return;
  }

  // Normalize mobile number (basic): convert leading 0 to country code 254 if Kenyan
  let mobile = String(to).trim();
  if (mobile.startsWith('+')) mobile = mobile.slice(1);
  if (/^0\d{9}$/.test(mobile)) {
    mobile = '254' + mobile.slice(1);
  }

  // SMS should be plain text and have reasonable length
  const textMessage = content
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  const finalMessage = textMessage.length >= 3 ? textMessage : textMessage + ' - message';

  // Provider expects form-encoded fields (apikey, partnerID, mobile, message, shortcode, pass_type)
  const form = new URLSearchParams();
  form.append('apikey', String(smsCfg.apiKey || ''));
  form.append('partnerID', String(smsCfg.partnerId || ''));
  form.append('shortcode', String(smsCfg.shortcode || ''));
  form.append('pass_type', String(smsCfg.passType || 'plain'));
  form.append('mobile', mobile);
  form.append('message', finalMessage);

  try {
    logger.info(
      `[SMS] Sending via HTTP SMS provider to ${to} (normalized=${mobile}) (url=${smsCfg.url})...`,
      { source: 'SMS_HTTP' }
    );

    const res = await fetch(smsCfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch (_) {
      // not JSON
    }

    if (!res.ok) {
      logger.error('[SMS] ✗ Provider responded with non-2xx status', {
        source: 'SMS_HTTP',
        status: res.status,
      });

      if (json) {
        logger.error('[SMS] Provider response:', {
          source: 'SMS_HTTP',
          response: JSON.stringify(json, null, 2),
        });
      } else {
        logger.error('[SMS] Provider response body:', {
          source: 'SMS_HTTP',
          body: text,
        });
      }

      if (json && json.errors) {
        logger.error('[SMS] Provider validation errors:', { source: 'SMS_HTTP' });
        for (const [k, v] of Object.entries(json.errors)) {
          logger.error(`  - ${k}: ${JSON.stringify(v)}`, { source: 'SMS_HTTP' });
        }
      }

      throw new Error(`SMS provider error: ${res.status}`);
    }

    logger.info(`[SMS] ✓ Sent to ${to}, provider response:`, {
      source: 'SMS_HTTP',
      response: json ? JSON.stringify(json) : text,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[SMS] ✗ Send failed: ${errMsg}`, {
      source: 'SMS_HTTP',
      error: errMsg,
    });
    logger.error('[SMS] HTTP Config:', {
      source: 'SMS_HTTP',
      url: smsCfg.url,
      partnerId: smsCfg.partnerId,
      shortcode: smsCfg.shortcode,
    });

    throw err;
  }
}

export default { sendViaHttpProvider };
