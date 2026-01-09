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
  bot: {
    name: process.env.BOT_NAME || 'WhatsApp Bot',
    welcomeMessage: process.env.BOT_WELCOME_MESSAGE || 'Hello! How can I help you?',
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
}
