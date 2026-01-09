/**
 * Port: Message Queue Service
 * Interface for publishing messages to a queue
 */
export interface MessageQueueService {
  initialize(): Promise<void>;
  publish(queueName: string, message: unknown): Promise<void>;
  consume(queueName: string, handler: (message: unknown) => Promise<void>): Promise<void>;
  close(): Promise<void>;
}

/**
 * Salesforce operation types that can be queued
 */
export enum SalesforceOperationType {
  CREATE_CONTACT = 'CREATE_CONTACT',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  CREATE_CASE = 'CREATE_CASE',
  UPDATE_CASE = 'UPDATE_CASE',
  ADD_COMMENT_TO_CASE = 'ADD_COMMENT_TO_CASE',
}

/**
 * Base interface for Salesforce operations
 */
export interface SalesforceOperation {
  type: SalesforceOperationType;
  timestamp: Date;
}

/**
 * Create Contact Operation
 */
export interface CreateContactOperation extends SalesforceOperation {
  type: SalesforceOperationType.CREATE_CONTACT;
  contact: {
    id: string;
    phoneNumber: string;
    name?: string;
  };
}

/**
 * Add Comment to Case Operation
 */
export interface AddCommentToCaseOperation extends SalesforceOperation {
  type: SalesforceOperationType.ADD_COMMENT_TO_CASE;
  caseId: string;
  comment: string;
}

/**
 * Union type for all Salesforce operations
 */
export type SalesforceOperationMessage =
  | CreateContactOperation
  | AddCommentToCaseOperation;
