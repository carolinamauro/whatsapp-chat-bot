import * as jsforce from 'jsforce';
import { CRMService } from '../../domain/ports';
import { Contact } from '../../domain/models';
import { config } from '../config';

/**
 * Adapter: Salesforce CRM Service
 * Implements CRMService using jsforce
 */
export class SalesforceAdapter implements CRMService {
  private connection: jsforce.Connection;
  private isInitialized: boolean = false;

  constructor() {
    this.connection = new jsforce.Connection({
      loginUrl: config.salesforce.loginUrl,
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.connection.login(
        config.salesforce.username,
        config.salesforce.password + config.salesforce.securityToken
      );
      this.isInitialized = true;
      console.log('Successfully connected to Salesforce');
    } catch (error) {
      console.error('Failed to connect to Salesforce:', error);
      throw error;
    }
  }

  async createContact(contact: Contact): Promise<string> {
    this.ensureInitialized();

    const result = await this.connection.sobject('Contact').create({
      FirstName: contact.name || 'Unknown',
      LastName: 'WhatsApp Contact',
      Phone: contact.phoneNumber,
      Description: `WhatsApp contact created automatically. ID: ${contact.id}`,
    });

    if (!result.success) {
      throw new Error(`Failed to create contact: ${JSON.stringify(result.errors)}`);
    }

    return result.id;
  }

  async updateContact(salesforceId: string, contact: Partial<Contact>): Promise<void> {
    this.ensureInitialized();

    const updateData: Record<string, unknown> = {};
    
    if (contact.name) {
      updateData.FirstName = contact.name;
    }
    if (contact.phoneNumber) {
      updateData.Phone = contact.phoneNumber;
    }

    await this.connection.sobject('Contact').update({
      Id: salesforceId,
      ...updateData,
    });
  }

  async findContactByPhone(phoneNumber: string): Promise<Contact | null> {
    this.ensureInitialized();

    const records = await this.connection
      .sobject('Contact')
      .find({ Phone: phoneNumber })
      .limit(1)
      .execute();

    if (records.length === 0) {
      return null;
    }

    const record = records[0] as { Id: string; FirstName?: string; Phone: string };
    
    return {
      id: record.Id,
      phoneNumber: record.Phone,
      name: record.FirstName,
      salesforceId: record.Id,
    };
  }

  async createCase(
    contactId: string,
    subject: string,
    description: string
  ): Promise<string> {
    this.ensureInitialized();

    const result = await this.connection.sobject('Case').create({
      ContactId: contactId,
      Subject: subject,
      Description: description,
      Origin: 'WhatsApp',
      Status: 'New',
    });

    if (!result.success) {
      throw new Error(`Failed to create case: ${JSON.stringify(result.errors)}`);
    }

    return result.id;
  }

  async updateCase(caseId: string, updates: Record<string, unknown>): Promise<void> {
    this.ensureInitialized();

    await this.connection.sobject('Case').update({
      Id: caseId,
      ...updates,
    });
  }

  async addCommentToCase(caseId: string, comment: string): Promise<void> {
    this.ensureInitialized();

    await this.connection.sobject('CaseComment').create({
      ParentId: caseId,
      CommentBody: comment,
      IsPublished: true,
    });
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Salesforce service is not initialized. Call initialize() first.');
    }
  }
}
