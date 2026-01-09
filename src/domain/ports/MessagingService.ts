import { Message } from '../models';

/**
 * Port: Messaging Service
 * Interface for sending and receiving messages through messaging platforms
 */
export interface MessagingService {
  initialize(): Promise<void>;
  sendMessage(to: string, content: string): Promise<void>;
  onMessageReceived(handler: (message: Message) => Promise<void>): void;
  isReady(): boolean;
}
