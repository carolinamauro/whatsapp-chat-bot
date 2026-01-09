import { Client, LocalAuth, Message as WAMessage } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { MessagingService } from '../../domain/ports';
import { Message, MessageType } from '../../domain/models';

/**
 * Adapter: WhatsApp Web Service
 * Implements MessagingService using whatsapp-web.js
 */
export class WhatsAppAdapter implements MessagingService {
  private client: Client;
  private ready: boolean = false;
  private messageHandler?: (message: Message) => Promise<void>;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.on('ready', () => {
        this.ready = true;
        console.log('WhatsApp client is ready!');
        resolve();
      });

      this.client.on('auth_failure', (error) => {
        console.error('Authentication failed:', error);
        reject(error);
      });

      this.client.initialize().catch(reject);
    });
  }

  async sendMessage(to: string, content: string): Promise<void> {
    if (!this.ready) {
      throw new Error('WhatsApp client is not ready');
    }

    // Format phone number for WhatsApp (remove special characters and add @c.us)
    const chatId = to.replace(/[^\d]/g, '') + '@c.us';
    await this.client.sendMessage(chatId, content);
  }

  onMessageReceived(handler: (message: Message) => Promise<void>): void {
    this.messageHandler = handler;
  }

  isReady(): boolean {
    return this.ready;
  }

  private setupEventHandlers(): void {
    this.client.on('qr', (qr) => {
      console.log('Scan this QR code with your WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('message', async (msg: WAMessage) => {
      if (this.messageHandler) {
        const message = await this.convertToMessage(msg);
        await this.messageHandler(message);
      }
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      this.ready = false;
    });
  }

  private async convertToMessage(waMessage: WAMessage): Promise<Message> {
    const contact = await waMessage.getContact();
    
    return {
      id: waMessage.id.id,
      from: contact.number,
      to: waMessage.to,
      content: waMessage.body,
      timestamp: new Date(waMessage.timestamp * 1000),
      type: this.getMessageType(waMessage),
    };
  }

  private getMessageType(waMessage: WAMessage): MessageType {
    if (waMessage.hasMedia) {
      if (waMessage.type === 'image') return MessageType.IMAGE;
      if (waMessage.type === 'audio' || waMessage.type === 'ptt') return MessageType.AUDIO;
      if (waMessage.type === 'video') return MessageType.VIDEO;
      if (waMessage.type === 'document') return MessageType.DOCUMENT;
    }
    return MessageType.TEXT;
  }
}
