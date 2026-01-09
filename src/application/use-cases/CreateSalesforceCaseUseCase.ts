import { ContactRepository, ConversationRepository, CRMService } from '../../domain/ports';
import { ConversationStatus } from '../../domain/models';

/**
 * Use Case: Create Salesforce Case
 * Creates a case in Salesforce for a conversation
 */
export class CreateSalesforceCaseUseCase {
  constructor(
    private contactRepository: ContactRepository,
    private conversationRepository: ConversationRepository,
    private crmService: CRMService
  ) {}

  async execute(conversationId: string, subject: string): Promise<string> {
    const conversation = await this.conversationRepository.findById(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const contact = await this.contactRepository.findById(conversation.contactId);
    
    if (!contact) {
      throw new Error(`Contact not found: ${conversation.contactId}`);
    }

    if (!contact.salesforceId) {
      throw new Error('Contact not synced with Salesforce');
    }

    // Create description from conversation messages
    const description = conversation.messages
      .map((msg) => `[${msg.timestamp.toISOString()}] ${msg.from}: ${msg.content}`)
      .join('\n');

    // Create case in Salesforce
    const caseId = await this.crmService.createCase(
      contact.salesforceId,
      subject,
      description
    );

    // Update conversation with case ID
    conversation.salesforceCaseId = caseId;
    conversation.status = ConversationStatus.PENDING;
    await this.conversationRepository.update(conversation);

    return caseId;
  }
}
