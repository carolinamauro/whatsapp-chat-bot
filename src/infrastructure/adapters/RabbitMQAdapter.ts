import * as amqp from 'amqplib';
import { MessageQueueService } from '../../domain/ports';

/**
 * Adapter: RabbitMQ Message Queue Service
 * Implements MessageQueueService using amqplib
 */
export class RabbitMQAdapter implements MessageQueueService {
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private isInitialized: boolean = false;

  constructor(private rabbitMQUrl: string) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Connect to RabbitMQ
      this.connection = await amqp.connect(this.rabbitMQUrl);
      console.log('✓ Connected to RabbitMQ');

      // Create channel
      this.channel = await this.connection.createChannel();
      console.log('✓ RabbitMQ channel created');

      // Handle connection errors
      this.connection.on('error', (err: Error) => {
        console.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.isInitialized = false;
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publish(queueName: string, message: unknown): Promise<void> {
    this.ensureInitialized();

    try {
      // Assert queue exists
      await this.channel!.assertQueue(queueName, {
        durable: true, // Queue survives broker restarts
      });

      // Publish message
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel!.sendToQueue(queueName, messageBuffer, {
        persistent: true, // Message survives broker restarts
      });

      if (!published) {
        throw new Error('Failed to publish message to queue');
      }
    } catch (error) {
      console.error(`Error publishing message to queue ${queueName}:`, error);
      throw error;
    }
  }

  async consume(
    queueName: string,
    handler: (message: unknown) => Promise<void>
  ): Promise<void> {
    this.ensureInitialized();

    try {
      // Assert queue exists
      await this.channel!.assertQueue(queueName, {
        durable: true,
      });

      // Set prefetch to 1 to process one message at a time
      this.channel!.prefetch(1);

      console.log(`Waiting for messages in queue: ${queueName}`);

      // Start consuming messages
      await this.channel!.consume(
        queueName,
        async (msg: amqp.ConsumeMessage | null) => {
          if (msg !== null) {
            try {
              // Parse message
              const content = msg.content.toString();
              const parsedMessage = JSON.parse(content);

              // Process message
              await handler(parsedMessage);

              // Acknowledge message
              this.channel!.ack(msg);
            } catch (error) {
              console.error('Error processing message:', error);
              // Reject message and requeue it
              this.channel!.nack(msg, false, true);
            }
          }
        },
        {
          noAck: false, // Manual acknowledgment
        }
      );
    } catch (error) {
      console.error(`Error consuming from queue ${queueName}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isInitialized = false;
      console.log('✓ RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.channel) {
      throw new Error('RabbitMQ service is not initialized. Call initialize() first.');
    }
  }
}
