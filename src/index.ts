import dotenv from 'dotenv';
import logger from './logger';
import KafkaConnection from './kafka';
import NotificationProducer from './producer';
import NotificationConsumer, { NotificationMessage } from './consumer';
import NotificationAPI from './api';

dotenv.config();

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const SERVICE_PORT = parseInt(process.env.SERVICE_PORT || '3000', 10);

async function main() {
  try {
    logger.info('Starting Kafka Notification Service', {
      source: 'MAIN',
      timestamp: new Date().toISOString(),
    });

    // Initialize Kafka connection
    const kafkaConnection = new KafkaConnection([KAFKA_BROKER]);
    await kafkaConnection.connect();

    // Initialize producer
    const producer = new NotificationProducer(kafkaConnection.getKafkaInstance());
    await producer.connect();

    // Initialize consumer
    const consumer = new NotificationConsumer(
      kafkaConnection.getKafkaInstance(),
      'notifications',
      'notification-service-group'
    );
    await consumer.connect();

    // Register handlers for different notification types
    consumer.registerHandler('email', async (notification: NotificationMessage) => {
      logger.info(`Handling email notification:`, {
        source: 'CONSUMER',
        userId: notification.userId,
        title: notification.title,
        timestamp: new Date().toISOString(),
      });
      // TODO: Implement email sending logic
    });

    consumer.registerHandler('sms', async (notification: NotificationMessage) => {
      logger.info(`Handling SMS notification:`, {
        source: 'CONSUMER',
        userId: notification.userId,
        message: notification.message,
        timestamp: new Date().toISOString(),
      });
      // TODO: Implement SMS sending logic
    });

    consumer.registerHandler('push', async (notification: NotificationMessage) => {
      logger.info(`Handling push notification:`, {
        source: 'CONSUMER',
        userId: notification.userId,
        title: notification.title,
        timestamp: new Date().toISOString(),
      });
      // TODO: Implement push notification logic
    });

    // Default handler for all notifications
    consumer.registerHandler('*', async (notification: NotificationMessage) => {
      logger.info(`Processing notification:`, {
        source: 'CONSUMER',
        id: notification.id,
        type: notification.type,
        userId: notification.userId,
        timestamp: new Date().toISOString(),
      });
    });

    consumer.subscribe();
    await consumer.start();

    // Start API server
    const api = new NotificationAPI(producer, SERVICE_PORT);
    api.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...', {
        source: 'MAIN',
        timestamp: new Date().toISOString(),
      });
      await consumer.disconnect();
      await producer.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...', {
        source: 'MAIN',
        timestamp: new Date().toISOString(),
      });
      await consumer.disconnect();
      await producer.disconnect();
      process.exit(0);
    });

    logger.info('Kafka Notification Service is ready', {
      source: 'MAIN',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Fatal error:', {
      error,
      source: 'MAIN',
      timestamp: new Date().toISOString(),
    });
    process.exit(1);
  }
}

main();
