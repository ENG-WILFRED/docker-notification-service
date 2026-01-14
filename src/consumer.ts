import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import logger from './logger';

export interface NotificationMessage {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export type NotificationHandler = (notification: NotificationMessage) => Promise<void>;

export class NotificationConsumer {
  private consumer: Consumer;
  private topic: string;
  private groupId: string;
  private handlers: Map<string, NotificationHandler[]> = new Map();

  constructor(
    kafka: Kafka,
    topic: string = 'notifications',
    groupId: string = 'notification-service-group'
  ) {
    this.consumer = kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
    });
    this.topic = topic;
    this.groupId = groupId;
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      logger.info('Notification consumer connected', { source: 'CONSUMER' });
    } catch (error) {
      logger.error('Failed to connect consumer:', { error, source: 'CONSUMER' });
      throw error;
    }
  }

  subscribe(notificationType?: string): void {
    try {
      this.consumer.subscribe({
        topic: this.topic,
        fromBeginning: false,
      });
      logger.info(`Consumer subscribed to topic: ${this.topic}`, { source: 'CONSUMER' });
    } catch (error) {
      logger.error('Failed to subscribe:', { error, source: 'CONSUMER' });
      throw error;
    }
  }

  registerHandler(notificationType: string, handler: NotificationHandler): void {
    if (!this.handlers.has(notificationType)) {
      this.handlers.set(notificationType, []);
    }
    this.handlers.get(notificationType)!.push(handler);
    logger.info(`Handler registered for notification type: ${notificationType}`, { source: 'CONSUMER' });
  }

  async start(): Promise<void> {
    try {
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
      logger.info('Notification consumer started processing messages', { source: 'CONSUMER' });
    } catch (error) {
      logger.error('Failed to start consumer:', { error, source: 'CONSUMER' });
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      const message = payload.message;
      if (!message.value) return;

      const notification: NotificationMessage = JSON.parse(message.value.toString());
      const handlers = this.handlers.get(notification.type) || this.handlers.get('*') || [];

      logger.info(`Processing notification`, {
        source: 'CONSUMER',
        id: notification.id,
        type: notification.type,
        userId: notification.userId,
        timestamp: new Date().toISOString(),
      });

      for (const handler of handlers) {
        try {
          await handler(notification);
        } catch (error) {
          logger.error('Handler error:', {
            source: 'CONSUMER',
            error,
            notificationId: notification.id,
            type: notification.type,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process message:', { error, source: 'CONSUMER', timestamp: new Date().toISOString() });
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      logger.info('Notification consumer disconnected', { source: 'CONSUMER' });
    } catch (error) {
      logger.error('Failed to disconnect consumer:', { error, source: 'CONSUMER' });
    }
  }
}

export default NotificationConsumer;
