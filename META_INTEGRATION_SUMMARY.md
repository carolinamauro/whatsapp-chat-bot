# Meta Business API Integration - Implementation Summary

## Overview

This document provides a comprehensive summary of the Meta (Facebook) Business API integration for the WhatsApp chatbot. The implementation enables production-grade WhatsApp messaging using Meta's official Graph API.

## What Was Implemented

### 1. Dual Adapter Architecture

The bot now supports TWO WhatsApp integration methods:

#### **Option A: Meta Business API** (Production)
- Official Meta Graph API integration
- Webhook-based message receiving
- REST API for message sending
- Production-ready and scalable
- No QR code required
- Requires HTTPS endpoint

#### **Option B: WhatsApp Web** (Development)
- Browser automation approach
- QR code authentication
- Good for development/testing
- Existing implementation preserved

Users can switch between adapters using the `WHATSAPP_ADAPTER` environment variable.

### 2. Core Components Added

#### MetaWhatsAppAdapter (`src/infrastructure/adapters/MetaWhatsAppAdapter.ts`)

A complete implementation of the `MessagingService` interface for Meta's API:

**Features:**
- ✅ Express.js webhook server for receiving messages
- ✅ GET endpoint for webhook verification
- ✅ POST endpoint for message events
- ✅ HMAC SHA256 signature verification for security
- ✅ Message sending via Graph API
- ✅ Phone number formatting (E.164 support)
- ✅ Error handling and logging
- ✅ Graceful shutdown support

**Key Methods:**
- `initialize()` - Starts webhook server
- `sendMessage()` - Sends messages via Graph API
- `onMessageReceived()` - Registers message handler
- `verifyWebhookSignature()` - Validates webhook authenticity
- `processIncomingMessages()` - Processes Meta webhook events
- `shutdown()` - Closes webhook server

#### Configuration Updates (`src/infrastructure/config/index.ts`)

Added Meta API configuration:
```typescript
meta: {
  accessToken: string;      // Meta Graph API access token
  phoneNumberId: string;    // WhatsApp Business phone number ID
  verifyToken: string;      // Custom webhook verification token
  appSecret: string;        // App secret for signature verification
  webhookPort: number;      // Webhook server port (default: 3000)
  webhookPath: string;      // Webhook endpoint path (default: /webhook)
}
```

Added validation for Meta-specific environment variables when `WHATSAPP_ADAPTER=meta-api`.

#### Main Entry Point Updates (`src/index.ts`)

- Dynamic adapter selection based on configuration
- Support for both WhatsApp Web and Meta API adapters
- Graceful shutdown handling for webhook server
- Enhanced logging with adapter-specific information

### 3. Dependencies Added

```json
{
  "express": "^4.18.2",    // Webhook HTTP server
  "axios": "^1.12.0"       // HTTP client for Graph API (secure version)
}
```

Dev dependencies:
```json
{
  "@types/express": "^4.17.21"
}
```

### 4. Documentation

#### DEPLOYMENT.md (New)
Comprehensive deployment guide covering:
- Step-by-step Meta API setup
- HTTPS configuration (ngrok, Let's Encrypt, Cloudflare)
- Webhook configuration
- Environment setup
- Multiple deployment options (Heroku, AWS, Docker, VPS)
- Security best practices
- Production checklist
- Troubleshooting guide

#### TESTING.md (New)
Complete testing documentation:
- Configuration validation
- Webhook testing
- Message flow testing
- Security testing
- Integration testing
- Performance testing
- Monitoring setup

#### test-meta-api.js (New)
Automated validation script that checks:
- Environment variables
- Access token validity
- Webhook signature verification
- Security token strength

Run with: `npm run test:meta`

#### Updated Documentation
- **README.md**: Added Meta API features and dual adapter explanation
- **QUICKSTART.md**: Added Meta API quick start instructions
- **.env.example**: Added Meta API environment variables

### 5. Security Enhancements

#### Webhook Signature Verification
- Implements HMAC SHA256 signature validation
- Protects against unauthorized webhook calls
- Timing-safe comparison to prevent timing attacks

```typescript
const expectedSignature = crypto
  .createHmac('sha256', appSecret)
  .update(JSON.stringify(requestBody))
  .digest('hex');

// Timing-safe comparison
crypto.timingSafeEqual(providedHash, expectedHash);
```

#### Dependency Security
- Updated axios from 1.6.2 → 1.12.0
- Fixes multiple security vulnerabilities:
  - DoS attack prevention
  - SSRF protection
  - Credential leakage prevention

### 6. Architecture Integration

The Meta adapter seamlessly integrates with the existing hexagonal architecture:

```
┌─────────────────────────────────────┐
│        Application Layer            │
│  ┌───────────────────────────────┐  │
│  │ HandleIncomingMessageUseCase  │  │
│  │ SendMessageUseCase            │  │
│  └───────────────────────────────┘  │
└──────────┬──────────────────────────┘
           │
           │ MessagingService Interface
           │
┌──────────▼──────────────────────────┐
│     Infrastructure Layer            │
│  ┌──────────────┬────────────────┐  │
│  │ WhatsAppWeb  │ MetaWhatsApp   │  │
│  │ Adapter      │ Adapter (NEW)  │  │
│  └──────────────┴────────────────┘  │
└─────────────────────────────────────┘
           │                │
           ▼                ▼
      WhatsApp Web    Meta Graph API
```

## Configuration Guide

### Environment Variables

```env
# Choose adapter
WHATSAPP_ADAPTER=meta-api  # or whatsapp-web

# Meta Business API (required when WHATSAPP_ADAPTER=meta-api)
META_ACCESS_TOKEN=your_permanent_access_token
META_PHONE_NUMBER_ID=123456789012345
META_VERIFY_TOKEN=your_secure_random_token
META_APP_SECRET=your_app_secret
META_WEBHOOK_PORT=3000
META_WEBHOOK_PATH=/webhook
```

### Getting Meta Credentials

1. **Access Token**: Meta Developers Console → WhatsApp → API Setup
2. **Phone Number ID**: Listed under test phone number
3. **Verify Token**: Create your own (use: `openssl rand -hex 32`)
4. **App Secret**: Settings → Basic → App Secret

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Usage

### Starting the Bot

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The bot automatically uses the adapter specified in `WHATSAPP_ADAPTER`.

### Testing Configuration

```bash
npm run test:meta
```

Expected output:
```
🎉 All tests passed! Your Meta API configuration is ready.
```

### Local Development with ngrok

```bash
# Terminal 1: Start bot
npm run dev

# Terminal 2: Create HTTPS tunnel
ngrok http 3000

# Use the ngrok HTTPS URL in Meta webhook configuration
```

## Message Flow

### Incoming Message (Meta API)

1. User sends WhatsApp message
2. Meta sends webhook POST to bot
3. Bot verifies signature
4. Bot converts webhook payload to domain `Message`
5. `HandleIncomingMessageUseCase` processes message
6. Auto-reply logic executes
7. Bot sends response via Graph API
8. Salesforce operations queued to RabbitMQ (async)

### Sending Message (Meta API)

```typescript
// Via Graph API
POST https://graph.facebook.com/v21.0/{phone_number_id}/messages
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
  {
    "messaging_product": "whatsapp",
    "to": "1234567890",
    "type": "text",
    "text": { "body": "Hello!" }
  }
```

## API Endpoints

### Webhook Verification (GET)

```
GET /webhook?hub.mode=subscribe&hub.verify_token={token}&hub.challenge={challenge}
```

Response: Returns challenge value if token matches

### Webhook Events (POST)

```
POST /webhook
Headers:
  x-hub-signature-256: sha256={signature}
Body: Meta webhook event payload
```

Response: 200 OK if valid, 403 if signature invalid

## Security Considerations

### Implemented Protections

1. **Webhook Signature Verification**
   - All incoming webhooks validated
   - HMAC SHA256 with app secret
   - Timing-safe comparison

2. **Environment Variable Security**
   - Credentials stored in .env (gitignored)
   - Validation on startup
   - Clear error messages for missing config

3. **Dependency Security**
   - Updated vulnerable packages
   - Regular security audits recommended

### Best Practices

- Use permanent access tokens in production
- Rotate tokens every 90 days
- Enable HTTPS (required by Meta)
- Implement rate limiting
- Monitor for suspicious activity
- Keep dependencies updated

## Deployment Checklist

- [ ] Meta Business Account created
- [ ] WhatsApp Business API access granted
- [ ] App created in Meta Developers
- [ ] Phone number added and verified
- [ ] Permanent access token generated
- [ ] All environment variables configured
- [ ] HTTPS endpoint configured
- [ ] Webhook verified in Meta console
- [ ] Test message sent successfully
- [ ] RabbitMQ configured and running
- [ ] Salesforce integration working
- [ ] Monitoring and alerts set up
- [ ] Production checklist completed (see DEPLOYMENT.md)

## Troubleshooting

### Common Issues

**Webhook Verification Fails**
- Check `META_VERIFY_TOKEN` matches Meta console
- Ensure bot is running and accessible
- Test webhook URL with curl

**Messages Not Arriving**
- Verify webhook subscribed to "messages" field
- Check webhook signature validation
- Review bot logs for errors
- Test with ngrok web inspector (http://127.0.0.1:4040)

**Cannot Send Messages**
- Verify access token is valid
- Check phone number ID is correct
- Ensure phone number format is correct (E.164)
- Review Graph API error response

**Signature Verification Fails**
- Confirm using App Secret (not Access Token)
- Check body hasn't been modified before verification
- Verify express.json() middleware is configured

See [TESTING.md](TESTING.md) for detailed troubleshooting.

## Files Modified/Added

### New Files
- `src/infrastructure/adapters/MetaWhatsAppAdapter.ts` - Meta API adapter
- `DEPLOYMENT.md` - Deployment guide
- `TESTING.md` - Testing guide
- `test-meta-api.js` - Configuration validation script

### Modified Files
- `.env.example` - Added Meta API variables
- `package.json` - Added dependencies and test script
- `src/index.ts` - Added adapter selection logic
- `src/infrastructure/config/index.ts` - Added Meta config and validation
- `src/infrastructure/adapters/index.ts` - Export new adapter
- `README.md` - Added Meta API documentation
- `QUICKSTART.md` - Added Meta API quick start

## Testing

### Automated Tests
```bash
npm run test:meta  # Validate Meta API configuration
npm test           # Run unit tests (if implemented)
npm run lint       # Check code style
npm run build      # Verify TypeScript compilation
```

### Manual Testing
1. Configure Meta API credentials
2. Run configuration validator
3. Start bot with Meta adapter
4. Set up ngrok tunnel
5. Configure webhook in Meta
6. Send test message
7. Verify auto-reply
8. Check Salesforce sync

See [TESTING.md](TESTING.md) for detailed procedures.

## Future Enhancements

Potential improvements:
- Support for media messages (images, videos, documents)
- Message templates support
- Read receipts tracking
- Typing indicators
- Interactive messages (buttons, lists)
- Message reactions
- WhatsApp Business profile management
- Analytics and metrics dashboard

## Support Resources

- [Meta WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- Repository Issues: Create an issue for bugs/questions

## Conclusion

The Meta Business API integration provides a production-ready, scalable solution for WhatsApp messaging. The implementation:

✅ Maintains hexagonal architecture principles
✅ Provides clean separation of concerns
✅ Supports both development and production use cases
✅ Includes comprehensive documentation
✅ Implements security best practices
✅ Offers easy deployment options

The bot can now be deployed to production environments with confidence, providing reliable WhatsApp messaging capabilities backed by Meta's official API.

---

**Ready for Production! 🚀**
