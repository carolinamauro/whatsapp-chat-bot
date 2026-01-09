import { Contact, Conversation, ConversationStatus, Message, MessageType } from '../../domain/models';
import { ContactRepository, ConversationRepository, CRMService } from '../../domain/ports';
import { HandleIncomingMessageUseCase } from '../use-cases/HandleIncomingMessageUseCase';

// Mock implementations for testing
class MockContactRepository implements ContactRepository {
  private contacts: Map<string, Contact> = new Map();

  async findByPhoneNumber(phoneNumber: string): Promise<Contact | null> {
    for (const contact of this.contacts.values()) {
      if (contact.phoneNumber === phoneNumber) {
        return contact;
      }
    }
    return null;
  }

  async findById(id: string): Promise<Contact | null> {
    return this.contacts.get(id) || null;
  }

  async save(contact: Contact): Promise<Contact> {
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async update(contact: Contact): Promise<Contact> {
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async delete(id: string): Promise<void> {
    this.contacts.delete(id);
  }
}

class MockConversationRepository implements ConversationRepository {
  private conversations: Map<string, Conversation> = new Map();

  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null;
  }

  async findByContactId(contactId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter((conv) => conv.contactId === contactId);
  }

  async findActiveByContactId(contactId: string): Promise<Conversation | null> {
    for (const conversation of this.conversations.values()) {
      if (
        conversation.contactId === contactId &&
        conversation.status === ConversationStatus.ACTIVE
      ) {
        return conversation;
      }
    }
    return null;
  }

  async save(conversation: Conversation): Promise<Conversation> {
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async update(conversation: Conversation): Promise<Conversation> {
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async delete(id: string): Promise<void> {
    this.conversations.delete(id);
  }
}

class MockCRMService implements CRMService {
  private contactCreated = false;
  private caseCommentAdded = false;

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async createContact(_contact: Contact): Promise<string> {
    this.contactCreated = true;
    return 'sf-contact-123';
  }

  async updateContact(_salesforceId: string, _contact: Partial<Contact>): Promise<void> {
    // Mock update
  }

  async findContactByPhone(_phoneNumber: string): Promise<Contact | null> {
    return null;
  }

  async createCase(
    _contactId: string,
    _subject: string,
    _description: string
  ): Promise<string> {
    return 'sf-case-123';
  }

  async updateCase(_caseId: string, _updates: Record<string, unknown>): Promise<void> {
    // Mock update
  }

  async addCommentToCase(_caseId: string, _comment: string): Promise<void> {
    this.caseCommentAdded = true;
  }

  wasContactCreated(): boolean {
    return this.contactCreated;
  }

  wasCaseCommentAdded(): boolean {
    return this.caseCommentAdded;
  }
}

describe('HandleIncomingMessageUseCase', () => {
  let contactRepository: MockContactRepository;
  let conversationRepository: MockConversationRepository;
  let crmService: MockCRMService;
  let useCase: HandleIncomingMessageUseCase;

  beforeEach(() => {
    contactRepository = new MockContactRepository();
    conversationRepository = new MockConversationRepository();
    crmService = new MockCRMService();
    useCase = new HandleIncomingMessageUseCase(
      contactRepository,
      conversationRepository,
      crmService
    );
  });

  describe('when receiving a message from a new contact', () => {
    it('should create a new contact', async () => {
      const message: Message = {
        id: 'msg-1',
        from: '+1234567890',
        to: 'bot',
        content: 'Hello',
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      await useCase.execute(message);

      const contact = await contactRepository.findByPhoneNumber('+1234567890');
      expect(contact).not.toBeNull();
      expect(contact?.phoneNumber).toBe('+1234567890');
    });

    it('should sync the new contact with Salesforce', async () => {
      const message: Message = {
        id: 'msg-1',
        from: '+1234567890',
        to: 'bot',
        content: 'Hello',
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      await useCase.execute(message);

      expect(crmService.wasContactCreated()).toBe(true);
    });

    it('should create a new conversation', async () => {
      const message: Message = {
        id: 'msg-1',
        from: '+1234567890',
        to: 'bot',
        content: 'Hello',
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      await useCase.execute(message);

      const contact = await contactRepository.findByPhoneNumber('+1234567890');
      const conversations = await conversationRepository.findByContactId(contact!.id);

      expect(conversations).toHaveLength(1);
      expect(conversations[0].status).toBe(ConversationStatus.ACTIVE);
    });
  });

  describe('when receiving a message from an existing contact', () => {
    it('should add the message to the existing conversation', async () => {
      // Setup: Create existing contact
      const existingContact: Contact = {
        id: 'contact-1',
        phoneNumber: '+1234567890',
        name: 'John Doe',
        salesforceId: 'sf-123',
      };
      await contactRepository.save(existingContact);

      // Setup: Create existing conversation
      const existingConversation: Conversation = {
        id: 'conv-1',
        contactId: existingContact.id,
        messages: [],
        startedAt: new Date(),
        lastMessageAt: new Date(),
        status: ConversationStatus.ACTIVE,
      };
      await conversationRepository.save(existingConversation);

      // Act: Receive new message
      const message: Message = {
        id: 'msg-2',
        from: '+1234567890',
        to: 'bot',
        content: 'Another message',
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      await useCase.execute(message);

      // Assert: Message was added to conversation
      const conversation = await conversationRepository.findById('conv-1');
      expect(conversation?.messages).toHaveLength(1);
      expect(conversation?.messages[0].content).toBe('Another message');
    });

    it('should not create a new contact', async () => {
      // Setup: Create existing contact
      const existingContact: Contact = {
        id: 'contact-1',
        phoneNumber: '+1234567890',
        name: 'John Doe',
        salesforceId: 'sf-123',
      };
      await contactRepository.save(existingContact);

      // Setup: Create existing conversation
      const existingConversation: Conversation = {
        id: 'conv-1',
        contactId: existingContact.id,
        messages: [],
        startedAt: new Date(),
        lastMessageAt: new Date(),
        status: ConversationStatus.ACTIVE,
      };
      await conversationRepository.save(existingConversation);

      // Act: Receive new message
      const message: Message = {
        id: 'msg-2',
        from: '+1234567890',
        to: 'bot',
        content: 'Another message',
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      const initialContactCreated = crmService.wasContactCreated();
      await useCase.execute(message);

      // Assert: No new contact was created
      expect(crmService.wasContactCreated()).toBe(initialContactCreated);
    });
  });

  describe('when conversation has an associated Salesforce case', () => {
    it('should add a comment to the Salesforce case', async () => {
      // Setup: Create existing contact
      const existingContact: Contact = {
        id: 'contact-1',
        phoneNumber: '+1234567890',
        name: 'John Doe',
        salesforceId: 'sf-123',
      };
      await contactRepository.save(existingContact);

      // Setup: Create existing conversation with Salesforce case
      const existingConversation: Conversation = {
        id: 'conv-1',
        contactId: existingContact.id,
        messages: [],
        startedAt: new Date(),
        lastMessageAt: new Date(),
        salesforceCaseId: 'sf-case-456',
        status: ConversationStatus.ACTIVE,
      };
      await conversationRepository.save(existingConversation);

      // Act: Receive new message
      const message: Message = {
        id: 'msg-2',
        from: '+1234567890',
        to: 'bot',
        content: 'I need help',
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      await useCase.execute(message);

      // Assert: Comment was added to Salesforce case
      expect(crmService.wasCaseCommentAdded()).toBe(true);
    });
  });
});
