import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
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
}

export default { requestLoggingMiddleware };
