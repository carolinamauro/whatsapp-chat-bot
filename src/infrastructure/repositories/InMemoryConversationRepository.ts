import { ConversationRepository } from '../../domain/ports';
import { Conversation, ConversationStatus } from '../../domain/models';

/**
 * In-Memory Conversation Repository
 * Simple implementation for development/testing
 */
export class InMemoryConversationRepository implements ConversationRepository {
  private conversations: Map<string, Conversation> = new Map();

  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null;
  }

  async findByContactId(contactId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conv) => conv.contactId === contactId
    );
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
    if (!this.conversations.has(conversation.id)) {
      throw new Error(`Conversation not found: ${conversation.id}`);
    }
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async delete(id: string): Promise<void> {
    this.conversations.delete(id);
  }
}
