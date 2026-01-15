/**
 * Sample notification data for testing the API
 * These are example payloads you can use with curl or Postman
 */

export const sampleNotifications = {
  emailNotification: {
    userId: 'user123',
    type: 'email',
    title: 'Order Confirmation',
    message: 'Your order #ORD-456789 has been confirmed. Expected delivery: Jan 20, 2026',
    metadata: {
      orderId: 'ORD-456789',
      amount: 99.99,
      currency: 'USD',
    },
  },

  smsNotification: {
    userId: 'user456',
    type: 'sms',
    title: 'Verification Code',
    message: 'Your verification code is: 123456. Valid for 10 minutes.',
    metadata: {
      code: '123456',
      expiresIn: 600,
    },
  },

  pushNotification: {
    userId: 'user789',
    type: 'push',
    title: 'Special Offer',
    message: 'Get 20% off on your next purchase! Use code: SAVE20',
    metadata: {
      promoCode: 'SAVE20',
      discount: 20,
      validUntil: '2026-01-31',
    },
  },

  batchNotifications: {
    notifications: [
      {
        userId: 'user001',
        type: 'email',
        title: 'Welcome',
        message: 'Welcome to our service! Your account has been created.',
        metadata: {
          accountId: 'ACC-001',
        },
      },
      {
        userId: 'user002',
        type: 'sms',
        title: 'OTP',
        message: 'Your OTP is 654321',
        metadata: {
          otp: '654321',
        },
      },
      {
        userId: 'user003',
        type: 'push',
        title: 'Update Available',
        message: 'A new version is available. Please update your app.',
        metadata: {
          version: '2.0.0',
        },
      },
      {
        userId: 'user004',
        type: 'email',
        title: 'Billing Alert',
        message: 'Your payment is due on Jan 20, 2026',
        metadata: {
          dueDate: '2026-01-20',
          amount: 49.99,
        },
      },
    ],
  },
};

export default sampleNotifications;
