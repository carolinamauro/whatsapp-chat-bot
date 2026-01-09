# WhatsApp Chatbot with Salesforce Integration

A production-ready WhatsApp chatbot integrated with Salesforce, built following hexagonal architecture (ports and adapters) principles for clean, maintainable, and testable code.

## 🏗️ Architecture

This project follows **Hexagonal Architecture** (also known as Ports and Adapters), which promotes separation of concerns and makes the application more maintainable and testable.

```
src/
├── domain/              # Core business logic (independent of frameworks)
│   ├── models/         # Domain entities (Message, Contact, Conversation)
│   └── ports/          # Interfaces for external dependencies
├── application/         # Use cases / Business rules
│   └── use-cases/      # Application-specific business rules
├── infrastructure/      # External concerns (frameworks, databases, APIs)
│   ├── adapters/       # Implementations of ports (WhatsApp, Salesforce)
│   ├── repositories/   # Data persistence implementations
│   └── config/         # Configuration management
└── api/                 # Entry points and controllers
```

### Architecture Benefits

- **Independence**: Core business logic doesn't depend on external frameworks
- **Testability**: Easy to test by mocking the ports
- **Flexibility**: Easy to swap implementations (e.g., change WhatsApp library)
- **Maintainability**: Clear separation of concerns makes code easier to understand

## 🚀 Features

- ✅ WhatsApp integration using whatsapp-web.js
- ✅ Salesforce CRM integration using jsforce
- ✅ **RabbitMQ for asynchronous Salesforce operations** 🆕
- ✅ Automatic contact synchronization with Salesforce (async)
- ✅ Conversation tracking and management
- ✅ Salesforce Case creation from conversations
- ✅ Auto-reply functionality
- ✅ Clean hexagonal architecture
- ✅ TypeScript for type safety
- ✅ Environment-based configuration
- ✅ Improved user experience with non-blocking operations

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Salesforce account with API access
- WhatsApp account for the bot
- **RabbitMQ server** (local or cloud instance) 🆕

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/carolinamauro/whatsapp-chat-bot.git
cd whatsapp-chat-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` file with your Salesforce and RabbitMQ credentials:
```env
SALESFORCE_USERNAME=your-salesforce-username
SALESFORCE_PASSWORD=your-salesforce-password
SALESFORCE_SECURITY_TOKEN=your-security-token
SALESFORCE_LOGIN_URL=https://login.salesforce.com

RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE_NAME=salesforce-operations

BOT_NAME=WhatsApp Bot
BOT_WELCOME_MESSAGE=Hello! I'm your Salesforce assistant. How can I help you today?
```

5. Start RabbitMQ (if running locally):
```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Or install locally from https://www.rabbitmq.com/download.html
```

## 🏃 Running the Bot

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

### Linting and formatting:
```bash
npm run lint
npm run format
```

## 📱 First Time Setup

1. Run the bot: `npm run dev`
2. Scan the QR code with your WhatsApp app:
   - Open WhatsApp on your phone
   - Go to Settings > Linked Devices > Link a Device
   - Scan the QR code displayed in the terminal
3. Wait for the bot to connect
4. Send a test message to the bot's WhatsApp number

## 🔌 How It Works

### Message Flow with RabbitMQ

1. **User sends a WhatsApp message** → WhatsApp adapter receives it
2. **Message is converted** to domain model
3. **HandleIncomingMessageUseCase** processes the message:
   - Finds or creates contact in local repository
   - **Queues** contact creation for Salesforce (non-blocking) 🆕
   - Finds or creates conversation
   - Adds message to conversation
   - **Queues** case comment for Salesforce if case exists (non-blocking) 🆕
4. **Auto-reply logic** sends response immediately
5. **Salesforce Worker** (background process) processes queued operations:
   - Creates contacts in Salesforce
   - Adds comments to cases
   - Automatically retries on failure

### Benefits of Async Processing

- 🚀 **Instant Response**: Users get immediate replies without waiting for Salesforce
- 🔄 **Fault Tolerance**: Operations automatically retry if Salesforce is slow or unavailable
- 📈 **Scalability**: Worker can be scaled independently
- 🛡️ **Reliability**: Durable queues ensure no operations are lost

### Salesforce Integration

- **Contacts**: Automatically created in Salesforce when a new user messages the bot (async)
- **Cases**: Can be created from conversations for customer support
- **Comments**: Messages are added as comments to related Salesforce Cases (async)

## 🧪 Testing

```bash
npm test
```

## 📚 Project Structure Details

### Domain Layer (`src/domain/`)

Contains pure business logic with no external dependencies:

- **Models**: Core entities like `Message`, `Contact`, `Conversation`
- **Ports**: Interfaces that define contracts for external services
  - `MessagingService`: Interface for messaging platforms
  - `CRMService`: Interface for CRM systems
  - `ContactRepository`: Interface for contact storage
  - `ConversationRepository`: Interface for conversation storage

### Application Layer (`src/application/`)

Contains use cases that orchestrate the domain logic:

- `HandleIncomingMessageUseCase`: Processes incoming messages
- `SendMessageUseCase`: Sends messages through messaging service
- `CreateSalesforceCaseUseCase`: Creates cases in Salesforce

### Infrastructure Layer (`src/infrastructure/`)

Contains implementations of the ports and external dependencies:

- **Adapters**:
  - `WhatsAppAdapter`: Implements `MessagingService` using whatsapp-web.js
  - `SalesforceAdapter`: Implements `CRMService` using jsforce
- **Repositories**:
  - `InMemoryContactRepository`: In-memory contact storage
  - `InMemoryConversationRepository`: In-memory conversation storage
- **Config**: Environment configuration management

### API Layer (`src/api/`)

Contains entry points and orchestration:

- `BotService`: Main bot orchestrator that wires everything together

## 🔒 Security Considerations

- Store credentials in `.env` file (never commit this file)
- Use Salesforce security tokens for API access
- Keep dependencies updated
- Review and sanitize user inputs

## 🛠️ Extending the Bot

### Adding a New Messaging Platform

1. Create a new adapter implementing `MessagingService` interface
2. Replace `WhatsAppAdapter` with your adapter in `src/index.ts`

### Adding a New CRM

1. Create a new adapter implementing `CRMService` interface
2. Replace `SalesforceAdapter` with your adapter in `src/index.ts`

### Adding Database Persistence

1. Create new repository implementations (e.g., `PostgresContactRepository`)
2. Replace in-memory repositories in `BotService`

### Adding New Use Cases

1. Create a new use case in `src/application/use-cases/`
2. Follow the pattern of existing use cases
3. Wire it up in `BotService` or create a new controller

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Follow the existing architecture patterns
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🐛 Troubleshooting

### QR Code not showing
- Make sure your terminal supports QR code display
- Try running in a different terminal

### Salesforce authentication fails
- Verify your credentials in `.env`
- Make sure to append security token to password
- Check if your IP is whitelisted in Salesforce

### RabbitMQ connection fails 🆕
- Ensure RabbitMQ is running (`docker ps` or check service status)
- Verify RABBITMQ_URL in `.env` matches your RabbitMQ instance
- Check RabbitMQ logs for connection issues
- Default port 5672 should be accessible

### Messages not syncing to Salesforce 🆕
- Check Salesforce worker logs for errors
- Verify queue has messages: RabbitMQ Management UI (http://localhost:15672)
- Ensure Salesforce credentials are valid
- Operations will retry automatically on failure

### WhatsApp disconnects frequently
- This might be due to WhatsApp's security policies
- Try using a dedicated phone number for the bot

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions

---

Built with ❤️ following best practices and hexagonal architecture principles
