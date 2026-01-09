import { MessagingService } from '../../domain/ports';

/**
 * Use Case: Send Message
 * Sends a message through the messaging service
 */
export class SendMessageUseCase {
  constructor(private messagingService: MessagingService) {}

  async execute(to: string, content: string): Promise<void> {
    if (!this.messagingService.isReady()) {
      throw new Error('Messaging service is not ready');
    }

    await this.messagingService.sendMessage(to, content);
  }
}
