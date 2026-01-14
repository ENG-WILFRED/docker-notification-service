# Kafka Notification Service

A Docker-based notification service built with Node.js and Kafka for handling real-time notifications.

## Features

- **Kafka Integration**: Publish and consume notifications from Kafka topics
- **REST API**: Simple HTTP API for sending notifications
- **Batch Operations**: Support for sending multiple notifications at once
- **Type-based Handlers**: Route notifications based on type (email, SMS, push, etc.)
- **Logging**: Comprehensive logging with Winston
- **Docker Support**: Full Docker Compose setup with Zookeeper and Kafka
- **TypeScript**: Type-safe implementation

## Project Structure

```
docker-notification-service/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── kafka.ts              # Kafka connection management
│   ├── producer.ts           # Notification producer
│   ├── consumer.ts           # Notification consumer
│   ├── api.ts                # REST API routes
│   └── logger.ts             # Logging configuration
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Docker image configuration
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment variables example
└── README.md                 # This file
```

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

## Quick Start

### Using Docker Compose

1. **Clone and navigate to the project:**
   ```bash
   cd docker-notification-service
   ```

2. **Build and start services:**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - Zookeeper (port 2181)
   - Kafka (port 9092)
   - Notification Service (port 3000)

3. **Check service health:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f notification-service
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Kafka only:**
   ```bash
   docker-compose up -d zookeeper kafka
   ```

3. **Run the service:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

### Send Single Notification
```bash
POST /api/notifications

Request Body:
{
  "userId": "user123",
  "type": "email",
  "title": "Welcome",
  "message": "Welcome to our service",
  "metadata": {
    "email": "user@example.com"
  }
}

Response (202 Accepted):
{
  "success": true,
  "message": "Notification queued for processing",
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

### Send Batch Notifications
```bash
POST /api/notifications/batch

Request Body:
{
  "notifications": [
    {
      "userId": "user1",
      "type": "email",
      "title": "Title 1",
      "message": "Message 1"
    },
    {
      "userId": "user2",
      "type": "sms",
      "title": "Title 2",
      "message": "Message 2"
    }
  ]
}

Response (202 Accepted):
{
  "success": true,
  "totalNotifications": 2,
  "successful": 2,
  "failed": 0,
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

### Service Info
```bash
GET /api/info

Response:
{
  "service": "Kafka Notification Service",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```
KAFKA_BROKER=kafka:29092          # Kafka broker address (Docker Compose)
SERVICE_PORT=3000                 # API server port
LOG_LEVEL=info                    # Logging level (error, warn, info, debug)
NOTIFICATION_TOPIC=notifications  # Kafka topic name
```

## Notification Types

The service supports different notification types with specific handlers:

- **email**: Send email notifications
- **sms**: Send SMS notifications
- **push**: Send push notifications
- **in-app**: In-app notifications
- **webhook**: Webhook callbacks

You can register custom handlers in `src/index.ts`.

## Example Usage

### Using cURL

```bash
# Single notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "type": "email",
    "title": "Test Notification",
    "message": "This is a test",
    "metadata": {"email": "user@example.com"}
  }'

# Batch notifications
curl -X POST http://localhost:3000/api/notifications/batch \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": [
      {
        "userId": "user1",
        "type": "email",
        "title": "Email",
        "message": "Email message"
      },
      {
        "userId": "user2",
        "type": "sms",
        "title": "SMS",
        "message": "SMS message"
      }
    ]
  }'
```

### Using Node.js

```javascript
import NotificationProducer from './src/producer';
import KafkaConnection from './src/kafka';

const kafka = new KafkaConnection(['localhost:9092']);
await kafka.connect();

const producer = new NotificationProducer(kafka.getKafkaInstance());
await producer.connect();

await producer.sendNotification({
  userId: 'user123',
  type: 'email',
  title: 'Hello',
  message: 'Welcome!',
  metadata: { email: 'user@example.com' }
});

await producer.disconnect();
```

## Troubleshooting

### Kafka Connection Issues

If the service can't connect to Kafka:

1. Check Kafka is running:
   ```bash
   docker-compose ps
   ```

2. Check Kafka logs:
   ```bash
   docker-compose logs kafka
   ```

3. Verify broker address matches environment variables

### Topic Creation

Topics are automatically created on startup:
- `notifications`: Main notification topic
- `notification-events`: Event tracking topic

### Logs

View service logs:
```bash
docker-compose logs -f notification-service
```

Logs are also saved to:
- `logs/error.log`: Error level logs
- `logs/combined.log`: All logs

## Development

### Adding Custom Handlers

Edit `src/index.ts` to register custom handlers:

```typescript
consumer.registerHandler('custom-type', async (notification) => {
  // Your custom logic here
  logger.info('Custom handler triggered', notification);
});
```

### Database Integration

To persist notifications, integrate with a database:

```typescript
// In consumer handler
consumer.registerHandler('*', async (notification) => {
  await db.notifications.create(notification);
});
```

## Production Considerations

1. **Scaling**: Use Kafka partitions for parallel processing
2. **Replication**: Increase `replicationFactor` in docker-compose.yml
3. **Security**: Enable SSL/TLS for Kafka connections
4. **Monitoring**: Integrate with monitoring tools (Prometheus, Grafana)
5. **Error Handling**: Implement retry logic and dead-letter queues
6. **Database**: Add persistent storage for notifications

## License

ISC

## Support

For issues or questions, please check the logs and ensure:
- Docker is running
- Kafka is accessible
- Environment variables are properly set
