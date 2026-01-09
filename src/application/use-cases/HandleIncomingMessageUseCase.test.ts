import { Contact, Conversation, ConversationStatus, Message, MessageType } from '../../domain/models';
import { ContactRepository, ConversationRepository, MessageQueueService } from '../../domain/ports';
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

class MockMessageQueueService implements MessageQueueService {
  private publishedMessages: unknown[] = [];

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async publish(_queueName: string, message: unknown): Promise<void> {
    this.publishedMessages.push(message);
  }

  async consume(
    _queueName: string,
    _handler: (message: unknown) => Promise<void>
  ): Promise<void> {
    // Mock consume - not used in these tests
  }

  async close(): Promise<void> {
    // Mock close
  }

  getPublishedMessages(): unknown[] {
    return this.publishedMessages;
  }

  getPublishedMessageCount(): number {
    return this.publishedMessages.length;
  }
}

describe('HandleIncomingMessageUseCase', () => {
  let contactRepository: MockContactRepository;
  let conversationRepository: MockConversationRepository;
  let messageQueue: MockMessageQueueService;
  let useCase: HandleIncomingMessageUseCase;

  beforeEach(() => {
    contactRepository = new MockContactRepository();
    conversationRepository = new MockConversationRepository();
    messageQueue = new MockMessageQueueService();
    useCase = new HandleIncomingMessageUseCase(
      contactRepository,
      conversationRepository,
      messageQueue
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

    it('should queue contact creation for Salesforce', async () => {
      const message: Message = {
        id: 'msg-1',
        from: '+1234567890',
        to: 'bot',
        content: 'Hello',
        timestamp: new Date(),
        type: MessageType.TEXT,
      };

      await useCase.execute(message);

      // Check that a message was queued
      expect(messageQueue.getPublishedMessageCount()).toBeGreaterThan(0);
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

    it('should not queue new contact creation', async () => {
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

      // Assert: No contact creation was queued (only case comment if case exists)
      // Since there's no case, no messages should be queued
      expect(messageQueue.getPublishedMessageCount()).toBe(0);
    });
  });

  describe('when conversation has an associated Salesforce case', () => {
    it('should queue a comment for the Salesforce case', async () => {
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

      // Assert: A message was queued to add comment to Salesforce case
      expect(messageQueue.getPublishedMessageCount()).toBe(1);
    });
  });
});
