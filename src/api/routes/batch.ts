import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';
import { TemplateRenderer } from '../../templates';

export function createBatchRouter(): Router {
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

      // Register batch notifications with rendered templates
      const batchData = notifications.map((notif, index) => {
        const renderedTemplate = TemplateRenderer.render({
          userId: notif.userId,
          type: notif.type as 'email' | 'sms' | 'push',
          title: notif.title,
          message: notif.message,
          metadata: notif.metadata,
        });

        return {
          ...notif,
          connectionKey: `batch-${batchId}-${index}`,
          template: `${notif.type}-template`,
          rendered: renderedTemplate,
        };
      });

      const successful = batchData.length;
      const failed = 0;
      const endTime = new Date().toISOString();

      logger.info('Batch notifications registered with templates', {
        source: 'API',
        batchId,
        requestTime: requestStartTime,
        endTime,
        totalNotifications: notifications.length,
        successful,
        failed,
        connectionKeys: batchData.map(n => n.connectionKey),
      });

      res.status(202).json({
        success: true,
        batchId,
        totalNotifications: notifications.length,
        registered: successful,
        failed,
        timestamp: endTime,
        connectionKeys: batchData.map(n => n.connectionKey),
        templates: batchData.map(n => n.template),
        rendered: batchData.map(n => ({
          connectionKey: n.connectionKey,
          type: n.type,
          subject: n.rendered.subject,
          html: n.type === 'email' ? n.rendered.html : undefined,
          text: n.rendered.text || n.rendered.plainText,
        })),
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
        error: 'Failed to register batch notifications',
        batchId,
        timestamp: endTime,
      });
    }
  });

  return router;
}

export default createBatchRouter;
