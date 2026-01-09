import { ContactRepository } from '../../domain/ports';
import { Contact } from '../../domain/models';

/**
 * In-Memory Contact Repository
 * Simple implementation for development/testing
 */
export class InMemoryContactRepository implements ContactRepository {
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
    if (!this.contacts.has(contact.id)) {
      throw new Error(`Contact not found: ${contact.id}`);
    }
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async delete(id: string): Promise<void> {
    this.contacts.delete(id);
  }
}
