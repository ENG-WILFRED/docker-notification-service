#!/bin/bash

# Test the notification service API

BASE_URL="http://localhost:3000"

echo "Testing Notification Service API"
echo "================================="

# Test 1: Health check
echo -e "\n1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq .

# Test 2: Service info
echo -e "\n2. Testing service info..."
curl -s "$BASE_URL/api/info" | jq .

# Test 3: Send single notification
echo -e "\n3. Sending single notification..."
curl -s -X POST "$BASE_URL/api/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "type": "email",
    "title": "Test Notification",
    "message": "This is a test notification from the Kafka service",
    "metadata": {
      "email": "test@example.com",
      "priority": "high"
    }
  }' | jq .

# Test 4: Send batch notifications
echo -e "\n4. Sending batch notifications..."
curl -s -X POST "$BASE_URL/api/notifications/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": [
      {
        "userId": "user-001",
        "type": "email",
        "title": "Email Notification",
        "message": "Welcome to our service"
      },
      {
        "userId": "user-002",
        "type": "sms",
        "title": "SMS Notification",
        "message": "Your verification code is 123456"
      },
      {
        "userId": "user-003",
        "type": "push",
        "title": "Push Notification",
        "message": "You have a new message"
      }
    ]
  }' | jq .

echo -e "\n================================="
echo "All tests completed!"
