# Quick Start Guide

Get your WhatsApp Salesforce Chatbot running in minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18 or higher installed
- ✅ npm or yarn package manager
- ✅ A Salesforce account with API access
- ✅ A WhatsApp account (for the bot)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/carolinamauro/whatsapp-chat-bot.git
cd whatsapp-chat-bot

# Install dependencies
npm install
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your favorite editor
nano .env  # or vim, code, etc.
```

Update the `.env` file with your Salesforce credentials:

```env
SALESFORCE_USERNAME=your-email@company.com
SALESFORCE_PASSWORD=yourPassword
SALESFORCE_SECURITY_TOKEN=yourSecurityToken
SALESFORCE_LOGIN_URL=https://login.salesforce.com

BOT_NAME=My WhatsApp Bot
BOT_WELCOME_MESSAGE=Hi! I'm here to help. How can I assist you today?
```

### Getting Your Salesforce Security Token

If you don't have a security token:

1. Log in to Salesforce
2. Go to Settings → My Personal Information → Reset My Security Token
3. Check your email for the new token

## Step 3: Build the Project

```bash
npm run build
```

## Step 4: Start the Bot

```bash
npm start
```

You should see:

```
🚀 Starting WhatsApp Salesforce Chatbot...

✓ Configuration validated
```

## Step 5: Scan QR Code

1. A QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to: **Settings → Linked Devices → Link a Device**
4. Scan the QR code from your terminal

## Step 6: Wait for Connection

After scanning, you'll see:

```
✓ Messaging service initialized
✓ CRM service initialized

My WhatsApp Bot is ready!

📱 Bot is now listening for messages...
```

## Step 7: Test Your Bot

Send a message to your bot's WhatsApp number from another device:

```
You: Hello
Bot: Hi! I'm here to help. How can I assist you today?
```

## What Happens Next?

When someone messages your bot:

1. **Contact Creation**: If it's a new contact, they're automatically created in Salesforce
2. **Conversation Tracking**: The conversation is tracked in the bot's memory
3. **Auto-Reply**: The bot responds with your configured welcome message
4. **Salesforce Sync**: All messages can be synced to Salesforce Cases

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
