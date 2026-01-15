import { Kafka, logLevel } from 'kafkajs';
import logger from '../logger';

export class KafkaConnection {
  private kafka: Kafka;
  private connected: boolean = false;

  constructor(brokers: string[]) {
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers,
      logLevel: logLevel.INFO,
      ssl: false,
      connectionTimeout: 10000,
      requestTimeout: 30000,
      retry: {
        initialRetryTime: 300,
        retries: 8,
        maxRetryTime: 30000,
        factor: 0.2,
        multiplier: 2,
      },
    });

    logger.info(`Kafka client initialized with brokers: ${brokers.join(', ')}`);
  }

  async connect(): Promise<void> {
    try {
      if (this.connected) {
        return;
      }

      const admin = this.kafka.admin();
      await admin.connect();
      logger.info('Connected to Kafka');
      this.connected = true;

      // Create topics if they don't exist
      try {
        await admin.createTopics({
          topics: [
            {
              topic: 'notifications',
              numPartitions: 3,
              replicationFactor: 1,
            },
            {
              topic: 'notification-events',
              numPartitions: 3,
              replicationFactor: 1,
            },
          ],
          validateOnly: false,
          timeout: 5000,
        });
        logger.info('Topics created or already exist');
      } catch (error) {
        logger.info('Topics already exist or validation passed');
      }

      await admin.disconnect();
    } catch (error) {
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  getKafkaInstance(): Kafka {
    return this.kafka;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export default KafkaConnection;
