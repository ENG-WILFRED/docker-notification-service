export interface SmtpConfig {
  host?: string;
  port: number;
  username?: string;
  password?: string;
  from?: string;
}

export interface SmsConfig {
  provider?: string;
  url?: string;
  apiKey?: string;
  partnerId?: string;
  shortcode?: string;
  passType?: string;
  africastalking?: {
    apiKey?: string;
    username?: string;
    url?: string;
    senderId?: string;
  };
}

export interface Config {
  smtp: SmtpConfig;
  sms: SmsConfig;
}

const config: Config = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'noreply@notification.service',
  },
  sms: {
    provider: process.env.SMS_PROVIDER || 'http',
    url: process.env.SMS_URL,
    apiKey: process.env.SMS_API_KEY,
    partnerId: process.env.SMS_PARTNER_ID,
    shortcode: process.env.SMS_SHORTCODE,
    passType: process.env.SMS_PASS_TYPE || 'plain',
    africastalking: {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
      url: process.env.AFRICASTALKING_URL || 'https://api.africastalking.com/version1/messaging/bulk',
      senderId: process.env.AFRICASTALKING_SENDER_ID,
    },
  },
};

export default config;
