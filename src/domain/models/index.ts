/**
 * Domain Model: Message
 * Represents a message in the chat system
 */
export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: MessageType;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

/**
 * Domain Model: Contact
 * Represents a contact in the system
 */
export interface Contact {
  id: string;
  phoneNumber: string;
  name?: string;
  salesforceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Domain Model: Conversation
 * Represents a conversation thread
 */
export interface Conversation {
  id: string;
  contactId: string;
  messages: Message[];
  startedAt: Date;
  lastMessageAt: Date;
  salesforceCaseId?: string;
  status: ConversationStatus;
}

export enum ConversationStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PENDING = 'pending',
}
