import { Message } from '../domain/models';
import { MessagingService, CRMService } from '../domain/ports';
import { HandleIncomingMessageUseCase } from '../application/use-cases/HandleIncomingMessageUseCase';
import { SendMessageUseCase } from '../application/use-cases/SendMessageUseCase';
import { InMemoryContactRepository } from '../infrastructure/repositories/InMemoryContactRepository';
import { InMemoryConversationRepository } from '../infrastructure/repositories/InMemoryConversationRepository';
import { config } from '../infrastructure/config';

/**
 * Bot Service
 * Main orchestrator for the WhatsApp chatbot
 */
export class BotService {
  private handleIncomingMessageUseCase: HandleIncomingMessageUseCase;
  private sendMessageUseCase: SendMessageUseCase;

  constructor(
    private messagingService: MessagingService,
    private crmService: CRMService
  ) {
    const contactRepository = new InMemoryContactRepository();
    const conversationRepository = new InMemoryConversationRepository();

    this.handleIncomingMessageUseCase = new HandleIncomingMessageUseCase(
      contactRepository,
      conversationRepository,
      crmService
    );

    this.sendMessageUseCase = new SendMessageUseCase(messagingService);

    this.setupMessageHandler();
  }

  async initialize(): Promise<void> {
    console.log('Initializing bot services...');
    
    // Initialize messaging service (WhatsApp)
    await this.messagingService.initialize();
    console.log('✓ Messaging service initialized');

    // Initialize CRM service (Salesforce)
    await this.crmService.initialize();
    console.log('✓ CRM service initialized');

    console.log(`\n${config.bot.name} is ready!`);
  }

  private setupMessageHandler(): void {
    this.messagingService.onMessageReceived(async (message: Message) => {
      try {
        console.log(`\n📨 New message from ${message.from}:`);
        console.log(`   ${message.content}`);

        // Process the incoming message
        await this.handleIncomingMessageUseCase.execute(message);

        // Auto-reply with welcome message for first-time contacts
        await this.sendAutoReply(message);

        console.log('✓ Message processed successfully');
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  private async sendAutoReply(message: Message): Promise<void> {
    // Simple auto-reply logic - can be extended with more sophisticated bot logic
    if (message.content.toLowerCase().includes('hello') || 
        message.content.toLowerCase().includes('hi')) {
      await this.sendMessageUseCase.execute(
        message.from,
        config.bot.welcomeMessage
      );
    }
  }
}
