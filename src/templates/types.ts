// Template data from request
export interface TemplateData {
  userId: string;
  type: 'email' | 'sms' | 'push';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// Template data from Prisma
export interface PrismaTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  body: string;
  keys?: string; // JSON string array of template variables
  isDefault: boolean;
}

// Template variables for interpolation
export interface TemplateVariables {
  routineName?: string;
  minutesBefore?: string | number;
  startTime?: string;
  endTime?: string;
  [key: string]: any;
}

export interface RenderedTemplate {
  subject?: string;
  html?: string;
  text?: string;
  plainText?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SMSTemplate {
  text: string;
}

export interface PushTemplate {
  title: string;
  message: string;
  badge?: number;
}
