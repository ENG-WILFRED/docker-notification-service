import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import logger from '../logger';
import { NotificationProducer } from '../kafka';
import { swaggerSpec } from '../config/swagger';
import { requestLoggingMiddleware } from './middleware';
import healthRoutes from './routes/health';
import infoRoutes from './routes/info';
import createNotificationsRouter from './routes/notifications';
import createBatchRouter from './routes/batch';

export class NotificationAPI {
  private app: Express;
  private producer: NotificationProducer;
  private port: number;

  constructor(producer: NotificationProducer, port: number = 3000) {
    this.app = express();
    this.producer = producer;
    this.port = port;
    this.setupMiddleware();
    this.setupSwagger();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLoggingMiddleware);
  }

  private setupSwagger(): void {
    this.app.use(
      '/api/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
          docExpansion: 'list',
          defaultModelsExpandDepth: 1,
        },
      })
    );

    // OpenAPI spec endpoint
    this.app.get('/api/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  private setupRoutes(): void {
    // Health and info routes
    this.app.use(healthRoutes);
    this.app.use(infoRoutes);

    // Notification routes
    this.app.use(createNotificationsRouter(this.producer));
    this.app.use(createBatchRouter(this.producer));
  }

  start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Notification API server started on port ${this.port}`, {
        source: 'API',
        timestamp: new Date().toISOString(),
      });
      logger.info(`Swagger UI available at http://localhost:${this.port}/api/docs`, {
        source: 'API',
      });
    });
  }
}

export default NotificationAPI;
