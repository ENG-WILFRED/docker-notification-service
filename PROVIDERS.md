# Multi-Provider Email & SMS System

## Overview

The notification service now supports **5 providers each** for Email and SMS with automatic fallback. If the primary provider fails, the system automatically tries the next provider in the list.

## Email Providers

### 1. Gmail/Google Workspace
Send emails using Gmail SMTP over HTTP API.

**Environment Variables:**
```env
EMAIL_PROVIDER=gmail
GMAIL_FROM=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

**Setup:**
- Generate an [App Password](https://support.google.com/accounts/answer/185833) in Google Account
- Use the 16-character password in `GMAIL_APP_PASSWORD`

### 2. SendGrid
Professional email delivery service.

**Environment Variables:**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM=noreply@yourdomain.com
```

**Setup:**
- Create account at [SendGrid](https://sendgrid.com)
- Generate API key with Mail Send permissions
- Verify sender domain

### 3. Mailgun
Email delivery for developers.

**Environment Variables:**
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxx...
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM=noreply@yourdomain.com
```

**Setup:**
- Create account at [Mailgun](https://www.mailgun.com)
- Verify your domain
- Generate API key

### 4. AWS SES (Simple Email Service)
AWS email service for large-scale sending.

**Environment Variables:**
```env
EMAIL_PROVIDER=ses
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=us-east-1
SES_FROM=noreply@yourdomain.com
```

**Setup:**
- Create AWS IAM user with SES permissions
- Verify sender email in SES console
- Request production access (if needed)

### 5. Postmark
Transactional email service with excellent deliverability.

**Environment Variables:**
```env
EMAIL_PROVIDER=postmark
POSTMARK_SERVER_TOKEN=xxx...
POSTMARK_FROM=noreply@yourdomain.com
```

**Setup:**
- Create account at [Postmark](https://postmarkapp.com)
- Create a server and get the token
- Verify sender domain

## SMS Providers

### 1. Twilio
Global SMS delivery service.

**Environment Variables:**
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_FROM_NUMBER=+1234567890
```

**Setup:**
- Create account at [Twilio](https://www.twilio.com)
- Get Account SID and Auth Token
- Configure a phone number as sender

### 2. AWS SNS (Simple Notification Service)
AWS SMS service.

**Environment Variables:**
```env
SMS_PROVIDER=sns
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=us-east-1
```

**Setup:**
- Create AWS IAM user with SNS permissions
- Enable SMS in SNS settings

### 3. Nexmo/Vonage
Telecom company with global SMS coverage.

**Environment Variables:**
```env
SMS_PROVIDER=nexmo
NEXMO_API_KEY=xxx...
NEXMO_API_SECRET=xxx...
NEXMO_FROM=SenderId
```

**Setup:**
- Create account at [Vonage/Nexmo](https://www.vonage.com)
- Get API key and secret
- Configure sender ID

### 4. Africa's Talking
SMS service for African markets.

**Environment Variables:**
```env
SMS_PROVIDER=africastalking
AFRICASTALKING_API_KEY=xxx...
AFRICASTALKING_USERNAME=xxx
AFRICASTALKING_URL=https://api.africastalking.com/version1/messaging/bulk
```

**Setup:**
- Create account at [Africa's Talking](https://africastalking.com)
- Get API key
- Configure username

### 5. Clickatell
Global SMS delivery platform.

**Environment Variables:**
```env
SMS_PROVIDER=clickatell
CLICKATELL_API_KEY=xxx...
```

**Setup:**
- Create account at [Clickatell](https://www.clickatell.com)
- Generate HTTP API key

## Fallback Configuration

### Email Fallback Providers

Set multiple providers to try in order. If primary fails, next one is used.

```env
EMAIL_PROVIDER=sendgrid
EMAIL_FALLBACK_PROVIDERS=mailgun,postmark,gmail

# Then configure all providers
SENDGRID_API_KEY=xxx...
SENDGRID_FROM=xxx...
MAILGUN_API_KEY=xxx...
MAILGUN_DOMAIN=xxx...
MAILGUN_FROM=xxx...
POSTMARK_SERVER_TOKEN=xxx...
POSTMARK_FROM=xxx...
GMAIL_FROM=xxx...
GMAIL_APP_PASSWORD=xxx...
```

### SMS Fallback Providers

```env
SMS_PROVIDER=twilio
SMS_FALLBACK_PROVIDERS=nexmo,sns,africastalking

# Then configure all providers
TWILIO_ACCOUNT_SID=xxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_FROM_NUMBER=xxx...
NEXMO_API_KEY=xxx...
NEXMO_API_SECRET=xxx...
NEXMO_FROM=xxx...
AWS_ACCESS_KEY_ID=xxx...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=us-east-1
AFRICASTALKING_API_KEY=xxx...
AFRICASTALKING_USERNAME=xxx...
```

## How It Works

### Email Sending Flow

```
1. User sends notification request
   ↓
2. Email Orchestrator selects primary provider (SendGrid)
   ↓
3. Try SendGrid
   ├─ Success? → Send, return
   └─ Failure? → Log error, try fallback
   ↓
4. Try Mailgun
   ├─ Success? → Send, return
   └─ Failure? → Log error, try fallback
   ↓
5. Try Postmark
   ├─ Success? → Send, return
   └─ Failure? → Log error, all failed
   ↓
6. All providers failed → Error response
```

### SMS Sending Flow

Same as email, but with SMS providers (Twilio → Nexmo → SNS → Africa's Talking → Clickatell)

## Logging

Each attempt is logged with detailed information:

```
[EMAIL] Attempting send via SendGrid (1/3) - Logs provider attempt
[EMAIL] SendGrid failed: Connection timeout - Logs failure reason
[EMAIL] Attempting send via Mailgun (2/3) - Tries next provider
[EMAIL] ✓ Mailgun sent to user@example.com - Success logged
```

Error logs include:
- Provider name
- Attempt number / Total attempts
- Failure reason
- List of all configured providers

## Example Configuration

### `.env` for Production Setup

```env
# Primary: SendGrid, Fallback: Mailgun, then Postmark
EMAIL_PROVIDER=sendgrid
EMAIL_FALLBACK_PROVIDERS=mailgun,postmark

SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM=noreply@company.com

MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.company.com
MAILGUN_FROM=noreply@company.com

POSTMARK_SERVER_TOKEN=xxxxxxxxxxxxx
POSTMARK_FROM=noreply@company.com

# Primary: Twilio, Fallback: Nexmo, then AWS SNS
SMS_PROVIDER=twilio
SMS_FALLBACK_PROVIDERS=nexmo,sns

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+1234567890

NEXMO_API_KEY=xxxxxxxxxxxxx
NEXMO_API_SECRET=xxxxxxxxxxxxx
NEXMO_FROM=Company

AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## Cost Optimization Tips

1. **SendGrid + Mailgun**: Complementary pricing, good global coverage
2. **AWS (SES + SNS)**: Cheapest at scale if you use AWS
3. **Twilio + Nexmo**: Best SMS coverage internationally
4. **Regional**: Use regional providers as fallbacks (Africa's Talking for Africa)

## Error Handling

If all providers fail:
- Request returns HTTP 500 with error details
- Failed notification is added to Redis retry queue
- System attempts retry at 2, 4, and 5 minutes
- Detailed logs show which providers were tried

## Testing Providers

Use the `/api/notifications` endpoint to test:

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "type": "email",
    "title": "Test Email",
    "message": "This is a test",
    "connectionKey": "sendgrid"
  }'
```

Monitor logs to see which provider is used and any fallbacks triggered.
