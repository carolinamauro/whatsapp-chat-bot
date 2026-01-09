import express, { Express, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { MessagingService } from '../../domain/ports';
import { Message, MessageType } from '../../domain/models';
import { config } from '../config';

/**
 * Adapter: Meta (Facebook) WhatsApp Business API
 * Implements MessagingService using Meta's Graph API
 */
export class MetaWhatsAppAdapter implements MessagingService {
  private app: Express;
  private ready: boolean = false;
  private messageHandler?: (message: Message) => Promise<void>;
  private server?: any;

  private readonly GRAPH_API_VERSION = 'v21.0';
  private readonly GRAPH_API_BASE_URL = `https://graph.facebook.com/${this.GRAPH_API_VERSION}`;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.setupWebhookRoutes();
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start webhook server
        this.server = this.app.listen(config.meta.webhookPort, () => {
          this.ready = true;
          console.log(`Meta WhatsApp webhook server listening on port ${config.meta.webhookPort}`);
          console.log(`Webhook endpoint: ${config.meta.webhookPath}`);
          resolve();
        });

        this.server.on('error', (error: Error) => {
          console.error('Failed to start webhook server:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async sendMessage(to: string, content: string): Promise<void> {
    if (!this.ready) {
      throw new Error('Meta WhatsApp adapter is not ready');
    }

    // Format phone number (remove special characters, Meta expects E.164 format)
    const phoneNumber = to.replace(/[^\d]/g, '');

    const url = `${this.GRAPH_API_BASE_URL}/${config.meta.phoneNumberId}/messages`;

    const data = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: content,
      },
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${config.meta.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Message sent successfully:', response.data);
    } catch (error: any) {
      console.error('Error sending message via Meta API:', error.response?.data || error.message);
      throw new Error(`Failed to send message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  onMessageReceived(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Setup webhook routes for Meta's Graph API
   */
  private setupWebhookRoutes(): void {
    // GET endpoint for webhook verification
    this.app.get(config.meta.webhookPath, (req: Request, res: Response) => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      // Verify the webhook
      if (mode === 'subscribe' && token === config.meta.verifyToken) {
        console.log('✓ Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        console.error('✗ Webhook verification failed');
        res.sendStatus(403);
      }
    });

    // POST endpoint for receiving webhook events
    this.app.post(config.meta.webhookPath, async (req: Request, res: Response): Promise<void> => {
      try {
        // Verify webhook signature
        if (!this.verifyWebhookSignature(req)) {
          console.error('✗ Invalid webhook signature');
          res.sendStatus(403);
          return;
        }

        const body = req.body;

        // Check if this is a WhatsApp message event
        if (body.object === 'whatsapp_business_account') {
          // Process each entry
          for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
              if (change.field === 'messages') {
                await this.processIncomingMessages(change.value);
              }
            }
          }
        }

        // Acknowledge receipt
        res.sendStatus(200);
      } catch (error) {
        console.error('Error processing webhook:', error);
        res.sendStatus(500);
      }
    });
  }

  /**
   * Verify webhook signature using app secret
   */
  private verifyWebhookSignature(req: Request): boolean {
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature || typeof signature !== 'string') {
      return false;
    }

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', config.meta.appSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const signatureHash = signature.split('sha256=')[1];

    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Process incoming messages from Meta webhook
   */
  private async processIncomingMessages(value: any): Promise<void> {
    const messages = value.messages || [];
    const contacts = value.contacts || [];

    for (const waMessage of messages) {
      // Skip status updates and non-text messages for now
      if (waMessage.type !== 'text') {
        console.log(`Skipping non-text message type: ${waMessage.type}`);
        continue;
      }

      // Find contact information (for logging/future use)
      const contact = contacts.find((c: any) => c.wa_id === waMessage.from);
      if (contact?.profile?.name) {
        console.log(`Message from: ${contact.profile.name} (${waMessage.from})`);
      }

      // Convert to domain Message model
      const message: Message = {
        id: waMessage.id,
        from: waMessage.from,
        to: value.metadata?.phone_number_id || '',
        content: waMessage.text?.body || '',
        timestamp: new Date(parseInt(waMessage.timestamp) * 1000),
        type: MessageType.TEXT,
      };

      // Call the message handler
      if (this.messageHandler) {
        try {
          await this.messageHandler(message);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      }
    }
  }

  /**
   * Mark message as read (optional, good UX practice)
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    const url = `${this.GRAPH_API_BASE_URL}/${config.meta.phoneNumberId}/messages`;

    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.meta.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Shutdown the webhook server
   */
  async shutdown(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('Meta WhatsApp webhook server stopped');
          this.ready = false;
          resolve();
        });
      });
    }
  }
}
