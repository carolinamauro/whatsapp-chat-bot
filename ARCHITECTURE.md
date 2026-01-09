# Architecture Documentation

## Hexagonal Architecture Overview

This project implements the Hexagonal Architecture pattern (also known as Ports and Adapters) to ensure clean separation of concerns and maintainability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              BotService (Orchestrator)                  │    │
│  │  • Initializes messaging, queue, and services          │    │
│  │  • Coordinates message flow                            │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │                                    │
┌────────────▼─────────────────┐    ┌────────────▼──────────────┐
│   APPLICATION LAYER          │    │   INFRASTRUCTURE LAYER    │
│  ┌────────────────────────┐  │    │  ┌────────────────────┐  │
│  │ HandleIncomingMessage  │  │    │  │  WhatsAppAdapter   │  │
│  │     UseCase            │  │    │  │ (MessagingService) │  │
│  │  • Queues Salesforce   │  │    │  └────────────────────┘  │
│  │    operations (async)  │  │    │  ┌────────────────────┐  │
│  └────────────────────────┘  │    │  │ SalesforceAdapter  │  │
│  ┌────────────────────────┐  │    │  │   (CRMService)     │  │
│  │   SendMessageUseCase   │  │    │  └────────────────────┘  │
│  └────────────────────────┘  │    │  ┌────────────────────┐  │
│  ┌────────────────────────┐  │    │  │  RabbitMQAdapter   │  │
│  │CreateSalesforceCase    │  │    │  │ (MessageQueue)     │  │
│  │     UseCase            │  │    │  └────────────────────┘  │
│  └────────────────────────┘  │    │  ┌────────────────────┐  │
│                              │    │  │ SalesforceWorker   │  │
│                              │    │  │ (Background)       │  │
│                              │    │  └────────────────────┘  │
│                              │    │  ┌────────────────────┐  │
│                              │    │  │   Repositories     │  │
│                              │    │  │  (InMemory)        │  │
└──────────┬───────────────────┘    │  └────────────────────┘  │
           │                        └──────────┬─────────────────┘
           │                                   │
           │                                   │
┌──────────▼───────────────────────────────────▼─────────────────┐
│                       DOMAIN LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │   Models     │  │    Ports      │  │  Business Rules  │     │
│  │              │  │  (Interfaces) │  │                  │     │
│  │ • Message    │  │ • Messaging   │  │ Pure business    │     │
│  │ • Contact    │  │   Service     │  │ logic without    │     │
│  │ • Conversation│ │ • CRM Service │  │ external deps    │     │
│  │              │  │ • MessageQueue│  │                  │     │
│  │              │  │ • Repositories│  │                  │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
          ▲                    ▲                     ▲
          │                    │                     │
  ┌───────┴──────────┐ ┌───────┴─────────┐ ┌────────┴────────┐
  │   WhatsApp API   │ │  Salesforce API │ │   RabbitMQ      │
  │  (External)      │ │   (External)    │ │   (External)    │
  └──────────────────┘ └─────────────────┘ └─────────────────┘
```

## Layer Responsibilities

### 1. Domain Layer (Core)

**Location**: `src/domain/`

**Purpose**: Contains the core business logic and rules, independent of any framework or external system.

**Components**:
- **Models** (`models/`): Pure data structures representing business concepts
  - `Message`: Represents a chat message
  - `Contact`: Represents a user/contact
  - `Conversation`: Represents a conversation thread
  
- **Ports** (`ports/`): Interfaces that define contracts for external dependencies
  - `MessagingService`: Contract for messaging platforms
  - `CRMService`: Contract for CRM systems
  - `MessageQueueService`: Contract for message queue systems (RabbitMQ) 🆕
  - `ContactRepository`: Contract for contact storage
  - `ConversationRepository`: Contract for conversation storage

**Rules**:
- ❌ No dependencies on external frameworks
- ❌ No I/O operations
- ✅ Pure business logic only
- ✅ Framework-agnostic

### 2. Application Layer

**Location**: `src/application/`

**Purpose**: Orchestrates the domain logic to fulfill specific use cases.

**Components**:
- **Use Cases** (`use-cases/`):
  - `HandleIncomingMessageUseCase`: Processes incoming messages, queues Salesforce operations asynchronously 🆕
  - `SendMessageUseCase`: Sends messages through the messaging service
  - `CreateSalesforceCaseUseCase`: Creates Salesforce cases from conversations

**Rules**:
- ❌ No direct framework dependencies
- ✅ Can depend on domain layer
- ✅ Coordinates between domain and ports
- ✅ Contains application-specific business rules

### 3. Infrastructure Layer

**Location**: `src/infrastructure/`

**Purpose**: Implements the ports defined in the domain layer using specific technologies.

**Components**:
- **Adapters** (`adapters/`):
  - `WhatsAppAdapter`: Implements `MessagingService` using whatsapp-web.js
  - `SalesforceAdapter`: Implements `CRMService` using jsforce
  - `RabbitMQAdapter`: Implements `MessageQueueService` using amqplib 🆕
  
- **Workers** (`workers/`): 🆕
  - `SalesforceWorker`: Background consumer that processes queued Salesforce operations
  
- **Repositories** (`repositories/`):
  - `InMemoryContactRepository`: In-memory implementation of `ContactRepository`
  - `InMemoryConversationRepository`: In-memory implementation of `ConversationRepository`
  
- **Config** (`config/`):
  - Environment configuration management (includes RabbitMQ settings)

**Rules**:
- ✅ Implements domain ports
- ✅ Contains framework-specific code
- ✅ Handles external system integration
- ❌ Should not contain business logic

### 4. API Layer

**Location**: `src/api/`

**Purpose**: Entry points for the application, wires everything together.

**Components**:
- `BotService`: Main orchestrator that initializes and coordinates all components

**Rules**:
- ✅ Wires up dependencies
- ✅ Handles initialization
- ❌ Minimal business logic

## Data Flow Examples

### Example 1: Incoming WhatsApp Message (with RabbitMQ) 🆕

```
1. WhatsApp Message arrives
   ↓
2. WhatsAppAdapter receives it
   ↓
3. Converts to domain Message model
   ↓
4. Triggers message handler in BotService
   ↓
5. BotService calls HandleIncomingMessageUseCase
   ↓
6. Use case:
   - Finds/creates Contact (via ContactRepository)
   - Queues contact creation for Salesforce (via MessageQueueService) ⚡ NON-BLOCKING
   - Finds/creates Conversation (via ConversationRepository)
   - Updates conversation with new message
   - Queues case comment if exists (via MessageQueueService) ⚡ NON-BLOCKING
   ↓
7. Auto-reply logic executes IMMEDIATELY (no waiting for Salesforce!)
   ↓
8. SendMessageUseCase sends reply (via MessagingService)
   ↓
9. WhatsAppAdapter sends message via WhatsApp API
   ↓
   [PARALLEL BACKGROUND PROCESSING]
   ↓
10. SalesforceWorker consumes message from queue
    ↓
11. Worker executes Salesforce operation (create contact or add comment)
    ↓
12. On failure: Message is requeued automatically for retry
```

### Example 2: Creating Salesforce Case

```
1. Request to create case for conversation
   ↓
2. CreateSalesforceCaseUseCase executes
   ↓
3. Retrieves Conversation (via ConversationRepository)
   ↓
4. Retrieves Contact (via ContactRepository)
   ↓
5. Validates Contact has Salesforce ID
   ↓
6. Creates Case (via CRMService)
   ↓
7. SalesforceAdapter calls Salesforce API
   ↓
8. Updates Conversation with Case ID
   ↓
9. Saves updated Conversation
```

## Benefits of This Architecture

### 1. Testability
- Easy to unit test domain logic in isolation
- Mock ports for testing use cases
- No need for integration tests for business logic

### 2. Flexibility
- Swap WhatsApp with Telegram: Create `TelegramAdapter` implementing `MessagingService`
- Change from Salesforce to HubSpot: Create `HubSpotAdapter` implementing `CRMService`
- Add database: Create repository implementations for PostgreSQL, MongoDB, etc.

### 3. Maintainability
- Clear separation of concerns
- Each layer has specific responsibilities
- Easy to locate and fix bugs
- Changes in one layer don't affect others

### 4. Independence
- Business logic doesn't depend on frameworks
- Can change external systems without touching core logic
- Framework updates don't affect domain layer

### 5. Asynchronous Processing with RabbitMQ 🆕
- **Improved User Experience**: Instant responses (< 100ms) instead of 2-5 second waits
- **Fault Tolerance**: Automatic retries on Salesforce failures
- **Scalability**: Background workers can scale independently
- **Reliability**: Durable queues ensure no operations are lost
- **Decoupling**: Message handling and Salesforce sync are completely independent

## Design Patterns Used

### 1. Dependency Inversion Principle (DIP)
- High-level modules (use cases) don't depend on low-level modules (adapters)
- Both depend on abstractions (ports/interfaces)

### 2. Repository Pattern
- Abstracts data persistence
- Domain doesn't know about storage details

### 3. Adapter Pattern
- Adapters translate between external systems and domain

### 4. Use Case Pattern
- Each use case represents a single business operation
- Encapsulates business rules

## Extension Points

### Adding a New Messaging Platform

1. Create adapter: `src/infrastructure/adapters/TelegramAdapter.ts`
2. Implement `MessagingService` interface
3. Update `src/index.ts` to use new adapter

```typescript
const telegramAdapter = new TelegramAdapter();
const botService = new BotService(telegramAdapter, salesforceAdapter);
```

### Adding Database Persistence

1. Create repository: `src/infrastructure/repositories/PostgresContactRepository.ts`
2. Implement `ContactRepository` interface
3. Update `BotService` to use new repository

```typescript
const contactRepository = new PostgresContactRepository(dbConnection);
```

### Adding a New Use Case

1. Create file: `src/application/use-cases/NewUseCase.ts`
2. Define use case class with dependencies
3. Inject repositories/services via constructor
4. Wire up in `BotService` or controller

## Testing Strategy

### Unit Tests
- Test domain models (if they have logic)
- Test use cases with mocked ports
- Test adapters in isolation

### Integration Tests
- Test adapter integrations with external systems
- Test repository implementations
- Test full flow with real dependencies

### Example Unit Test

```typescript
describe('HandleIncomingMessageUseCase', () => {
  it('should create new contact for unknown phone number', async () => {
    // Mock repositories and services
    const contactRepo = new MockContactRepository();
    const conversationRepo = new MockConversationRepository();
    const crmService = new MockCRMService();
    
    const useCase = new HandleIncomingMessageUseCase(
      contactRepo,
      conversationRepo,
      crmService
    );
    
    const message = createTestMessage('+1234567890');
    
    await useCase.execute(message);
    
    expect(contactRepo.save).toHaveBeenCalled();
    expect(crmService.createContact).toHaveBeenCalled();
  });
});
```

## Conclusion

This architecture ensures:
- 🎯 Business logic is protected and independent
- 🔧 Easy to maintain and extend
- 🧪 Highly testable
- 🔄 Flexible to change external systems
- 📚 Clear and understandable structure

Follow these principles when adding new features to maintain the architecture's integrity.
