# Quick Start Guide

Get your WhatsApp Salesforce Chatbot running in minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18 or higher installed
- ✅ npm or yarn package manager
- ✅ A Salesforce account with API access
- ✅ **RabbitMQ server** (Docker recommended)
- ✅ **Choose ONE** WhatsApp option:
  - **Option A**: Meta Business Account (for production) 🆕
  - **Option B**: WhatsApp account for QR scanning (for development)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/carolinamauro/whatsapp-chat-bot.git
cd whatsapp-chat-bot

# Install dependencies
npm install
```

## Step 2: Start RabbitMQ 🆕

The bot uses RabbitMQ for asynchronous Salesforce operations. Start it with Docker:

```bash
# Start RabbitMQ with management UI
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# Verify it's running
docker ps | grep rabbitmq
```

💡 **Tip**: RabbitMQ Management UI will be available at http://localhost:15672 (guest/guest)

## Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your favorite editor
nano .env  # or vim, code, etc.
```

### Choose Your WhatsApp Adapter

#### Option A: Meta Business API (Production) 🆕

For production deployments with official Meta API support:

```env
# WhatsApp Adapter Selection
WHATSAPP_ADAPTER=meta-api

# Salesforce Configuration
SALESFORCE_USERNAME=your-email@company.com
SALESFORCE_PASSWORD=yourPassword
SALESFORCE_SECURITY_TOKEN=yourSecurityToken
SALESFORCE_LOGIN_URL=https://login.salesforce.com

# Meta Business API Configuration
META_ACCESS_TOKEN=your-permanent-access-token
META_PHONE_NUMBER_ID=your-phone-number-id
META_VERIFY_TOKEN=your-custom-verify-token
META_APP_SECRET=your-app-secret
META_WEBHOOK_PORT=3000
META_WEBHOOK_PATH=/webhook

RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE_NAME=salesforce-operations

BOT_NAME=My WhatsApp Bot
BOT_WELCOME_MESSAGE=Hi! I'm here to help. How can I assist you today?
```

📖 **For Meta API setup**, see detailed instructions in [DEPLOYMENT.md](DEPLOYMENT.md)

💡 **Testing Meta API**: Run `npm run test:meta` to validate your configuration

#### Option B: WhatsApp Web (Development)

For quick testing and development:

```env
# WhatsApp Adapter Selection
WHATSAPP_ADAPTER=whatsapp-web

# Salesforce Configuration
SALESFORCE_USERNAME=your-email@company.com
SALESFORCE_PASSWORD=yourPassword
SALESFORCE_SECURITY_TOKEN=yourSecurityToken
SALESFORCE_LOGIN_URL=https://login.salesforce.com

RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE_NAME=salesforce-operations

BOT_NAME=My WhatsApp Bot
BOT_WELCOME_MESSAGE=Hi! I'm here to help. How can I assist you today?
```

### Getting Your Salesforce Security Token

If you don't have a security token:

1. Log in to Salesforce
2. Go to Settings → My Personal Information → Reset My Security Token
3. Check your email for the new token

## Step 4: Build the Project

```bash
npm run build
```

## Step 5: Start the Bot

```bash
npm start
```

You should see:

```
🚀 Starting WhatsApp Salesforce Chatbot with RabbitMQ...

✓ Configuration validated
✓ Connected to RabbitMQ
✓ RabbitMQ channel created
Starting Salesforce worker...
✓ Salesforce worker started and listening for operations
```

## Step 6: Connect WhatsApp

### For WhatsApp Web (Option B):

1. A QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to: **Settings → Linked Devices → Link a Device**
4. Scan the QR code from your terminal

### For Meta Business API (Option A):

1. Ensure your webhook is accessible via HTTPS
   - For local testing: Use ngrok - `ngrok http 3000`
   - For production: Use proper SSL certificate (see DEPLOYMENT.md)
2. Configure webhook in Meta Developer Console with your HTTPS URL
3. Bot is ready when webhook server starts

💡 **Local testing with Meta API**: Run `ngrok http 3000` in another terminal, then use the ngrok URL in Meta webhook configuration.

## Step 7: Wait for Connection

After scanning, you'll see:

```
✓ Messaging service initialized
✓ Message queue initialized

My WhatsApp Bot is ready!

📱 Bot is now listening for messages...
🔄 Salesforce worker is processing operations asynchronously
```

## Step 8: Test Your Bot

Send a message to your bot's WhatsApp number from another device:

```
You: Hello
Bot: Hi! I'm here to help. How can I assist you today?
```

## What Happens Next?

When someone messages your bot:

1. **Instant Response**: User gets immediate reply (no waiting for Salesforce) ⚡
2. **Background Processing**: Salesforce operations are queued via RabbitMQ 🔄
3. **Contact Creation**: New contacts are created in Salesforce asynchronously 
4. **Conversation Tracking**: The conversation is tracked in the bot's memory
5. **Salesforce Sync**: Messages are synced to Salesforce Cases in the background
6. **Auto-Retry**: Failed operations retry automatically

### How RabbitMQ Improves UX 🆕

- **Before**: User waits 2-5 seconds for Salesforce to respond
- **After**: User gets instant reply, Salesforce syncs in background
- **Result**: 10x better user experience! 🚀

## Common Issues

### QR Code Not Showing

**Problem**: Terminal doesn't support QR codes
**Solution**: Try a different terminal (iTerm2, Windows Terminal, or standard terminal)

### Salesforce Authentication Failed

**Problem**: Invalid credentials
**Solution**: 
- Verify your username and password
- Make sure to append the security token to your password
- Check if your IP needs whitelisting in Salesforce

### RabbitMQ Connection Failed 🆕

**Problem**: Bot can't connect to RabbitMQ
**Solution**:
- Make sure RabbitMQ is running: `docker ps | grep rabbitmq`
- Verify RABBITMQ_URL in `.env` is correct
- Check if port 5672 is accessible
- Restart RabbitMQ: `docker restart rabbitmq`

### Messages Not Syncing to Salesforce 🆕

**Problem**: Salesforce operations not executing
**Solution**:
- Check worker logs for errors in terminal
- Visit RabbitMQ Management UI: http://localhost:15672
- Verify queue has messages being processed
- Check Salesforce credentials are valid
- Operations will retry automatically

### Port Already in Use

**Problem**: Another process is using the required port
**Solution**: Kill the process or change the port in the configuration

### WhatsApp Disconnects

**Problem**: WhatsApp disconnects after some time
**Solution**: 
- This is normal for WhatsApp Web
- The bot will show a message and you may need to reconnect
- Consider using a dedicated phone number for the bot

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

## Running Tests

```bash
npm test
```

## Stopping the Bot

Press `Ctrl+C` in the terminal where the bot is running.

## Next Steps

- 📖 Read the full [README.md](README.md) for all features
- 🏗️ Understand the [ARCHITECTURE.md](ARCHITECTURE.md) for customization
- 🤝 Check [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute

## Getting Help

- 🐛 Found a bug? [Open an issue](https://github.com/carolinamauro/whatsapp-chat-bot/issues)
- 💬 Have questions? Check existing issues or create a new one
- 📧 Need support? Create a detailed issue with:
  - Your environment (OS, Node version)
  - Steps to reproduce
  - Error messages

## Security Notes

⚠️ **Important**:
- Never commit your `.env` file
- Keep your Salesforce credentials secure
- Use environment variables in production
- Regularly update dependencies

---

**Congratulations!** 🎉 Your WhatsApp Salesforce Chatbot is now running!
