import { Contact } from '../models';

/**
 * Port: Contact Repository
 * Interface for contact persistence operations
 */
export interface ContactRepository {
  findByPhoneNumber(phoneNumber: string): Promise<Contact | null>;
  findById(id: string): Promise<Contact | null>;
  save(contact: Contact): Promise<Contact>;
  update(contact: Contact): Promise<Contact>;
  delete(id: string): Promise<void>;
}
