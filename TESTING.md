# Testing Guide

This guide helps you test your WhatsApp bot integration.

## Testing Meta Business API

### Prerequisites
- Completed Meta API setup (see DEPLOYMENT.md)
- Valid access token and phone number ID
- Test phone number added to your Meta app (for testing phase)

### Step 1: Validate Configuration

Run the configuration test script:

```bash
npm run test:meta
```

This will verify:
- ✅ All environment variables are set
- ✅ Access token is valid
- ✅ Phone number ID is correct
- ✅ Webhook signature verification works
- ✅ Verify token is strong enough

Expected output:
```
🧪 Meta WhatsApp Business API Configuration Test

Test 1: Checking configuration...
✅ All required environment variables are set

Test 2: Verifying access token...
✅ Access token is valid
   Phone Number: +1234567890
   Verified Name: My Business
   Quality Rating: GREEN

Test 3: Testing webhook signature verification...
✅ Webhook signature verification is working

Test 4: Checking webhook verify token...
✅ Webhook verify token is set (length: 64 chars)

═══════════════════════════════════════
Test Results:
═══════════════════════════════════════
Configuration:           ✅ PASS
Access Token:            ✅ PASS
Signature Verification:  ✅ PASS
Verify Token:            ✅ PASS
═══════════════════════════════════════

🎉 All tests passed! Your Meta API configuration is ready.
```

### Step 2: Start the Bot

```bash
# For development
npm run dev

# For production
npm run build
npm start
```

### Step 3: Set Up HTTPS Tunnel (for local testing)

In a separate terminal:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 4: Configure Webhook in Meta

1. Go to [Meta Developers Console](https://developers.facebook.com/)
2. Select your app
3. Navigate to **WhatsApp** → **Configuration**
4. Click **Edit** under Webhook
5. Enter:
   - **Callback URL**: `https://abc123.ngrok.io/webhook` (your ngrok URL + /webhook)
   - **Verify Token**: Your `META_VERIFY_TOKEN` from .env
6. Click **Verify and Save**
7. Subscribe to `messages` field

Expected: ✅ Webhook verified successfully

### Step 5: Send Test Message

From a phone number added to your Meta app's test users:

1. Open WhatsApp
2. Send a message to your WhatsApp Business number
3. Check bot logs for incoming message

Expected bot logs:
```
📨 New message from 1234567890:
   Hello bot!
✓ Message processed successfully
```

### Step 6: Verify Auto-Reply

Expected: Bot sends welcome message back to you

### Step 7: Check Salesforce Integration

1. Check RabbitMQ queue: http://localhost:15672
2. Verify contact created in Salesforce
3. Check Salesforce worker logs

## Testing WhatsApp Web

### Step 1: Start the Bot

```bash
npm run dev
```

### Step 2: Scan QR Code

1. QR code appears in terminal
2. Open WhatsApp on phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code

Expected:
```
WhatsApp client is ready!
✓ Messaging service initialized
```

### Step 3: Send Test Message

Send "Hello" to your bot's WhatsApp number

Expected logs:
```
📨 New message from 1234567890:
   Hello
✓ Message processed successfully
```

Expected reply: Bot sends welcome message

## Common Test Scenarios

### Scenario 1: First-time Contact

1. Send message from new number
2. Expected:
   - ✅ Contact created in local repository
   - ✅ Contact queued for Salesforce creation
   - ✅ Conversation created
   - ✅ Auto-reply sent
   - ✅ Contact appears in Salesforce (async)

### Scenario 2: Existing Contact

1. Send another message from same number
2. Expected:
   - ✅ Existing contact found
   - ✅ Message added to conversation
   - ✅ Auto-reply sent
   - ✅ No duplicate contact in Salesforce

### Scenario 3: Case Comment

1. Create a Salesforce Case for the contact
2. Link Case ID to conversation
3. Send another message
4. Expected:
   - ✅ Message added as Case comment in Salesforce (async)

## Troubleshooting Tests

### Webhook Verification Fails

**Check:**
- ✅ Bot is running and accessible
- ✅ `META_VERIFY_TOKEN` in .env matches webhook config
- ✅ Webhook URL is correct (include `/webhook` path)
- ✅ HTTPS is working (test with: `curl https://your-url/webhook`)

**Test webhook manually:**
```bash
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Expected: `test123` (the challenge value)

### Signature Verification Fails

**Check:**
- ✅ `META_APP_SECRET` is correct
- ✅ Not using access token instead of app secret
- ✅ Body parser middleware is before webhook route

**Test:**
```bash
npm run test:meta
```

Should show: ✅ Webhook signature verification is working

### Messages Not Arriving

**Check:**
- ✅ Webhook subscribed to "messages" field
- ✅ Test phone number added to app (during testing phase)
- ✅ Bot logs show incoming webhook requests
- ✅ No errors in webhook POST handler

**Debug:**
1. Check ngrok web interface: http://127.0.0.1:4040
2. View incoming webhook requests
3. Check request/response details

### Access Token Invalid

**Symptoms:**
```
Error: Invalid OAuth access token
```

**Solutions:**
- ✅ Generate new permanent token from System Users
- ✅ Temporary tokens expire after 24 hours
- ✅ Check token hasn't been revoked
- ✅ Verify phone number ID matches token

**Test:**
```bash
curl -X GET \
  "https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### RabbitMQ Not Working

**Check:**
- ✅ RabbitMQ is running: `docker ps | grep rabbitmq`
- ✅ Port 5672 is accessible
- ✅ Correct RABBITMQ_URL in .env

**Test:**
```bash
# Check RabbitMQ status
docker logs rabbitmq

# Access management UI
open http://localhost:15672
```

## Performance Testing

### Load Test Message Processing

Use a tool like Apache Bench or k6:

```bash
# Test webhook endpoint
k6 run test-webhook-load.js
```

Monitor:
- Response times
- RabbitMQ queue depth
- Memory usage
- CPU usage

### Measure Response Time

Check logs for processing times:
```
📨 New message from 1234567890:
   Hello
✓ Message processed successfully (45ms)
```

Target: < 100ms for message processing

## Integration Testing

### Test Complete Flow

```javascript
// test-integration.js
const axios = require('axios');

async function testCompleteFlow() {
  // 1. Send message via Meta API
  // 2. Wait for webhook to process
  // 3. Check auto-reply sent
  // 4. Verify RabbitMQ queue has job
  // 5. Wait for Salesforce sync
  // 6. Verify contact in Salesforce
  
  console.log('✅ Complete flow test passed');
}
```

## Security Testing

### Test Webhook Security

1. ❌ Try without signature header
   - Expected: 403 Forbidden

2. ❌ Try with invalid signature
   - Expected: 403 Forbidden

3. ❌ Try with invalid verify token
   - Expected: 403 Forbidden

4. ✅ Try with valid signature and token
   - Expected: 200 OK

### Test Rate Limiting

Send multiple rapid requests and verify:
- Rate limits enforced
- Proper error responses
- No service degradation

## Monitoring in Production

Set up alerts for:
- ⚠️ Webhook endpoint downtime
- ⚠️ High error rates (> 1%)
- ⚠️ RabbitMQ queue depth (> 1000)
- ⚠️ Slow response times (> 500ms)
- ⚠️ Failed Salesforce syncs

Tools:
- Uptime Robot (webhook monitoring)
- New Relic (APM)
- Sentry (error tracking)
- Prometheus + Grafana (metrics)

## Useful Commands

```bash
# Check bot status
ps aux | grep node

# View logs
tail -f logs/bot.log

# Check RabbitMQ queue
docker exec rabbitmq rabbitmqctl list_queues

# Test Meta API directly
curl -X POST https://graph.facebook.com/v21.0/$PHONE_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"1234567890","type":"text","text":{"body":"Test"}}'

# Validate webhook signature
node -e "const crypto = require('crypto'); console.log('sha256=' + crypto.createHmac('sha256', process.env.META_APP_SECRET).update('test').digest('hex'));"
```

## Next Steps

Once all tests pass:
1. ✅ Deploy to production environment
2. ✅ Set up proper monitoring
3. ✅ Configure backup and disaster recovery
4. ✅ Document runbook procedures
5. ✅ Train team on troubleshooting

---

**Happy Testing! 🧪**
