#!/bin/bash

# Kafka Notification Service - cURL Examples
# This file contains examples of how to interact with the notification service API

BASE_URL="http://localhost:47829"
# Alternative: BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Kafka Notification Service - API Examples"
echo "=========================================="
echo ""

# 1. Health Check
echo "1. Health Check"
echo "curl -X GET $BASE_URL/health"
echo ""

# 2. Service Info
echo "2. Service Info"
echo "curl -X GET $BASE_URL/api/info"
echo ""

# 3. Send Email Notification
echo "3. Send Email Notification"
echo "curl -X POST $BASE_URL/api/notifications \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{
    \"userId\": \"user123\",
    \"type\": \"email\",
    \"title\": \"Order Confirmation\",
    \"message\": \"Your order #ORD-456789 has been confirmed. Expected delivery: Jan 20, 2026\",
    \"metadata\": {
      \"orderId\": \"ORD-456789\",
      \"amount\": 99.99,
      \"currency\": \"USD\"
    }
  }'"
echo ""

# 4. Send SMS Notification
echo "4. Send SMS Notification"
echo "curl -X POST $BASE_URL/api/notifications \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{
    \"userId\": \"user456\",
    \"type\": \"sms\",
    \"title\": \"Verification Code\",
    \"message\": \"Your verification code is: 123456. Valid for 10 minutes.\",
    \"metadata\": {
      \"code\": \"123456\",
      \"expiresIn\": 600
    }
  }'"
echo ""

# 5. Send Push Notification
echo "5. Send Push Notification"
echo "curl -X POST $BASE_URL/api/notifications \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{
    \"userId\": \"user789\",
    \"type\": \"push\",
    \"title\": \"Special Offer\",
    \"message\": \"Get 20% off on your next purchase! Use code: SAVE20\",
    \"metadata\": {
      \"promoCode\": \"SAVE20\",
      \"discount\": 20,
      \"validUntil\": \"2026-01-31\"
    }
  }'"
echo ""

# 6. Send Batch Notifications
echo "6. Send Batch Notifications"
echo "curl -X POST $BASE_URL/api/notifications/batch \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{
    \"notifications\": [
      {
        \"userId\": \"user001\",
        \"type\": \"email\",
        \"title\": \"Welcome\",
        \"message\": \"Welcome to our service! Your account has been created.\",
        \"metadata\": {
          \"accountId\": \"ACC-001\"
        }
      },
      {
        \"userId\": \"user002\",
        \"type\": \"sms\",
        \"title\": \"OTP\",
        \"message\": \"Your OTP is 654321\",
        \"metadata\": {
          \"otp\": \"654321\"
        }
      },
      {
        \"userId\": \"user003\",
        \"type\": \"push\",
        \"title\": \"Update Available\",
        \"message\": \"A new version is available. Please update your app.\",
        \"metadata\": {
          \"version\": \"2.0.0\"
        }
      }
    ]
  }'"
echo ""

# 7. View Swagger UI
echo "7. View Swagger UI Documentation"
echo "Open in your browser: $BASE_URL/api/docs"
echo ""

echo "=========================================="
echo "Note: Make sure the service is running!"
echo "=========================================="
