import { SmsConfig } from '../../config';
import logger from '../../logger';

export async function sendViaAfricasTalkingProvider(
  to: string,
  templateName: string,
  content: string,
  smsCfg: SmsConfig
): Promise<void> {
  const at = smsCfg.africastalking || {};

  if (!at.apiKey) {
    logger.info(`[SMS] Mock → ${to} (${templateName})`, { source: 'SMS_AT' });
    logger.info(
      "[SMS] To enable Africa'sTalking SMS: set AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME",
      { source: 'SMS_AT' }
    );
    logger.info(`[SMS] Content: ${content}`, { source: 'SMS_AT' });
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

  // Normalize phone number with +
  const mobileAT = mobile.startsWith('+') ? mobile : '+' + mobile;

  const atUrl = at.url || 'https://api.africastalking.com/version1/messaging/bulk';

  const payload = {
    username: at.username,
    message: finalMessage,
    phoneNumbers: [mobileAT],
  };

  try {
    logger.info(`[SMS] Sending via Africa'sTalking to ${to} (normalized=${mobileAT})`, {
      source: 'SMS_AT',
    });
    logger.info('[SMS] Africa\'sTalking JSON payload:', {
      source: 'SMS_AT',
      payload: JSON.stringify(payload, null, 2),
    });
    logger.info('[SMS] Africa\'sTalking config:', {
      source: 'SMS_AT',
      username: at.username,
      apiKey: at.apiKey,
      url: atUrl,
    });

    const res = await fetch(atUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apiKey: at.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch (_) {}

    if (!res.ok) {
      logger.error("[SMS] ✗ Africa'sTalking error", {
        source: 'SMS_AT',
        status: res.status,
        response: text,
      });
      throw new Error(`Africa'sTalking error: ${res.status}`);
    }

    logger.info(`[SMS] ✓ Sent to ${to} via Africa'sTalking`, {
      source: 'SMS_AT',
      response: json ?? text,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[SMS] ✗ Send failed: ${errMsg}`, {
      source: 'SMS_AT',
      error: errMsg,
    });

    logger.error('[SMS] Africa\'sTalking Config:', {
      source: 'SMS_AT',
      url: at.url,
      username: at.username,
      senderId: at.senderId,
    });

    throw err;
  }
}

export default { sendViaAfricasTalkingProvider };
