import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';
import { TemplateRenderer } from '../../templates';

export function createNotificationsRouter(): Router {
  const router = Router();

  /**
   * @swagger
   * /api/notifications:
   *   post:
   *     summary: Send a single notification
   *     tags:
   *       - Notifications
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - type
   *               - title
   *               - message
   *             properties:
   *               userId:
   *                 type: string
   *                 example: user123
   *               type:
   *                 type: string
   *                 enum: [email, sms, push]
   *                 example: email
   *               title:
   *                 type: string
   *                 example: Order Confirmation
   *               message:
   *                 type: string
   *                 example: Your order has been confirmed
   *               metadata:
   *                 type: object
   *                 example:
   *                   orderId: ORD-123
   *                   amount: 99.99
   *     responses:
   *       202:
   *         description: Notification queued for processing
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Notification queued for processing
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       400:
   *         description: Invalid request parameters
   *       500:
   *         description: Server error
   */
  router.post('/api/notifications', async (req: Request, res: Response) => {
    const requestStartTime = new Date().toISOString();
    const notificationId = uuidv4();

    logger.info('Incoming POST /api/notifications request', {
      source: 'API',
      notificationId,
      requestTime: requestStartTime,
      body: req.body,
    });

    try {
      const { userId, type, title, message, metadata } = req.body;

      // Validate required fields
      if (!userId || !type || !title || !message) {
        logger.warn('Invalid request: missing required fields', {
          source: 'API',
          notificationId,
          requestTime: requestStartTime,
          endTime: new Date().toISOString(),
          providedFields: { userId: !!userId, type: !!type, title: !!title, message: !!message },
        });
        return res.status(400).json({
          error: 'Missing required fields: userId, type, title, message',
          notificationId,
        });
      }

      // Validate notification type
      const validTypes = ['email', 'sms', 'push'];
      if (!validTypes.includes(type)) {
        logger.warn('Invalid notification type', {
          source: 'API',
          notificationId,
          type,
        });
        return res.status(400).json({
          error: `Invalid notification type. Allowed types: ${validTypes.join(', ')}`,
          notificationId,
        });
      }

      // Render template based on notification type
      const renderedTemplate = TemplateRenderer.render({
        userId,
        type: type as 'email' | 'sms' | 'push',
        title,
        message,
        metadata,
      });

      // Store notification metadata for documentation
      const notificationData = {
        userId,
        type,
        title,
        message,
        metadata,
        notificationId,
        connectionKey: `notification-${notificationId}`,
        template: `${type}-template`,
        rendered: renderedTemplate,
      };

      const endTime = new Date().toISOString();
      logger.info('Notification registered with template', {
        source: 'API',
        notificationId,
        requestTime: requestStartTime,
        endTime,
        userId,
        type,
        connectionKey: notificationData.connectionKey,
        template: notificationData.template,
        templateType: type === 'email' ? 'HTML' : type === 'sms' ? 'Plain Text' : 'JSON',
      });

      res.status(202).json({
        success: true,
        notificationId,
        message: 'Notification registered for processing',
        timestamp: endTime,
        connectionKey: notificationData.connectionKey,
        template: notificationData.template,
        rendered: {
          subject: renderedTemplate.subject,
          html: type === 'email' ? renderedTemplate.html : undefined,
          text: renderedTemplate.text || renderedTemplate.plainText,
        },
      });
    } catch (error) {
      const endTime = new Date().toISOString();
      logger.error('API error during notification registration', {
        source: 'API',
        notificationId,
        error,
        requestTime: requestStartTime,
        endTime,
      });
      res.status(500).json({
        error: 'Failed to register notification',
        notificationId,
        timestamp: endTime,
      });
    }
  });

  return router;
}

export default createNotificationsRouter;
