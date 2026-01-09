import { Conversation } from '../models';

/**
 * Port: Conversation Repository
 * Interface for conversation persistence operations
 */
export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByContactId(contactId: string): Promise<Conversation[]>;
  findActiveByContactId(contactId: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<Conversation>;
  update(conversation: Conversation): Promise<Conversation>;
  delete(id: string): Promise<void>;
}
