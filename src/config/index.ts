export interface SmtpConfig {
  host?: string;
  port: number;
  username?: string;
  password?: string;
  from?: string;
}

export interface EmailProviderConfig {
  gmail?: {
    from?: string;
    appPassword?: string;
  };
  sendgrid?: {
    apiKey?: string;
    from?: string;
  };
  mailgun?: {
    apiKey?: string;
    domain?: string;
    from?: string;
  };
  ses?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    from?: string;
  };
  postmark?: {
    serverToken?: string;
    from?: string;
  };
}

export interface EmailConfig extends EmailProviderConfig {
  provider?: string;
  fallbackProviders?: string[];
}

export interface SmsProviderConfig {
  twilio?: {
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
  };
  sns?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
  };
  nexmo?: {
    apiKey?: string;
    apiSecret?: string;
    from?: string;
  };
  africastalking?: {
    apiKey?: string;
    username?: string;
    url?: string;
  };
  clickatell?: {
    apiKey?: string;
  };
}

export interface SmsConfig extends SmsProviderConfig {
  provider?: string;
  fallbackProviders?: string[];
  url?: string;
  apiKey?: string;
  partnerId?: string;
  shortcode?: string;
  passType?: string;
}

export interface Config {
  smtp: SmtpConfig;
  email: EmailConfig;
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
  email: {
    provider: process.env.EMAIL_PROVIDER,
    fallbackProviders: process.env.EMAIL_FALLBACK_PROVIDERS?.split(','),
    gmail: {
      from: process.env.GMAIL_FROM,
      appPassword: process.env.GMAIL_APP_PASSWORD,
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      from: process.env.SENDGRID_FROM,
    },
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
      from: process.env.MAILGUN_FROM,
    },
    ses: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      from: process.env.SES_FROM,
    },
    postmark: {
      serverToken: process.env.POSTMARK_SERVER_TOKEN,
      from: process.env.POSTMARK_FROM,
    },
  },
  sms: {
    provider: process.env.SMS_PROVIDER || 'http',
    fallbackProviders: process.env.SMS_FALLBACK_PROVIDERS?.split(','),
    url: process.env.SMS_URL,
    apiKey: process.env.SMS_API_KEY,
    partnerId: process.env.SMS_PARTNER_ID,
    shortcode: process.env.SMS_SHORTCODE,
    passType: process.env.SMS_PASS_TYPE || 'plain',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    },
    sns: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    },
    nexmo: {
      apiKey: process.env.NEXMO_API_KEY,
      apiSecret: process.env.NEXMO_API_SECRET,
      from: process.env.NEXMO_FROM,
    },
    africastalking: {
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
      url: process.env.AFRICASTALKING_URL || 'https://api.africastalking.com/version1/messaging/bulk',
    },
    clickatell: {
      apiKey: process.env.CLICKATELL_API_KEY,
    },
  },
};

export default config;
