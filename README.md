# Task Manager

A full-stack Task Management application built with **Clean Architecture** and designed with a strong focus on maintainability, separation of concerns, and scalable code organization.

The project allows users to create and manage teams, invite members, search for users, and manage tasks through a structured backend architecture.

---

## 🚀 Features

* User authentication
* Team creation and management
* Team member management
* User search
* Team invitations
* Accept / decline invitations
* Task creation and management
* Task assignment
* Task status management
* RESTful API
* Centralized error handling
* Input validation
* Clean Architecture
* Repository Pattern
* Use Case Pattern
* Dependency Injection

---

## 🏗️ Architecture

The backend follows **Clean Architecture** principles.

The main goal is to keep business logic independent from frameworks, databases, and external services.

```text
                 ┌─────────────────────┐
                 │    Presentation     │
                 │                     │
                 │ Controllers / HTTP  │
                 │ Routes / Middleware │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │     Application     │
                 │                     │
                 │      Use Cases      │
                 │        DTOs         │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │       Domain        │
                 │                     │
                 │ Entities / Contracts│
                 │   Business Rules    │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Infrastructure    │
                 │                     │
                 │ PostgreSQL / Redis  │
                 │ Repositories / ORM  │
                 └─────────────────────┘
```

### Dependency Rule

Dependencies point toward the inner layers.

```text
Infrastructure ──────► Application ──────► Domain
Presentation  ───────► Application ──────► Domain
```

The domain and application layers do not depend directly on frameworks or database implementations.

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
│   └── services/
│
├── presentation/
│   ├── controllers/
│   ├── routes/
│   └── middleware/
│
├── config/
│
└── main.ts
```

The exact structure may vary depending on the feature, but the architectural boundaries remain the same.

---

## 🧩 Layers

### Domain

The domain contains the core business concepts and contracts.

```text
Domain
├── Entities
├── Repository Interfaces
└── Domain Errors
```

The domain does not know about:

* Express
* PostgreSQL
* Redis
* HTTP
* ORM implementations

This keeps the core business logic independent of infrastructure.

---

### Application

The application layer contains the application's use cases.

Examples:

```text
CreateTeam
SearchUsers
SendInvitation
AcceptInvitation
DeclineInvitation
CreateTask
UpdateTask
DeleteTask
```

A use case coordinates the business operation without knowing how data is actually stored.

Example:

```typescript
export class SearchUsersUseCase {
    constructor(
        private readonly teamMemberRepo: TeamMemberRepo
    ) {}

    async execute(username: string) {
        return this.teamMemberRepo.searchUsers(username);
    }
}
```

The use case depends on a repository abstraction rather than directly querying the database.

---

### Infrastructure

Infrastructure contains implementations of external concerns.

For example:

```text
Infrastructure
│
├── PostgreSQL
├── Repository Implementations
├── Redis
└── External Services
```

For example, the application may depend on:

```typescript
interface TeamMemberRepo {
    searchUsers(username: string): Promise<User[]>;
}
```

while infrastructure provides the implementation:

```typescript
class TeamMemberRepository implements TeamMemberRepo {
    async searchUsers(username: string) {
        // PostgreSQL implementation
    }
}
```

This allows the database implementation to change without rewriting the use case.

---

### Presentation

The presentation layer handles HTTP-specific concerns.

```text
Request
   │
   ▼
Route
   │
   ▼
Controller
   │
   ▼
Use Case
   │
   ▼
Repository
```

Controllers are intentionally kept thin and delegate business operations to application use cases.

---

## 🔌 Repository Pattern

Repositories provide an abstraction between the application and persistence layer.

```text
             Application
                  │
                  ▼
        Repository Interface
                  │
                  ▼
       Repository Implementation
                  │
                  ▼
             PostgreSQL
```

This follows the **Dependency Inversion Principle** and makes the application easier to test and maintain.

---

## 🎯 Use Case Pattern

Each important business operation is represented by a dedicated use case.

For example:

```text
use-cases/
│
├── create-team/
├── search-users/
├── send-invitation/
├── accept-invitation/
├── decline-invitation/
├── create-task/
├── update-task/
└── delete-task/
```

This avoids placing business logic directly inside controllers or routes.

---

## 🛡️ Error Handling

The application uses centralized error handling.

Instead of every controller manually handling every possible error:

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

This provides consistent API responses and keeps individual components focused on their responsibilities.

---

## 🔐 Authentication

Authentication is separated from the application's business logic.

The request lifecycle follows approximately:

```text
Client
  │
  ▼
Authentication Middleware
  │
  ▼
Controller
  │
  ▼
Use Case
  │
  ▼
Repository
```

Authentication-related concerns remain at the appropriate infrastructure/presentation boundaries rather than being mixed with domain logic.

---

## 🗄️ Database

The application uses a relational database for persistent data.

Main entities include:

```text
User
Team
TeamMember
Invitation
Task
```

Relationships between entities are enforced at the database level where appropriate.

---

## 📡 API

The backend exposes a RESTful API.

Example endpoints:

```text
Authentication
POST   /auth/register
POST   /auth/login

Users
GET    /users/search

Teams
GET    /teams
POST   /teams
GET    /teams/:id

Invitations
GET    /invites/user
POST   /teams/:id/invites

Tasks
GET    /tasks
POST   /tasks
GET    /tasks/:id
PATCH  /tasks/:id
DELETE /tasks/:id
```

The exact endpoints may evolve as the project develops.

---

## 🐳 Development

The project can be run locally using the required development services.

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
```

### Start the application

```bash
npm run dev
```

---

## 🧪 Testing Strategy

Clean Architecture makes the application easier to test because business logic is separated from infrastructure.

```text
             Tests
               │
       ┌───────┴────────┐
       ▼                ▼
   Use Cases         Repositories
       │                │
       ▼                ▼
    Mocks            Database
```

Use cases can be tested independently by providing mock repository implementations.

---

## 🧠 Architectural Principles

This project focuses on applying:

* Clean Architecture
* SOLID principles
* Single Responsibility Principle
* Dependency Inversion Principle
* Repository Pattern
* Use Case Pattern
* Dependency Injection
* Separation of Concerns
* Thin Controllers
* Centralized Error Handling
* Interface-based abstractions

---

## 📈 Future Improvements

Possible future improvements include:

* Automated unit and integration tests
* Pagination
* Advanced task filtering
* Task priorities
* Task deadlines
* Real-time notifications
* WebSocket support
* Role-based permissions
* Audit logging
* CI/CD
* Monitoring and observability

These features can be added without significantly changing the core architecture because the business logic is isolated from infrastructure concerns.

---

## 🎯 Project Goal

The goal of this project is to demonstrate how to structure a real-world application using **Clean Architecture** rather than simply building a collection of CRUD endpoints.

The main architectural objective is:

```text
Independent Business Logic
          +
Clear Separation of Concerns
          +
Dependency Inversion
          +
Maintainable Code
          =
Scalable Application Structure
```

The project prioritizes **architecture, maintainability, and separation of responsibilities** while implementing a practical Task Management system.
