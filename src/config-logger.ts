import fs from 'fs';
import path from 'path';
import logger from './logger';

interface ServiceConfig {
  timestamp: string;
  kafka: {
    broker: string;
    brokers: string[];
    topic: string;
    clientId: string;
  };
  database: {
    url: string;
    type: string;
  };
  redis: {
    url: string;
  };
  email: {
    provider: string;
    fallbackProviders: string[];
    credentials: Record<string, boolean>;
  };
  sms: {
    providers: string[];
    credentials: Record<string, boolean>;
  };
  server: {
    port: number;
    logLevel: string;
  };
}

/**
 * Capture and log all service configuration
 */
export function captureServiceConfig(): ServiceConfig {
  const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:29092';
  const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',').map((b) => b.trim());

  const config: ServiceConfig = {
    timestamp: new Date().toISOString(),
    kafka: {
      broker: kafkaBroker,
      brokers: kafkaBrokers,
      topic: process.env.NOTIFICATION_TOPIC || 'notifications',
      clientId: 'notification-service',
    },
    database: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/notification_db',
      type: 'PostgreSQL',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    },
    email: {
      provider: process.env.EMAIL_PROVIDER || 'gmail',
      fallbackProviders: (process.env.EMAIL_FALLBACK_PROVIDERS || 'sendgrid,mailgun,ses,postmark').split(','),
      credentials: {
        GMAIL: !!process.env.GMAIL_FROM,
        SENDGRID: !!process.env.SENDGRID_API_KEY,
        MAILGUN: !!process.env.MAILGUN_API_KEY,
        AWS_SES: !!process.env.AWS_SES_FROM_EMAIL,
        POSTMARK: !!process.env.POSTMARK_API_KEY,
      },
    },
    sms: {
      providers: (process.env.SMS_FALLBACK_PROVIDERS || 'twilio,aws-sns,nexmo,africas-talking,clickatell').split(','),
      credentials: {
        TWILIO: !!process.env.TWILIO_ACCOUNT_SID,
        AWS_SNS: !!process.env.AWS_ACCESS_KEY_ID,
        NEXMO: !!process.env.NEXMO_API_KEY,
        AFRICAS_TALKING: !!process.env.AFRICAS_TALKING_API_KEY,
        CLICKATELL: !!process.env.CLICKATELL_API_KEY,
      },
    },
    server: {
      port: parseInt(process.env.SERVICE_PORT || '47829', 10),
      logLevel: process.env.LOG_LEVEL || 'info',
    },
  };

  return config;
}

/**
 * Write configuration to integration.md file
 */
export function writeConfigToIntegration(config: ServiceConfig): void {
  const mdContent = `# Notification Service Integration Config

**Generated:** ${config.timestamp}

## Kafka Configuration
- **Broker(s):** ${config.kafka.brokers.join(', ')}
- **Primary Broker:** ${config.kafka.broker}
- **Topic:** \`${config.kafka.topic}\`
- **Client ID:** \`${config.kafka.clientId}\`

## Database Configuration
- **Type:** ${config.database.type}
- **Connection:** \`${config.database.url.replace(/:[^:@]+@/, ':****@')}\`

## Redis Configuration
- **Connection:** \`${config.redis.url}\`

## Email Providers
- **Primary Provider:** \`${config.email.provider}\`
- **Fallback Providers:** ${config.email.fallbackProviders.map((p) => `\`${p}\``).join(', ')}

### Available Email Credentials
\`\`\`
${Object.entries(config.email.credentials)
  .map(([provider, available]) => `${provider}: ${available ? '✓ Configured' : '✗ Not configured'}`)
  .join('\n')}
\`\`\`

## SMS Providers
- **Available Providers:** ${config.sms.providers.map((p) => `\`${p}\``).join(', ')}

### Available SMS Credentials
\`\`\`
${Object.entries(config.sms.credentials)
  .map(([provider, available]) => `${provider}: ${available ? '✓ Configured' : '✗ Not configured'}`)
  .join('\n')}
\`\`\`

## Server Configuration
- **Port:** ${config.server.port}
- **Log Level:** \`${config.server.logLevel}\`

---

## How to Send Notifications

### Via Direct Kafka Message
\`\`\`javascript
// Publish to: ${config.kafka.topic}
{
  "userId": "user@example.com",
  "type": "email",
  "title": "Welcome",
  "message": "Hello user",
  "templateId": 1,
  "metadata": {
    "routineId": 123,
    "routineName": "Morning Routine"
  }
}
\`\`\`

### Using NotificationProducer Class
\`\`\`typescript
import NotificationProducer from './producer';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: '${config.kafka.clientId}',
  brokers: [${config.kafka.brokers.map((b) => `'${b}'`).join(', ')}],
});

const producer = new NotificationProducer(kafka, '${config.kafka.topic}');
await producer.connect();

await producer.sendNotification({
  userId: 'user@example.com',
  type: 'email',
  title: 'Notification',
  message: 'Your notification body',
  templateId: 1,
  metadata: { routineId: 123 },
});
\`\`\`

### Using sendNotificationToKafka
\`\`\`typescript
import { sendNotificationToKafka } from './integration';

await sendNotificationToKafka({
  type: 'email',
  title: 'Welcome',
  message: 'Hello user',
  templateId: 1,
  recipient: 'user@example.com',
  metadata: { routineId: 123 },
});
\`\`\`

### Using sendNotificationWithTemplate
\`\`\`typescript
import { sendNotificationWithTemplate } from './integration';

// Fetches template from DB and sends
await sendNotificationWithTemplate(
  123, // routineId
  'email', // type
  'user@example.com', // recipient
  { minutesBefore: 15, startTime: '09:00' }
);
\`\`\`

## Consumer Configuration

The notification consumer will:
1. Listen on topic: \`${config.kafka.topic}\`
2. Retrieve template from database
3. Render template with provided variables
4. Route to appropriate provider (${config.email.provider} for email, Twilio for SMS)
5. Store retry attempts in Redis with automatic fallback

## Testing

\`\`\`bash
# Build the service
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f notification-service

# Stop services
docker-compose down
\`\`\`

---
*Last Updated: ${config.timestamp}*
`;

  const integrationPath = path.join(process.cwd(), 'integration.md');

  try {
    fs.writeFileSync(integrationPath, mdContent, 'utf-8');
    logger.info(`✓ Configuration written to integration.md at ${integrationPath}`);
  } catch (error) {
    logger.error('Failed to write configuration to integration.md', error);
  }
}

/**
 * Log configuration to console (only important info)
 */
export function logConfigToConsole(config: ServiceConfig): void {
  console.log('\n🚀 NOTIFICATION SERVICE STARTED\n');
  console.log(`✓ Kafka Broker:     ${config.kafka.brokers.join(', ')}`);
  console.log(`✓ Topic:            ${config.kafka.topic}`);
  console.log(`✓ Database:         PostgreSQL (postgres:5432)`);
  console.log(`✓ Redis:            redis:6379`);
  console.log(`✓ Server Port:      ${config.server.port}`);
  console.log(`✓ Email Provider:   ${config.email.provider} → [${config.email.fallbackProviders.join(', ')}]`);
  console.log(`✓ SMS Provider:     ${config.sms.providers[0]} → [${config.sms.providers.slice(1).join(', ')}]`);
  console.log('\n');
}
