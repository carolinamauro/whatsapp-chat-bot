import {
  MessageQueueService,
  SalesforceOperationMessage,
  SalesforceOperationType,
  CreateContactOperation,
  AddCommentToCaseOperation,
} from '../../domain/ports';
import { CRMService } from '../../domain/ports';
import { config } from '../config';

/**
 * Salesforce Operation Worker
 * Consumes messages from the queue and executes Salesforce operations
 */
export class SalesforceWorker {
  constructor(
    private messageQueue: MessageQueueService,
    private crmService: CRMService
  ) {}

  async start(): Promise<void> {
    console.log('Starting Salesforce worker...');

    // Ensure CRM service is initialized
    await this.crmService.initialize();

    // Start consuming messages
    await this.messageQueue.consume(
      config.rabbitmq.queueName,
      this.processOperation.bind(this)
    );

    console.log('✓ Salesforce worker started and listening for operations');
  }

  private async processOperation(message: unknown): Promise<void> {
    const operation = message as SalesforceOperationMessage;

    console.log(`Processing Salesforce operation: ${operation.type}`);

    try {
      switch (operation.type) {
        case SalesforceOperationType.CREATE_CONTACT:
          await this.handleCreateContact(operation as CreateContactOperation);
          break;

        case SalesforceOperationType.ADD_COMMENT_TO_CASE:
          await this.handleAddCommentToCase(operation as AddCommentToCaseOperation);
          break;

        default:
          console.warn(`Unknown operation type: ${(operation as any).type}`);
      }

      console.log(`✓ Completed Salesforce operation: ${operation.type}`);
    } catch (error) {
      console.error(`Error processing Salesforce operation ${operation.type}:`, error);
      throw error; // This will cause the message to be requeued
    }
  }

  private async handleCreateContact(operation: CreateContactOperation): Promise<void> {
    const { contact } = operation;

    try {
      const salesforceId = await this.crmService.createContact({
        id: contact.id,
        phoneNumber: contact.phoneNumber,
        name: contact.name,
      });

      console.log(
        `✓ Contact created in Salesforce: ${contact.phoneNumber} -> ${salesforceId}`
      );

      // Note: In a production system, you might want to update the local database
      // with the Salesforce ID here, possibly through another queue or event system
    } catch (error) {
      console.error(`Failed to create contact in Salesforce: ${contact.phoneNumber}`, error);
      throw error;
    }
  }

  private async handleAddCommentToCase(
    operation: AddCommentToCaseOperation
  ): Promise<void> {
    const { caseId, comment } = operation;

    try {
      await this.crmService.addCommentToCase(caseId, comment);

      console.log(`✓ Comment added to Salesforce case: ${caseId}`);
    } catch (error) {
      console.error(`Failed to add comment to Salesforce case: ${caseId}`, error);
      throw error;
    }
  }
}
