import { Kafka, Producer } from 'kafkajs';
import logger from '../logger';

export class NotificationProducer {
  private producer: Producer;
  private topic: string;

  constructor(kafka: Kafka, topic: string = 'notifications') {
    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 60000,
    });
    this.topic = topic;
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      logger.info('Notification producer connected', { source: 'PRODUCER' });
    } catch (error) {
      logger.error('Failed to connect producer:', { error, source: 'PRODUCER' });
      throw error;
    }
  }

  async sendNotification(notification: {
    id?: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    timestamp?: number;
  }): Promise<void> {
    try {
      const payload = {
        id: notification.id || `${Date.now()}-${Math.random()}`,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata || {},
        timestamp: notification.timestamp || Date.now(),
      };

      const result = await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: notification.userId,
            value: JSON.stringify(payload),
            headers: {
              'correlation-id': `${Date.now()}`,
              'notification-type': notification.type,
            },
          },
        ],
      });

      logger.info(`Notification sent successfully`, {
        source: 'PRODUCER',
        topic: this.topic,
        userId: notification.userId,
        type: notification.type,
        partition: result[0].partition,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to send notification:', {
        error,
        source: 'PRODUCER',
        userId: notification.userId,
        type: notification.type,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      logger.info('Notification producer disconnected', { source: 'PRODUCER' });
    } catch (error) {
      logger.error('Failed to disconnect producer:', { error, source: 'PRODUCER' });
    }
  }
}

export default NotificationProducer;
