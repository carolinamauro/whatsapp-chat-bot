import { Message, Contact, Conversation, ConversationStatus } from '../../domain/models';
import { ContactRepository, ConversationRepository, CRMService } from '../../domain/ports';

/**
 * Use Case: Handle Incoming Message
 * Processes incoming messages and manages conversations
 */
export class HandleIncomingMessageUseCase {
  constructor(
    private contactRepository: ContactRepository,
    private conversationRepository: ConversationRepository,
    private crmService: CRMService
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

    // Sync with Salesforce if case exists
    if (conversation.salesforceCaseId) {
      await this.crmService.addCommentToCase(
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

    // Sync with Salesforce
    try {
      const salesforceId = await this.crmService.createContact(savedContact);
      savedContact.salesforceId = salesforceId;
      await this.contactRepository.update(savedContact);
    } catch (error) {
      console.error('Failed to sync contact with Salesforce:', error);
    }

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

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
