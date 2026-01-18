import dotenv from 'dotenv';
import logger from './logger';
import NotificationAPI from './api';
import { dbPool } from './db';
import { redisClient } from './cache';
import { RetryHandler } from './cache/retry';
import { captureServiceConfig, writeConfigToIntegration, logConfigToConsole } from './config-logger';

dotenv.config();

const SERVICE_PORT = parseInt(process.env.SERVICE_PORT || '3000', 10);

async function main() {
  try {
    // Capture and log configuration
    const config = captureServiceConfig();
    logConfigToConsole(config);
    writeConfigToIntegration(config);

    logger.info('Starting Notification Service', {
      source: 'MAIN',
      timestamp: new Date().toISOString(),
    });

    // Initialize database connection
    await dbPool.connect();

    // Initialize Redis connection
    await redisClient.connect();

    // Start retry processor
    RetryHandler.startRetryProcessor();

    // Start API server
    const api = new NotificationAPI(SERVICE_PORT);
    api.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...', {
        source: 'MAIN',
        timestamp: new Date().toISOString(),
      });
      RetryHandler.stopRetryProcessor();
      await redisClient.disconnect();
      await dbPool.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...', {
        source: 'MAIN',
        timestamp: new Date().toISOString(),
      });
      RetryHandler.stopRetryProcessor();
      await redisClient.disconnect();
      await dbPool.disconnect();
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
