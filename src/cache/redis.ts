import { createClient } from 'redis';
import logger from '../logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err: Error) => {
  logger.error('Redis Client Error:', {
    source: 'REDIS',
    error: err,
    timestamp: new Date().toISOString(),
  });
});

redisClient.on('connect', () => {
  logger.info('Redis client connected', {
    source: 'REDIS',
    timestamp: new Date().toISOString(),
  });
});

redisClient.on('ready', () => {
  logger.info('Redis client ready', {
    source: 'REDIS',
    timestamp: new Date().toISOString(),
  });
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting', {
    source: 'REDIS',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info('Redis connected successfully', {
        source: 'REDIS',
        url: redisUrl.replace(/:[^@]*@/, ':****@'), // Hide password
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to connect to Redis', {
      source: 'REDIS',
      error,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis disconnected', {
        source: 'REDIS',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to disconnect from Redis', {
      source: 'REDIS',
      error,
      timestamp: new Date().toISOString(),
    });
  }
}

export default redisClient;
