import { WhatsAppAdapter, SalesforceAdapter } from './infrastructure/adapters';
import { BotService } from './api';
import { validateConfig } from './infrastructure/config';

/**
 * Main Application Entry Point
 * Initializes and starts the WhatsApp chatbot with Salesforce integration
 */
async function main() {
  try {
    console.log('🚀 Starting WhatsApp Salesforce Chatbot...\n');

    // Validate configuration
    validateConfig();
    console.log('✓ Configuration validated');

    // Initialize adapters (infrastructure layer)
    const whatsAppAdapter = new WhatsAppAdapter();
    const salesforceAdapter = new SalesforceAdapter();

    // Initialize bot service (API layer)
    const botService = new BotService(whatsAppAdapter, salesforceAdapter);

    // Start the bot
    await botService.initialize();

    console.log('\n📱 Bot is now listening for messages...');
    console.log('Press Ctrl+C to stop the bot\n');

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down bot...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the application
main();
