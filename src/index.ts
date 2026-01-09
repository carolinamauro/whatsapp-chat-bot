import { WhatsAppAdapter, SalesforceAdapter, RabbitMQAdapter, MetaWhatsAppAdapter } from './infrastructure/adapters';
import { BotService } from './api';
import { SalesforceWorker } from './infrastructure/workers';
import { validateConfig, config } from './infrastructure/config';
import { MessagingService } from './domain/ports';

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

    // Initialize messaging adapter based on configuration
    let messagingAdapter: MessagingService;
    
    if (config.whatsapp.adapter === 'meta-api') {
      console.log('Using Meta WhatsApp Business API adapter');
      messagingAdapter = new MetaWhatsAppAdapter();
    } else {
      console.log('Using WhatsApp Web adapter (requires QR code scan)');
      messagingAdapter = new WhatsAppAdapter();
    }

    // Initialize other adapters (infrastructure layer)
    const salesforceAdapter = new SalesforceAdapter();
    const rabbitMQAdapter = new RabbitMQAdapter(config.rabbitmq.url);

    // Initialize message queue
    await rabbitMQAdapter.initialize();

    // Initialize and start Salesforce worker (background process)
    const salesforceWorker = new SalesforceWorker(rabbitMQAdapter, salesforceAdapter);
    await salesforceWorker.start();

    // Initialize bot service (API layer)
    const botService = new BotService(messagingAdapter, rabbitMQAdapter);

    // Start the bot
    await botService.initialize();

    console.log('\n📱 Bot is now listening for messages...');
    console.log('🔄 Salesforce worker is processing operations asynchronously');
    
    if (config.whatsapp.adapter === 'meta-api') {
      console.log(`\n🌐 Webhook server running on port ${config.meta.webhookPort}`);
      console.log(`📍 Webhook URL: http://localhost:${config.meta.webhookPort}${config.meta.webhookPath}`);
      console.log('\n💡 Make sure to configure this webhook URL in Meta Developer Console');
      console.log('   For local development, use ngrok or similar tool for HTTPS tunnel');
    }
    
    console.log('\nPress Ctrl+C to stop the bot\n');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n\n👋 Shutting down bot...');
      await rabbitMQAdapter.close();
      
      // Shutdown Meta adapter if using it
      if (config.whatsapp.adapter === 'meta-api' && messagingAdapter instanceof MetaWhatsAppAdapter) {
        await (messagingAdapter as MetaWhatsAppAdapter).shutdown();
      }
      
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the application
main();
