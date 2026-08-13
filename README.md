# Task Manager

A scalable task management system designed to demonstrate modern backend architecture, clean code principles, event-driven communication, and reliable distributed processing.

The project focuses not only on CRUD operations, but also on **scalability, maintainability, reliability, idempotency, asynchronous processing, and fault tolerance**.

---

## 🚀 Features

* User authentication and authorization
* Team management
* Task creation and assignment
* Task status management
* Invitations and team membership
* User search
* Notifications
* RESTful API
* Clean Architecture
* Event-driven architecture
* Kafka-based asynchronous processing
* Redis caching and fast-access operations
* Idempotent event processing
* Dead Letter Queue (DLQ)
* Retry mechanisms
* PostgreSQL persistence
* Dockerized development environment
* Centralized error handling
* Input validation
* Structured application layers

---

## 🏗️ Architecture

The backend follows **Clean Architecture** principles.

```text
┌─────────────────────────────────────────────┐
│                 Presentation                │
│                                             │
│       Controllers / Routes / Middleware     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                Application                  │
│                                             │
│          Use Cases / DTOs / Services        │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                  Domain                     │
│                                             │
│        Entities / Business Rules            │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│               Infrastructure                │
│                                             │
│ PostgreSQL / Redis / Kafka / External APIs  │
└─────────────────────────────────────────────┘
```

The dependency direction points inward, allowing business logic to remain independent from frameworks and infrastructure.

---

## 📁 Project Structure

```text
src/
│
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── errors/
│
├── application/
│   ├── use-cases/
│   ├── dto/
│   └── services/
│
├── infrastructure/
│   ├── database/
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── migrations/
│   │
│   ├── kafka/
│   │   ├── producers/
│   │   └── consumers/
│   │
│   └── redis/
│
├── presentation/
│   ├── controllers/
│   ├── routes/
│   └── middlewares/
│
├── config/
│
└── main.ts
```

---

## 🔄 Event-Driven Architecture

The system uses Kafka for asynchronous communication between components.

Example:

```text
User Action
     │
     ▼
API
     │
     ▼
Use Case
     │
     ├──────────────► PostgreSQL
     │
     ▼
Kafka Producer
     │
     ▼
Kafka Topic
     │
     ▼
Kafka Consumer
     │
     ├──────────────► Redis
     │
     └──────────────► PostgreSQL
```

This allows expensive or asynchronous operations to be removed from the main HTTP request lifecycle.

---

## 📨 Kafka

Kafka is used for asynchronous event processing.

Example event:

```json
{
  "eventId": "uuid",
  "type": "task.created",
  "timestamp": "2026-08-14T00:00:00.000Z",
  "payload": {
    "taskId": "123",
    "userId": "456"
  }
}
```

### Consumer Groups

Consumers are organized using Kafka consumer groups.

```text
                Kafka
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    Consumer A          Consumer B
        │                   │
        └──── Consumer Group┘
```

Kafka distributes partitions between consumers belonging to the same group.

---

## ♻️ Idempotent Processing

Distributed systems may deliver the same event more than once.

The application therefore uses an idempotency mechanism.

```text
Incoming Event
      │
      ▼
Check eventId in Redis
      │
 ┌────┴────┐
 │         │
Exists   Not Found
 │         │
 ▼         ▼
Skip     Process
           │
           ▼
      PostgreSQL
```

Redis provides a fast-path check while PostgreSQL provides a database-level consistency backstop.

For example:

```text
Redis
  │
  └── processed:event-id

PostgreSQL
  │
  └── processed_events
```

This prevents the same event from applying its business operation multiple times.

---

## 💀 Dead Letter Queue

Events that cannot be processed successfully after the configured retry attempts are moved to a Dead Letter Queue.

```text
Kafka Topic
     │
     ▼
 Consumer
     │
     ▼
   Retry
  /  |  \
 1   2   3
     │
     ▼
  Failure
     │
     ▼
    DLQ
```

Example topics:

```text
task.events
task.events.dlq
```

The DLQ allows failed events to be investigated and reprocessed without blocking the main event stream.

---

## 🔁 Retry Strategy

Transient failures are retried before sending an event to the DLQ.

```text
Process Event
     │
     ├── Success ─────► Done
     │
     └── Failure
           │
           ▼
         Retry
           │
           ├── Success ─────► Done
           │
           └── Max retries
                    │
                    ▼
                   DLQ
```

Retries are intended for temporary failures such as:

* Database connection failures
* Redis temporarily unavailable
* Network errors
* Temporary service failures

Permanent business errors should not be endlessly retried.

---

## ⚡ Redis

Redis is used for fast-access data and distributed application concerns.

Potential use cases include:

* Caching
* Idempotency
* Rate limiting
* Temporary state
* Session-related data

Example:

```text
Application
     │
     ▼
   Redis
     │
     ├── Cache
     ├── Idempotency
     └── Rate Limits
```

---

## 🗄️ PostgreSQL

PostgreSQL is the primary relational database.

Main entities include:

```text
User
Team
TeamMember
Task
Invitation
ProcessedEvent
```

Relationships are modeled using relational constraints to maintain data integrity.

---

## 🔐 Authentication

Authentication is handled through secure HTTP mechanisms.

The application separates authentication concerns from business logic through middleware and application services.

Typical request flow:

```text
Client
  │
  ▼
Authentication Middleware
  │
  ├── Invalid ──► 401
  │
  ▼
Controller
  │
  ▼
Use Case
```

---

## 🛡️ Error Handling

The application uses centralized error handling rather than implementing response logic independently inside every controller.

```text
Controller
    │
    ▼
Use Case
    │
    ▼
Error
    │
    ▼
Central Error Handler
    │
    ▼
HTTP Response
```

This keeps controllers focused on handling HTTP concerns while application logic remains independent.

---

## 📡 API

The API follows REST principles.

Example endpoints:

```text
POST   /auth/login
POST   /auth/register

GET    /users/search

GET    /teams
POST   /teams
GET    /teams/:id

POST   /teams/:id/invites
GET    /invites/user

GET    /tasks
POST   /tasks
GET    /tasks/:id
PATCH  /tasks/:id
DELETE /tasks/:id
```

The exact endpoints may evolve as the application develops.

---

## 🐳 Docker

The project can be run using Docker to provide consistent development infrastructure.

Typical services:

```text
┌────────────────────────────┐
│        Application         │
└──────────────┬─────────────┘
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
   PostgreSQL Redis    Kafka
```

This makes the development environment reproducible and simplifies running infrastructure dependencies locally.

---

## 🧪 Testing

The project is designed to support different levels of testing:

```text
Unit Tests
    │
    ▼
Use Cases / Domain Logic

Integration Tests
    │
    ▼
Database / Redis / Kafka

End-to-End Tests
    │
    ▼
HTTP API
```

The goal is to keep business logic highly testable by isolating it from infrastructure.

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/task_manager

REDIS_URL=redis://localhost:6379

KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=task-manager
KAFKA_GROUP_ID=task-manager-consumer
```

Never commit real credentials or secrets to the repository.

---

## ▶️ Running the Project

### 1. Clone the repository

```bash
git clone <repository-url>

cd task-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Update the environment variables according to your local setup.

### 4. Start infrastructure

```bash
docker compose up -d
```

### 5. Start the application

```bash
npm run dev
```

The API should then be available at:

```text
http://localhost:3000
```

---

## 🧠 Engineering Concepts Demonstrated

This project was built to practice and demonstrate:

* Clean Architecture
* SOLID principles
* Dependency Inversion
* Repository Pattern
* Use Case Pattern
* REST API design
* Event-driven architecture
* Message brokers
* Kafka consumer groups
* Idempotent event processing
* Retry strategies
* Dead Letter Queues
* Redis caching
* Database transactions
* PostgreSQL constraints
* Distributed-system reliability
* Docker
* Centralized error handling
* API validation

---

## 📈 Future Improvements

Possible future improvements include:

* WebSocket-based real-time task updates
* Advanced task filtering and pagination
* Full-text search
* Redis distributed locks
* Kafka partitioning strategy
* Observability with OpenTelemetry
* Prometheus metrics
* Grafana dashboards
* Structured logging
* CI/CD pipeline
* Kubernetes deployment
* Horizontal scaling
* Automated integration testing
* Event replay mechanisms

---

## 🎯 Project Goal

The goal of this project is to build more than a simple CRUD Task Manager.

It is intended to demonstrate how a real-world backend can be structured to remain:

**Scalable → Maintainable → Reliable → Testable**

while introducing distributed-system concepts such as asynchronous processing, idempotency, retries, and failure recovery.

---

## 📝 License

This project is for educational and portfolio purposes.
