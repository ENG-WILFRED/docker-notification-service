# Notification Service Integration Config

**Generated:** 2026-01-16T21:16:05.873Z

## Kafka Configuration
- **Broker(s):** kafka:29092
- **Primary Broker:** localhost:9092
- **Topic:** `notifications`
- **Client ID:** `notification-service`

## Database Configuration
- **Type:** PostgreSQL
- **Connection:** `postgresql://postgres:****@localhost:5432/notification_db`

## Redis Configuration
- **Connection:** `redis://localhost:6379/0`

## Email Providers
- **Primary Provider:** `gmail`
- **Fallback Providers:** `sendgrid`, `mailgun`, `ses`, `postmark`

### Available Email Credentials
```
GMAIL: ✓ Configured
SENDGRID: ✓ Configured
MAILGUN: ✓ Configured
AWS_SES: ✗ Not configured
POSTMARK: ✗ Not configured
```

## SMS Providers
- **Available Providers:** `sns`, `nexmo`, `africastalking`, `clickatell`

### Available SMS Credentials
```
TWILIO: ✓ Configured
AWS_SNS: ✓ Configured
NEXMO: ✓ Configured
AFRICAS_TALKING: ✗ Not configured
CLICKATELL: ✓ Configured
```

## Server Configuration
- **Port:** 47829
- **Log Level:** `info`

---

## How to Send Notifications

### Via Direct Kafka Message
```javascript
// Publish to: notifications
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
```

### Using NotificationProducer Class
```typescript
import NotificationProducer from './producer';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: ['kafka:29092'],
});

const producer = new NotificationProducer(kafka, 'notifications');
await producer.connect();

await producer.sendNotification({
  userId: 'user@example.com',
  type: 'email',
  title: 'Notification',
  message: 'Your notification body',
  templateId: 1,
  metadata: { routineId: 123 },
});
```

### Using sendNotificationToKafka
```typescript
import { sendNotificationToKafka } from './integration';

await sendNotificationToKafka({
  type: 'email',
  title: 'Welcome',
  message: 'Hello user',
  templateId: 1,
  recipient: 'user@example.com',
  metadata: { routineId: 123 },
});
```

### Using sendNotificationWithTemplate
```typescript
import { sendNotificationWithTemplate } from './integration';

// Fetches template from DB and sends
await sendNotificationWithTemplate(
  123, // routineId
  'email', // type
  'user@example.com', // recipient
  { minutesBefore: 15, startTime: '09:00' }
);
```

## Consumer Configuration

The notification consumer will:
1. Listen on topic: `notifications`
2. Retrieve template from database
3. Render template with provided variables
4. Route to appropriate provider (gmail for email, Twilio for SMS)
5. Store retry attempts in Redis with automatic fallback

## Testing

```bash
# Build the service
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f notification-service

# Stop services
docker-compose down
```

---
*Last Updated: 2026-01-16T21:16:05.873Z*
