import { Message, Contact, Conversation, ConversationStatus } from '../../domain/models';
import {
  ContactRepository,
  ConversationRepository,
  MessageQueueService,
  SalesforceOperationType,
  CreateContactOperation,
  AddCommentToCaseOperation,
} from '../../domain/ports';
import { config } from '../../infrastructure/config';

/**
 * Use Case: Handle Incoming Message
 * Processes incoming messages and manages conversations
 */
export class HandleIncomingMessageUseCase {
  constructor(
    private contactRepository: ContactRepository,
    private conversationRepository: ConversationRepository,
    private messageQueue: MessageQueueService
  ) {}

  async execute(message: Message): Promise<void> {
    // Find or create contact
    let contact = await this.contactRepository.findByPhoneNumber(message.from);
    
    if (!contact) {
      contact = await this.createNewContact(message.from);
    }

    // Find or create conversation
    let conversation = await this.conversationRepository.findActiveByContactId(contact.id);
    
    if (!conversation) {
      conversation = await this.createNewConversation(contact.id);
    }

    // Add message to conversation
    conversation.messages.push(message);
    conversation.lastMessageAt = message.timestamp;
    await this.conversationRepository.update(conversation);

    // Queue Salesforce operation if case exists (non-blocking)
    if (conversation.salesforceCaseId) {
      await this.queueAddCommentToCase(
        conversation.salesforceCaseId,
        `Message from ${contact.phoneNumber}: ${message.content}`
      );
    }
  }

  private async createNewContact(phoneNumber: string): Promise<Contact> {
    const newContact: Contact = {
      id: this.generateId(),
      phoneNumber,
      name: phoneNumber,
    };

    // Save to local repository
    const savedContact = await this.contactRepository.save(newContact);

    // Queue Salesforce operation (non-blocking)
    await this.queueCreateContact(savedContact);

    return savedContact;
  }

  private async createNewConversation(contactId: string): Promise<Conversation> {
    const newConversation: Conversation = {
      id: this.generateId(),
      contactId,
      messages: [],
      startedAt: new Date(),
      lastMessageAt: new Date(),
      status: ConversationStatus.ACTIVE,
    };

    return this.conversationRepository.save(newConversation);
  }

  private async queueCreateContact(contact: Contact): Promise<void> {
    try {
      const operation: CreateContactOperation = {
        type: SalesforceOperationType.CREATE_CONTACT,
        timestamp: new Date(),
        contact: {
          id: contact.id,
          phoneNumber: contact.phoneNumber,
          name: contact.name,
        },
      };

      await this.messageQueue.publish(config.rabbitmq.queueName, operation);
      console.log(`✓ Queued contact creation for Salesforce: ${contact.phoneNumber}`);
    } catch (error) {
      console.error('Failed to queue contact creation:', error);
      // Non-blocking: We don't throw the error to prevent message processing failure
    }
  }

  private async queueAddCommentToCase(caseId: string, comment: string): Promise<void> {
    try {
      const operation: AddCommentToCaseOperation = {
        type: SalesforceOperationType.ADD_COMMENT_TO_CASE,
        timestamp: new Date(),
        caseId,
        comment,
      };

      await this.messageQueue.publish(config.rabbitmq.queueName, operation);
      console.log(`✓ Queued comment for Salesforce case: ${caseId}`);
    } catch (error) {
      console.error('Failed to queue case comment:', error);
      // Non-blocking: We don't throw the error to prevent message processing failure
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
