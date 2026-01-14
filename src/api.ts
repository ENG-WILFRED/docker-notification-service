import express, { Express, Request, Response } from 'express';
import logger from './logger';
import { NotificationProducer } from './producer';

export class NotificationAPI {
  private app: Express;
  private producer: NotificationProducer;
  private port: number;

  constructor(producer: NotificationProducer, port: number = 3000) {
    this.app = express();
    this.producer = producer;
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next) => {
      const startTime = Date.now();
      const startTimeISO = new Date().toISOString();
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info(`${req.method} ${req.path}`, {
          source: 'API',
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          requestTime: startTimeISO,
          endTime: new Date().toISOString(),
        });
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Send notification endpoint
    this.app.post('/api/notifications', async (req: Request, res: Response) => {
      const requestStartTime = new Date().toISOString();
      logger.info('Incoming POST /api/notifications request', {
        source: 'API',
        requestTime: requestStartTime,
        body: req.body,
      });

      try {
        const { userId, type, title, message, metadata } = req.body;

        // Validate required fields
        if (!userId || !type || !title || !message) {
          logger.warn('Invalid request: missing required fields', {
            source: 'API',
            requestTime: requestStartTime,
            endTime: new Date().toISOString(),
            providedFields: { userId: !!userId, type: !!type, title: !!title, message: !!message },
          });
          return res.status(400).json({
            error: 'Missing required fields: userId, type, title, message',
          });
        }

        await this.producer.sendNotification({
          userId,
          type,
          title,
          message,
          metadata,
        });

        const endTime = new Date().toISOString();
        logger.info('Notification sent successfully via API', {
          source: 'API',
          requestTime: requestStartTime,
          endTime,
          userId,
          type,
        });

        res.status(202).json({
          success: true,
          message: 'Notification queued for processing',
          timestamp: endTime,
        });
      } catch (error) {
        const endTime = new Date().toISOString();
        logger.error('API error during notification send', {
          source: 'API',
          error,
          requestTime: requestStartTime,
          endTime,
        });
        res.status(500).json({
          error: 'Failed to send notification',
          timestamp: endTime,
        });
      }
    });

    // Send batch notifications
    this.app.post('/api/notifications/batch', async (req: Request, res: Response) => {
      const requestStartTime = new Date().toISOString();
      logger.info('Incoming POST /api/notifications/batch request', {
        source: 'API',
        requestTime: requestStartTime,
        notificationCount: req.body?.notifications?.length || 0,
      });

      try {
        const { notifications } = req.body;

        if (!Array.isArray(notifications) || notifications.length === 0) {
          logger.warn('Invalid batch request: empty or invalid notifications array', {
            source: 'API',
            requestTime: requestStartTime,
            endTime: new Date().toISOString(),
          });
          return res.status(400).json({
            error: 'notifications must be a non-empty array',
          });
        }

        logger.info(`Processing batch of ${notifications.length} notifications`, {
          source: 'API',
          requestTime: requestStartTime,
          count: notifications.length,
        });

        const results = await Promise.allSettled(
          notifications.map((notif) =>
            this.producer.sendNotification({
              userId: notif.userId,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              metadata: notif.metadata,
            })
          )
        );

        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        const endTime = new Date().toISOString();

        logger.info('Batch notifications processed', {
          source: 'API',
          requestTime: requestStartTime,
          endTime,
          totalNotifications: notifications.length,
          successful,
          failed,
        });

        res.status(202).json({
          success: true,
          totalNotifications: notifications.length,
          successful,
          failed,
          timestamp: endTime,
        });
      } catch (error) {
        const endTime = new Date().toISOString();
        logger.error('Batch API error', {
          source: 'API',
          error,
          requestTime: requestStartTime,
          endTime,
        });
        res.status(500).json({
          error: 'Failed to send batch notifications',
          timestamp: endTime,
        });
      }
    });

    // Service info
    this.app.get('/api/info', (req: Request, res: Response) => {
      res.json({
        service: 'Kafka Notification Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });
  }

  start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Notification API server started on port ${this.port}`, {
        source: 'API',
        timestamp: new Date().toISOString(),
      });
    });
  }
}

export default NotificationAPI;
