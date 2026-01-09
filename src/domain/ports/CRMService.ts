import { Contact } from '../models';

/**
 * Port: CRM Service
 * Interface for CRM operations (Salesforce integration)
 */
export interface CRMService {
  initialize(): Promise<void>;
  createContact(contact: Contact): Promise<string>;
  updateContact(salesforceId: string, contact: Partial<Contact>): Promise<void>;
  findContactByPhone(phoneNumber: string): Promise<Contact | null>;
  createCase(contactId: string, subject: string, description: string): Promise<string>;
  updateCase(caseId: string, updates: Record<string, unknown>): Promise<void>;
  addCommentToCase(caseId: string, comment: string): Promise<void>;
}
