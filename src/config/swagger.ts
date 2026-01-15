import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kafka Notification Service API',
      version: '1.0.0',
      description:
        'A Kafka-based notification service for sending emails, SMS, and push notifications',
      contact: {
        name: 'API Support',
        email: 'support@notification.service',
      },
    },
    servers: [
      {
        url: 'http://localhost:47829',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server (alternative port)',
      },
    ],
    components: {
      schemas: {
        Notification: {
          type: 'object',
          required: ['userId', 'type', 'title', 'message'],
          properties: {
            userId: {
              type: 'string',
              description: 'User identifier',
              example: 'user123',
            },
            type: {
              type: 'string',
              enum: ['email', 'sms', 'push'],
              description: 'Notification type',
              example: 'email',
            },
            title: {
              type: 'string',
              description: 'Notification title',
              example: 'Order Confirmation',
            },
            message: {
              type: 'string',
              description: 'Notification message content',
              example: 'Your order #ORD-123 has been confirmed',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata for the notification',
              example: {
                orderId: 'ORD-123',
                amount: 99.99,
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Info',
        description: 'Service information endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
    ],
  },
  apis: ['./src/api/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
