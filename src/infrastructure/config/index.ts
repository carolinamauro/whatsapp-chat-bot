import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Configuration management
 */
export const config = {
  salesforce: {
    username: process.env.SALESFORCE_USERNAME || '',
    password: process.env.SALESFORCE_PASSWORD || '',
    securityToken: process.env.SALESFORCE_SECURITY_TOKEN || '',
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queueName: process.env.RABBITMQ_QUEUE_NAME || 'salesforce-operations',
  },
  bot: {
    name: process.env.BOT_NAME || 'WhatsApp Bot',
    welcomeMessage: process.env.BOT_WELCOME_MESSAGE || 'Hello! How can I help you?',
  },
  whatsapp: {
    adapter: process.env.WHATSAPP_ADAPTER || 'whatsapp-web', // 'whatsapp-web' or 'meta-api'
  },
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN || '',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
    verifyToken: process.env.META_VERIFY_TOKEN || '',
    appSecret: process.env.META_APP_SECRET || '',
    webhookPort: parseInt(process.env.META_WEBHOOK_PORT || '3000', 10),
    webhookPath: process.env.META_WEBHOOK_PATH || '/webhook',
  },
  environment: process.env.NODE_ENV || 'development',
};

export function validateConfig(): void {
  const requiredFields = [
    'SALESFORCE_USERNAME',
    'SALESFORCE_PASSWORD',
    'SALESFORCE_SECURITY_TOKEN',
  ];

  const missing = requiredFields.filter((field) => !process.env[field]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }

  // Validate Meta API configuration if using meta-api adapter
  if (config.whatsapp.adapter === 'meta-api') {
    const metaRequiredFields = [
      'META_ACCESS_TOKEN',
      'META_PHONE_NUMBER_ID',
      'META_VERIFY_TOKEN',
      'META_APP_SECRET',
    ];

    const metaMissing = metaRequiredFields.filter((field) => !process.env[field]);

    if (metaMissing.length > 0) {
      throw new Error(
        `Missing required Meta API environment variables: ${metaMissing.join(', ')}\n` +
        'Please add Meta API credentials to your .env file when using WHATSAPP_ADAPTER=meta-api.'
      );
    }
  }
}
