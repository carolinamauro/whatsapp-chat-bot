# Architecture Diagrams

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       External World                         │
│                                                              │
│    ┌─────────────┐         ┌──────────────┐  ┌──────────┐  │
│    │  WhatsApp   │         │  Salesforce  │  │ RabbitMQ │  │
│    │   Users     │         │     CRM      │  │  Queue   │  │
│    └──────┬──────┘         └──────▲───────┘  └────▲─────┘  │
│           │                       │               │        │
└───────────┼───────────────────────┼───────────────┼────────┘
            │                       │               │
            │ Messages              │ API Calls     │ Messages
            │                       │               │
┌───────────▼───────────────────────┼───────────────┼────────┐
│                                   │               │        │
│                   Infrastructure Layer            │        │
│                   (Adapters)                      │        │
│                                                   │        │
│    ┌──────────────────────┐     ┌────────────────▼─────┐  │
│    │  WhatsAppAdapter     │     │  SalesforceAdapter   │  │
│    │ (whatsapp-web.js)    │     │    (jsforce)         │  │
│    └──────────┬───────────┘     └──────────────────────┘  │
│               │                                            │
│    ┌──────────▼───────────┐     ┌────────────────────────┐│
│    │  RabbitMQAdapter     │────▶│  SalesforceWorker      ││
│    │   (amqplib)          │     │  (Background Process)  ││
│    └──────────────────────┘     └────────────────────────┘│
│                                                            │
└───────────────┼────────────────────────────────────────────┘
                │
                │ implements
                │ MessagingService, MessageQueueService
                │
┌───────────────▼────────────────────────────────────────────┐
│                                                             │
│                      Application Layer                      │
│                        (Use Cases)                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        HandleIncomingMessageUseCase                  │  │
│  │  • Process messages                                  │  │
│  │  • Create/update contacts                           │  │
│  │  • Queue Salesforce operations (async) 🆕           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          SendMessageUseCase                          │  │
│  │  • Send messages through messaging service           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      CreateSalesforceCaseUseCase                     │  │
│  │  • Create cases from conversations                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────┬───────────────────────────────────────────┘
                  │ uses
                  │ domain models & ports
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                                                             │
│                       Domain Layer                          │
│                    (Business Logic)                         │
│                                                             │
│  ┌────────────────┐    ┌────────────────┐                  │
│  │    Models      │    │     Ports      │                  │
│  │                │    │  (Interfaces)  │                  │
│  │  • Message     │    │                │                  │
│  │  • Contact     │    │  • Messaging   │                  │
│  │  • Conversation│    │    Service     │                  │
│  │                │    │  • CRM Service │                  │
│  │                │    │  • MessageQueue│ 🆕               │
│  │                │    │  • Repositories│                  │
│  └────────────────┘    └────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Message Flow Sequence (with RabbitMQ) 🆕

```
User       WhatsApp   Bot        Use Case     Repository  RabbitMQ   Salesforce
 │           API     Service      Layer         Layer      Queue      Worker/API
 │            │         │           │             │          │           │
 ├─Message────>│        │           │             │          │           │
 │            │         │           │             │          │           │
 │            ├─Receive─>│          │             │          │           │
 │            │         │           │             │          │           │
 │            │         ├─Handle────>│            │          │           │
 │            │         │           │             │          │           │
 │            │         │           ├─Find Contact>│         │           │
 │            │         │           │             │          │           │
 │            │         │           │<─Contact────┤          │           │
 │            │         │           │  (or null)  │          │           │
 │            │         │           │             │          │           │
 │            │         │           ├─Queue───────────────────>│         │
 │            │         │           │ Create                 │           │
 │            │         │           │ Contact ⚡ NON-BLOCKING│           │
 │            │         │           │             │          │           │
 │            │         │           ├─Save Contact>│         │           │
 │            │         │           │             │          │           │
 │            │         │           ├─Find/Create─>│         │           │
 │            │         │           │ Conversation│          │           │
 │            │         │           │             │          │           │
 │            │         │           ├─Update──────>│         │           │
 │            │         │           │ Conversation│          │           │
 │            │         │           │             │          │           │
 │            │         │<─Complete─┤             │          │           │
 │            │         │           │             │          │           │
 │            │<─Send───┤           │             │          │           │
 │            │ Instant │           │             │          │           │
 │            │ Reply!  │           │             │          │           │
 │<─Reply─────┤         │           │             │          │           │
 │            │         │           │             │          │           │
 │                      │           │             │          │           │
 │            [PARALLEL BACKGROUND PROCESSING]    │          │           │
 │                      │           │             │          │           │
 │                      │           │             │      ┌───▼─────┐     │
 │                      │           │             │      │Consume  │     │
 │                      │           │             │      │Message  │     │
 │                      │           │             │      └───┬─────┘     │
 │                      │           │             │          │           │
 │                      │           │             │          ├─Process───>│
 │                      │           │             │          │   Create  │
 │                      │           │             │          │   Contact │
 │                      │           │             │          │           │
 │                      │           │             │          │<─Success──┤
 │                      │           │             │          │  or Retry │
```

## Directory Structure

```
whatsapp-chat-bot/
│
├── src/
│   ├── domain/              # Core business logic
│   │   ├── models/          # Business entities
│   │   │   └── index.ts     # Message, Contact, Conversation
│   │   │
│   │   └── ports/           # Interfaces for external dependencies
│   │       ├── CRMService.ts
│   │       ├── MessagingService.ts
│   │       ├── MessageQueueService.ts     # 🆕 RabbitMQ interface
│   │       ├── ContactRepository.ts
│   │       └── ConversationRepository.ts
│   │
│   ├── application/         # Use cases / Business rules
│   │   └── use-cases/
│   │       ├── HandleIncomingMessageUseCase.ts    # 🆕 Now queues operations
│   │       ├── SendMessageUseCase.ts
│   │       └── CreateSalesforceCaseUseCase.ts
│   │
│   ├── infrastructure/      # External dependencies
│   │   ├── adapters/        # External service implementations
│   │   │   ├── WhatsAppAdapter.ts
│   │   │   ├── SalesforceAdapter.ts
│   │   │   └── RabbitMQAdapter.ts         # 🆕 Queue implementation
│   │   │
│   │   ├── workers/         # 🆕 Background workers
│   │   │   └── SalesforceWorker.ts        # 🆕 Processes queue messages
│   │   │
│   │   ├── repositories/    # Data persistence
│   │   │   ├── InMemoryContactRepository.ts
│   │   │   └── InMemoryConversationRepository.ts
│   │   │
│   │   └── config/          # Configuration management
│   │       └── index.ts
│   │
│   ├── api/                 # Entry points
│   │   └── BotService.ts    # Main orchestrator
│   │
│   └── index.ts             # Application entry point
│
├── docs/                    # Documentation
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── QUICKSTART.md
│   └── DIAGRAMS.md (this file)
│
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## Data Model

```
┌─────────────────────────┐
│       Contact           │
├─────────────────────────┤
│ id: string              │
│ phoneNumber: string     │
│ name?: string           │
│ salesforceId?: string   │
│ metadata?: object       │
└────────┬────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────┐
│     Conversation        │
├─────────────────────────┤
│ id: string              │
│ contactId: string       │◄────┐
│ messages: Message[]     │     │
│ startedAt: Date         │     │
│ lastMessageAt: Date     │     │ Contains
│ salesforceCaseId?: str  │     │
│ status: Status          │     │
└────────┬────────────────┘     │
         │                      │
         │ Contains             │
         │                      │
         ▼                      │
┌─────────────────────────┐     │
│       Message           │     │
├─────────────────────────┤     │
│ id: string              │     │
│ from: string            │─────┘
│ to: string              │
│ content: string         │
│ timestamp: Date         │
│ type: MessageType       │
└─────────────────────────┘
```

## Dependency Flow

The arrows show the direction of dependencies:

```
                Infrastructure Layer
                        ▲
                        │
                        │ depends on
                        │
                Application Layer
                        ▲
                        │
                        │ depends on
                        │
                   Domain Layer
                 (no dependencies)
```

## Extension Points

### Adding a New Messaging Platform

```
1. Create adapter: TelegramAdapter.ts
   └── implements MessagingService

2. Use in BotService
   └── new BotService(telegramAdapter, crmService)
```

### Adding a New CRM

```
1. Create adapter: HubSpotAdapter.ts
   └── implements CRMService

2. Use in BotService
   └── new BotService(messagingService, hubspotAdapter)
```

### Adding Database Persistence

```
1. Create repository: PostgresContactRepository.ts
   └── implements ContactRepository

2. Use in BotService
   └── const contactRepo = new PostgresContactRepository(db)
```

---

For more details, see:
- [ARCHITECTURE.md](ARCHITECTURE.md) for in-depth architecture explanation
- [README.md](README.md) for setup and features
- [QUICKSTART.md](QUICKSTART.md) for getting started quickly
