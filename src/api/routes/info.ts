import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /api/info:
 *   get:
 *     summary: Get service information
 *     tags:
 *       - Info
 *     responses:
 *       200:
 *         description: Service information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: string
 *                   example: Kafka Notification Service
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 status:
 *                   type: string
 *                   example: running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/api/info', (req: Request, res: Response) => {
  res.json({
    service: 'Kafka Notification Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
