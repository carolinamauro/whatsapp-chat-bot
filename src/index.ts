import { WhatsAppAdapter, SalesforceAdapter, RabbitMQAdapter } from './infrastructure/adapters';
import { BotService } from './api';
import { SalesforceWorker } from './infrastructure/workers';
import { validateConfig, config } from './infrastructure/config';

/**
 * Main Application Entry Point
 * Initializes and starts the WhatsApp chatbot with Salesforce integration
 */
async function main() {
  try {
    console.log('🚀 Starting WhatsApp Salesforce Chatbot with RabbitMQ...\n');

    // Validate configuration
    validateConfig();
    console.log('✓ Configuration validated');

    // Initialize adapters (infrastructure layer)
    const whatsAppAdapter = new WhatsAppAdapter();
    const salesforceAdapter = new SalesforceAdapter();
    const rabbitMQAdapter = new RabbitMQAdapter(config.rabbitmq.url);

    // Initialize message queue
    await rabbitMQAdapter.initialize();

    // Initialize and start Salesforce worker (background process)
    const salesforceWorker = new SalesforceWorker(rabbitMQAdapter, salesforceAdapter);
    await salesforceWorker.start();

    // Initialize bot service (API layer)
    const botService = new BotService(whatsAppAdapter, rabbitMQAdapter);

    // Start the bot
    await botService.initialize();

    console.log('\n📱 Bot is now listening for messages...');
    console.log('🔄 Salesforce worker is processing operations asynchronously');
    console.log('Press Ctrl+C to stop the bot\n');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n\n👋 Shutting down bot...');
      await rabbitMQAdapter.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the application
main();
