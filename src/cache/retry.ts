import { redisClient } from './redis';
import logger from '../logger';

export interface RetryQueueItem {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  connectionKey: string;
  template: string;
  rendered?: Record<string, any>;
  attemptCount: number;
  failureReason?: string;
  createdAt: string;
}

/**
 * Notification retry queue with Redis
 * - Stores failed notifications for 5 minutes
 * - First retry after 2 minutes
 * - Removes after 5 minutes
 */
export class RetryQueue {
  private static readonly QUEUE_PREFIX = 'notification:retry:';
  private static readonly ATTEMPT_PREFIX = 'notification:attempts:';
  private static readonly RETRY_TTL = 300; // 5 minutes in seconds
  private static readonly FIRST_RETRY_DELAY = 120; // 2 minutes in seconds
  private static readonly SECOND_RETRY_DELAY = 240; // 4 minutes in seconds

  /**
   * Add failed notification to retry queue
   */
  static async addToQueue(
    notificationId: string,
    notificationData: Omit<RetryQueueItem, 'attemptCount' | 'createdAt'>,
    failureReason: string
  ): Promise<void> {
    try {
      const queueKey = `${this.QUEUE_PREFIX}${notificationId}`;
      const attemptsKey = `${this.ATTEMPT_PREFIX}${notificationId}`;

      const queueItem: RetryQueueItem = {
        ...notificationData,
        attemptCount: 1,
        failureReason,
        createdAt: new Date().toISOString(),
      };

      // Store in Redis with TTL of 5 minutes
      await redisClient.setEx(
        queueKey,
        this.RETRY_TTL,
        JSON.stringify(queueItem)
      );

      // Initialize attempt counter
      await redisClient.setEx(attemptsKey, this.RETRY_TTL, '1');

      logger.info('Notification added to retry queue', {
        source: 'RETRY_QUEUE',
        notificationId,
        userId: notificationData.userId,
        type: notificationData.type,
        failureReason,
        ttl: `${this.RETRY_TTL}s`,
        nextRetry: `${this.FIRST_RETRY_DELAY}s`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to add notification to retry queue', {
        source: 'RETRY_QUEUE',
        error,
        notificationId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get item from retry queue
   */
  static async getFromQueue(notificationId: string): Promise<RetryQueueItem | null> {
    try {
      const queueKey = `${this.QUEUE_PREFIX}${notificationId}`;
      const data = await redisClient.get(queueKey);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as RetryQueueItem;
    } catch (error) {
      logger.error('Failed to get notification from retry queue', {
        source: 'RETRY_QUEUE',
        error,
        notificationId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get all items in retry queue
   */
  static async getAllQueuedNotifications(): Promise<RetryQueueItem[]> {
    try {
      const keys = await redisClient.keys(`${this.QUEUE_PREFIX}*`);
      const items: RetryQueueItem[] = [];

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          items.push(JSON.parse(data) as RetryQueueItem);
        }
      }

      return items;
    } catch (error) {
      logger.error('Failed to get all queued notifications', {
        source: 'RETRY_QUEUE',
        error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get items ready for retry at specific time
   * Time values: 2 (2 min), 4 (4 min), 5 (5 min+)
   */
  static async getItemsReadyForRetry(minutesMark: 2 | 4 | 5): Promise<RetryQueueItem[]> {
    try {
      const allItems = await this.getAllQueuedNotifications();
      const now = new Date();

      return allItems.filter((item) => {
        const createdAt = new Date(item.createdAt);
        const ageInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        if (minutesMark === 2) {
          // Return items between 2-3 minutes old
          return ageInMinutes >= 2 && ageInMinutes < 3;
        } else if (minutesMark === 4) {
          // Return items between 4-5 minutes old
          return ageInMinutes >= 4 && ageInMinutes < 5;
        } else {
          // Return items 5+ minutes old (for cleanup)
          return ageInMinutes >= 5;
        }
      });
    } catch (error) {
      logger.error('Failed to get items ready for retry', {
        source: 'RETRY_QUEUE',
        error,
        minutesMark,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Increment retry attempt count
   */
  static async incrementAttempt(notificationId: string): Promise<number> {
    try {
      const attemptsKey = `${this.ATTEMPT_PREFIX}${notificationId}`;
      const result = await redisClient.incr(attemptsKey);

      // Ensure TTL is still set
      await redisClient.expire(attemptsKey, this.RETRY_TTL);

      return result;
    } catch (error) {
      logger.error('Failed to increment retry attempt', {
        source: 'RETRY_QUEUE',
        error,
        notificationId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get attempt count
   */
  static async getAttemptCount(notificationId: string): Promise<number> {
    try {
      const attemptsKey = `${this.ATTEMPT_PREFIX}${notificationId}`;
      const count = await redisClient.get(attemptsKey);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('Failed to get attempt count', {
        source: 'RETRY_QUEUE',
        error,
        notificationId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Remove from retry queue (success or final failure)
   */
  static async removeFromQueue(notificationId: string): Promise<void> {
    try {
      const queueKey = `${this.QUEUE_PREFIX}${notificationId}`;
      const attemptsKey = `${this.ATTEMPT_PREFIX}${notificationId}`;

      await redisClient.del([queueKey, attemptsKey]);

      logger.info('Notification removed from retry queue', {
        source: 'RETRY_QUEUE',
        notificationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to remove notification from retry queue', {
        source: 'RETRY_QUEUE',
        error,
        notificationId,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    totalItems: number;
    readyFor2MinRetry: number;
    readyFor4MinRetry: number;
    readyForCleanup: number;
  }> {
    try {
      const items = await this.getAllQueuedNotifications();
      const readyFor2Min = await this.getItemsReadyForRetry(2);
      const readyFor4Min = await this.getItemsReadyForRetry(4);
      const readyForCleanup = await this.getItemsReadyForRetry(5);

      return {
        totalItems: items.length,
        readyFor2MinRetry: readyFor2Min.length,
        readyFor4MinRetry: readyFor4Min.length,
        readyForCleanup: readyForCleanup.length,
      };
    } catch (error) {
      logger.error('Failed to get queue statistics', {
        source: 'RETRY_QUEUE',
        error,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

/**
 * Retry handler service
 */
export class RetryHandler {
  private static retryIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start automatic retry processing
   */
  static startRetryProcessor(): void {
    logger.info('Starting retry processor', {
      source: 'RETRY_QUEUE',
      timestamp: new Date().toISOString(),
    });

    // First retry at 2 minutes
    const interval1 = setInterval(async () => {
      await this.processRetryAtMark(2);
    }, 10000); // Check every 10 seconds

    // Second retry at 4 minutes
    const interval2 = setInterval(async () => {
      await this.processRetryAtMark(4);
    }, 10000);

    // Cleanup at 5 minutes
    const interval3 = setInterval(async () => {
      await this.processCleanup();
    }, 10000);

    this.retryIntervals.set('2min', interval1);
    this.retryIntervals.set('4min', interval2);
    this.retryIntervals.set('cleanup', interval3);
  }

  /**
   * Stop automatic retry processing
   */
  static stopRetryProcessor(): void {
    logger.info('Stopping retry processor', {
      source: 'RETRY_QUEUE',
      timestamp: new Date().toISOString(),
    });

    for (const [key, interval] of this.retryIntervals) {
      clearInterval(interval);
      this.retryIntervals.delete(key);
    }
  }

  /**
   * Process retries at specific time mark
   */
  private static async processRetryAtMark(minuteMark: 2 | 4): Promise<void> {
    try {
      const items = await RetryQueue.getItemsReadyForRetry(minuteMark);

      if (items.length === 0) {
        return;
      }

      logger.info(`Processing ${items.length} notifications for ${minuteMark}-minute retry`, {
        source: 'RETRY_QUEUE',
        timestamp: new Date().toISOString(),
      });

      for (const item of items) {
        try {
          // Increment attempt count
          const attemptCount = await RetryQueue.incrementAttempt(item.notificationId);

          logger.info('Retrying notification', {
            source: 'RETRY_QUEUE',
            notificationId: item.notificationId,
            userId: item.userId,
            attempt: attemptCount,
            type: item.type,
            timestamp: new Date().toISOString(),
          });

          // TODO: Implement retry logic here (send notification again)
          // If successful, remove from queue
          // If failed again, it will be retried at next mark

        } catch (error) {
          logger.error('Error processing retry', {
            source: 'RETRY_QUEUE',
            error,
            notificationId: item.notificationId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process retries', {
        source: 'RETRY_QUEUE',
        error,
        minuteMark,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Process cleanup of expired items
   */
  private static async processCleanup(): Promise<void> {
    try {
      const items = await RetryQueue.getItemsReadyForRetry(5);

      if (items.length === 0) {
        return;
      }

      logger.warn(`Cleaning up ${items.length} expired notifications from retry queue`, {
        source: 'RETRY_QUEUE',
        timestamp: new Date().toISOString(),
      });

      for (const item of items) {
        try {
          // Remove from queue
          await RetryQueue.removeFromQueue(item.notificationId);

          logger.info('Notification removed from retry queue (expired)', {
            source: 'RETRY_QUEUE',
            notificationId: item.notificationId,
            userId: item.userId,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.error('Error during cleanup', {
            source: 'RETRY_QUEUE',
            error,
            notificationId: item.notificationId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process cleanup', {
        source: 'RETRY_QUEUE',
        error,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default {
  RetryQueue,
  RetryHandler,
};
