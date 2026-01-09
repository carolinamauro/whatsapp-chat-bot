# WhatsApp Bot Deployment Guide

This guide covers deployment options for the WhatsApp Salesforce chatbot, including both WhatsApp Web and Meta Business API approaches.

## Table of Contents

1. [Choosing an Adapter](#choosing-an-adapter)
2. [Meta Business API Setup](#meta-business-api-setup)
3. [WhatsApp Web Setup](#whatsapp-web-setup)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Options](#deployment-options)
6. [HTTPS Setup](#https-setup)
7. [Webhook Configuration](#webhook-configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Choosing an Adapter

The bot supports two WhatsApp adapters:

### Meta Business API (Recommended for Production)
- ✅ Official Meta API
- ✅ Production-ready and scalable
- ✅ No QR code scanning required
- ✅ Better reliability and uptime
- ✅ Official support from Meta
- ⚠️ Requires Meta Business verification
- ⚠️ Requires HTTPS webhook endpoint

### WhatsApp Web (Good for Development)
- ✅ Easy to set up
- ✅ Good for testing and development
- ✅ No Meta business account needed
- ⚠️ Requires QR code scanning
- ⚠️ Less reliable (depends on phone connection)
- ⚠️ Not officially supported by WhatsApp

Set the adapter in your `.env` file:
```env
WHATSAPP_ADAPTER=meta-api  # or whatsapp-web
```

## Meta Business API Setup

### Prerequisites

1. **Meta Business Account**: Create at https://business.facebook.com
2. **WhatsApp Business Account**: Set up through Meta Business Suite
3. **Phone Number**: A phone number that can receive SMS/calls for verification
4. **HTTPS Endpoint**: Required for webhooks (see [HTTPS Setup](#https-setup))

### Step 1: Create a Meta App

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** as app type
4. Fill in app details:
   - **App Name**: Your bot name
   - **App Contact Email**: Your email
   - **Business Account**: Select your business account
5. Click **Create App**

### Step 2: Add WhatsApp Product

1. In your app dashboard, find **WhatsApp** in the products list
2. Click **Set Up** to add WhatsApp to your app
3. Select or create a **WhatsApp Business Account**
4. Choose a **phone number** (or use a test number provided by Meta)

### Step 3: Get Your Credentials

1. **Access Token**:
   - Go to **WhatsApp** → **API Setup**
   - Copy the temporary access token
   - For production, generate a permanent token from **System Users** settings

2. **Phone Number ID**:
   - In **WhatsApp** → **API Setup**
   - Find **Phone Number ID** below your test number
   - Copy this value

3. **App Secret**:
   - Go to **Settings** → **Basic**
   - Click **Show** next to **App Secret**
   - Copy this value

4. **Verify Token**:
   - Create a random secure string (e.g., using `openssl rand -hex 32`)
   - This is a custom token you create for webhook verification

### Step 4: Configure Webhooks

1. In your app, go to **WhatsApp** → **Configuration**
2. Under **Webhook**, click **Edit**
3. Enter your webhook details:
   - **Callback URL**: `https://your-domain.com/webhook`
   - **Verify Token**: The token you created in Step 3
4. Click **Verify and Save**
5. Subscribe to webhook fields:
   - Check **messages** field
   - Click **Subscribe**

### Step 5: Configure Environment Variables

Update your `.env` file:

```env
# WhatsApp Adapter Selection
WHATSAPP_ADAPTER=meta-api

# Meta Business API Configuration
META_ACCESS_TOKEN=your_permanent_access_token
META_PHONE_NUMBER_ID=your_phone_number_id
META_VERIFY_TOKEN=your_custom_verify_token
META_APP_SECRET=your_app_secret
META_WEBHOOK_PORT=3000
META_WEBHOOK_PATH=/webhook
```

## WhatsApp Web Setup

### Prerequisites

1. Node.js 18+
2. A WhatsApp account on your phone
3. Chrome/Chromium installed (for Puppeteer)

### Setup Steps

1. Set adapter in `.env`:
```env
WHATSAPP_ADAPTER=whatsapp-web
```

2. Start the bot:
```bash
npm run dev
```

3. Scan the QR code:
   - Open WhatsApp on your phone
   - Go to **Settings** → **Linked Devices** → **Link a Device**
   - Scan the QR code shown in terminal

4. Wait for connection confirmation

## Environment Configuration

Complete `.env` file example:

```env
# Salesforce Configuration
SALESFORCE_USERNAME=your-salesforce-username
SALESFORCE_PASSWORD=your-salesforce-password
SALESFORCE_SECURITY_TOKEN=your-security-token
SALESFORCE_LOGIN_URL=https://login.salesforce.com

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE_NAME=salesforce-operations

# Bot Configuration
BOT_NAME=WhatsApp Bot
BOT_WELCOME_MESSAGE=Hello! I'm your Salesforce assistant. How can I help you today?

# WhatsApp Adapter Selection
WHATSAPP_ADAPTER=meta-api

# Meta Business API Configuration (only needed if WHATSAPP_ADAPTER=meta-api)
META_ACCESS_TOKEN=your-meta-access-token
META_PHONE_NUMBER_ID=123456789012345
META_VERIFY_TOKEN=your-secure-random-token
META_APP_SECRET=your-app-secret
META_WEBHOOK_PORT=3000
META_WEBHOOK_PATH=/webhook

# Environment
NODE_ENV=production
```

## Deployment Options

### Option 1: Cloud Platform (Recommended)

#### Heroku

1. Install Heroku CLI
2. Create app:
```bash
heroku create your-bot-name
```

3. Add CloudAMQP addon for RabbitMQ:
```bash
heroku addons:create cloudamqp:lemur
```

4. Set environment variables:
```bash
heroku config:set WHATSAPP_ADAPTER=meta-api
heroku config:set META_ACCESS_TOKEN=your_token
heroku config:set META_PHONE_NUMBER_ID=your_id
# ... set other variables
```

5. Deploy:
```bash
git push heroku main
```

#### AWS/Azure/GCP

1. Set up a VM instance
2. Install Node.js and dependencies
3. Clone repository
4. Configure environment variables
5. Set up process manager (PM2):
```bash
npm install -g pm2
pm2 start dist/index.js --name whatsapp-bot
pm2 startup
pm2 save
```

### Option 2: Docker

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

2. Build and run:
```bash
docker build -t whatsapp-bot .
docker run -d --env-file .env -p 3000:3000 whatsapp-bot
```

### Option 3: VPS (Digital Ocean, Linode, etc.)

1. SSH into your server
2. Install Node.js 18+
3. Clone repository
4. Install dependencies: `npm install`
5. Build: `npm run build`
6. Set up HTTPS (see below)
7. Use PM2 to manage process:
```bash
pm2 start dist/index.js --name whatsapp-bot
```

## HTTPS Setup

Meta requires HTTPS for webhooks. Here are your options:

### Option 1: ngrok (Development/Testing)

1. Install ngrok: https://ngrok.com/download
2. Start your bot locally
3. Create tunnel:
```bash
ngrok http 3000
```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Use this URL in Meta webhook configuration: `https://abc123.ngrok.io/webhook`

### Option 2: Let's Encrypt with Nginx (Production)

1. Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

3. Configure Nginx (`/etc/nginx/sites-available/whatsapp-bot`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

4. Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

### Option 3: Cloudflare (Easy HTTPS)

1. Point your domain to Cloudflare nameservers
2. Enable SSL/TLS in Cloudflare dashboard
3. Set SSL mode to "Full" or "Full (strict)"
4. Deploy your bot to any server
5. Use your Cloudflare-protected domain in webhook configuration

## Webhook Configuration

### Setting Up the Webhook in Meta

1. Go to your app in Meta Developer Console
2. Navigate to **WhatsApp** → **Configuration**
3. Under **Webhook**, click **Edit**
4. Enter:
   - **Callback URL**: Your HTTPS URL + webhook path (e.g., `https://your-domain.com/webhook`)
   - **Verify Token**: The token you set in `META_VERIFY_TOKEN`
5. Click **Verify and Save**

### Webhook Events to Subscribe

After verification, subscribe to these fields:
- ✅ **messages**: Receive incoming messages
- ✅ **message_status** (optional): Get delivery/read status updates

### Testing Webhook Locally

Use ngrok for local testing:

1. Start bot: `npm run dev`
2. In another terminal: `ngrok http 3000`
3. Copy ngrok HTTPS URL
4. Configure webhook in Meta with ngrok URL
5. Send a test message to your WhatsApp business number

## Testing

### Test Webhook Verification

```bash
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=CHALLENGE_STRING"
```

Expected: Returns the challenge string

### Test Message Sending

Create a test script (`test-send.ts`):

```typescript
import axios from 'axios';

const ACCESS_TOKEN = 'your_token';
const PHONE_NUMBER_ID = 'your_id';
const TO = '1234567890'; // Recipient's phone number

async function sendTestMessage() {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: TO,
        type: 'text',
        text: { body: 'Test message from bot' },
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Message sent:', response.data);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

sendTestMessage();
```

### End-to-End Test

1. Start your bot
2. Send a message to your WhatsApp Business number
3. Check bot logs for incoming message
4. Verify auto-reply is sent
5. Check RabbitMQ queue for Salesforce operations
6. Verify contact created in Salesforce

## Troubleshooting

### Webhook Verification Fails

**Problem**: Meta shows "Webhook verification failed"

**Solutions**:
- ✅ Verify `META_VERIFY_TOKEN` matches exactly (case-sensitive)
- ✅ Check webhook URL is accessible via HTTPS
- ✅ Check bot is running and listening on correct port
- ✅ Check firewall allows incoming connections
- ✅ Test webhook locally: `curl -X GET "https://your-url/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"`

### Signature Verification Fails

**Problem**: Logs show "Invalid webhook signature"

**Solutions**:
- ✅ Verify `META_APP_SECRET` is correct
- ✅ Ensure you're using the App Secret, not Access Token
- ✅ Check body-parser middleware is properly configured
- ✅ Don't modify request body before verification

### Messages Not Received

**Problem**: Messages sent to bot don't arrive

**Solutions**:
- ✅ Check webhook is subscribed to "messages" field
- ✅ Verify webhook URL is correct in Meta console
- ✅ Check server logs for incoming webhook requests
- ✅ Test webhook directly with curl
- ✅ Verify phone number is not blocked/banned

### Messages Not Sending

**Problem**: Bot can't send messages

**Solutions**:
- ✅ Check `META_ACCESS_TOKEN` is valid and not expired
- ✅ Verify `META_PHONE_NUMBER_ID` is correct
- ✅ Ensure phone number format is correct (E.164 format)
- ✅ Check Meta API rate limits
- ✅ Verify WhatsApp Business account is active

### SSL/HTTPS Issues

**Problem**: Can't set up HTTPS

**Solutions**:
- ✅ Use ngrok for development/testing
- ✅ Verify DNS points to your server
- ✅ Check port 80/443 are open
- ✅ Review Nginx/Apache logs
- ✅ Use Cloudflare for easy SSL

### Rate Limiting

**Problem**: Getting rate limit errors

**Solutions**:
- ✅ Implement exponential backoff
- ✅ Add request queuing
- ✅ Monitor Meta API rate limits
- ✅ Upgrade to higher tier if needed
- ✅ Cache responses when possible

### Port Already in Use

**Problem**: `EADDRINUSE` error

**Solutions**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
META_WEBHOOK_PORT=3001
```

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use permanent access tokens** in production (not temporary ones)
3. **Enable webhook signature verification** (always on by default)
4. **Use HTTPS** for all webhook endpoints
5. **Rotate tokens regularly** (every 90 days recommended)
6. **Implement rate limiting** on your webhook endpoint
7. **Monitor for suspicious activity**
8. **Keep dependencies updated**: `npm audit fix`
9. **Use environment-specific configs** (dev, staging, prod)
10. **Set up monitoring and alerting**

## Monitoring

Set up monitoring for:
- ✅ Webhook uptime
- ✅ Message delivery rate
- ✅ API error rates
- ✅ RabbitMQ queue depth
- ✅ Salesforce sync status
- ✅ Server resource usage

Recommended tools:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Application monitoring**: New Relic, DataDog
- **Logs**: LogDNA, Papertrail
- **Errors**: Sentry, Rollbar

## Production Checklist

Before going live:

- [ ] Set `NODE_ENV=production`
- [ ] Use permanent Meta access token
- [ ] Configure HTTPS properly
- [ ] Set up webhook verification
- [ ] Enable signature verification
- [ ] Configure proper logging
- [ ] Set up monitoring and alerts
- [ ] Configure RabbitMQ persistence
- [ ] Set up backup for RabbitMQ
- [ ] Test failover scenarios
- [ ] Document runbook procedures
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-restart (PM2 or similar)
- [ ] Review security settings
- [ ] Test with real users

## Support

For issues:
- 📖 Check [Meta WhatsApp Business API docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- 🐛 Open issue on GitHub
- 💬 Check existing issues for solutions

---

**Good luck with your deployment! 🚀**
