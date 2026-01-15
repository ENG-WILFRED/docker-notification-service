import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';
import { NotificationProducer } from '../../kafka';

export function createBatchRouter(producer: NotificationProducer): Router {
  const router = Router();

  /**
   * @swagger
   * /api/notifications/batch:
   *   post:
   *     summary: Send batch notifications
   *     tags:
   *       - Notifications
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - notifications
   *             properties:
   *               notifications:
   *                 type: array
   *                 minItems: 1
   *                 items:
   *                   type: object
   *                   required:
   *                     - userId
   *                     - type
   *                     - title
   *                     - message
   *                   properties:
   *                     userId:
   *                       type: string
   *                       example: user123
   *                     type:
   *                       type: string
   *                       enum: [email, sms, push]
   *                       example: email
   *                     title:
   *                       type: string
   *                       example: Notification Title
   *                     message:
   *                       type: string
   *                       example: Notification message content
   *                     metadata:
   *                       type: object
   *     responses:
   *       202:
   *         description: Batch notifications queued for processing
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 batchId:
   *                   type: string
   *                 totalNotifications:
   *                   type: number
   *                 queued:
   *                   type: number
   *                 timestamp:
   *                   type: string
   *       400:
   *         description: Invalid request parameters
   *       500:
   *         description: Server error
   */
  router.post('/api/notifications/batch', async (req: Request, res: Response) => {
    const requestStartTime = new Date().toISOString();
    const batchId = uuidv4();

    logger.info('Incoming POST /api/notifications/batch request', {
      source: 'API',
      batchId,
      requestTime: requestStartTime,
      notificationCount: req.body?.notifications?.length || 0,
    });

    try {
      const { notifications } = req.body;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        logger.warn('Invalid batch request: empty or invalid notifications array', {
          source: 'API',
          batchId,
          requestTime: requestStartTime,
          endTime: new Date().toISOString(),
        });
        return res.status(400).json({
          error: 'notifications must be a non-empty array',
          batchId,
        });
      }

      logger.info(`Processing batch of ${notifications.length} notifications`, {
        source: 'API',
        batchId,
        requestTime: requestStartTime,
        count: notifications.length,
      });

      const results = await Promise.allSettled(
        notifications.map((notif) =>
          producer.sendNotification({
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
        batchId,
        requestTime: requestStartTime,
        endTime,
        totalNotifications: notifications.length,
        successful,
        failed,
      });

      res.status(202).json({
        success: true,
        batchId,
        totalNotifications: notifications.length,
        queued: successful,
        failed,
        timestamp: endTime,
      });
    } catch (error) {
      const endTime = new Date().toISOString();
      logger.error('Batch API error', {
        source: 'API',
        batchId,
        error,
        requestTime: requestStartTime,
        endTime,
      });
      res.status(500).json({
        error: 'Failed to send batch notifications',
        batchId,
        timestamp: endTime,
      });
    }
  });

  return router;
}

export default createBatchRouter;
