import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(
      (info) => {
        const source = info.source ? `[${info.source}]` : '';
        const detailsObj: Record<string, any> = {
          ...info,
          timestamp: undefined,
          level: undefined,
          message: undefined,
          source: undefined,
        };
        const hasDetails = Object.keys(detailsObj).some(key => detailsObj[key] !== undefined);
        const details = hasDetails ? JSON.stringify(detailsObj, null, 2) : '';
        return `[${info.timestamp}] ${source} ${info.level.toUpperCase()}: ${info.message} ${details}`;
      }
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

export default logger;
