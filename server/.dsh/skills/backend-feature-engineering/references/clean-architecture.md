# Clean Architecture Reference

## Purpose

Implement backend features by extending the project's existing architecture rather than introducing a new architecture or framework.

The dependency direction must remain:

`Interfaces → Application → Domain`

`Infrastructure → Application / Domain`

The Domain layer must not depend on Express, PostgreSQL, MongoDB, AWS, or other infrastructure frameworks.

## Layer Responsibilities

### 1. Domain

**Contains**
- Core business entities and value objects.
- Domain rules and invariants.
- Domain-specific errors, when the project already uses them.

**Rules**
- Keep business rules independent of HTTP and persistence.
- Do not import Express request/response types.
- Do not execute SQL or access external services.
- Avoid adding domain abstractions unless the business rule requires them.

### 2. Application

**Contains**
- Use cases that coordinate application workflows.
- Repository interfaces/contracts.
- Application-level input and output types.
- Application services where the existing codebase uses them.

**Rules**
- A use case expresses one application operation.
- Depend on repository interfaces, not concrete SQL/Mongo implementations.
- Validate business-level conditions and coordinate authorization checks.
- Do not import Express controllers, routers, or infrastructure implementations.
- Keep transaction boundaries explicit when an operation must be atomic.
- Do not move business logic into controllers or repositories.

### 3. Infrastructure

**Contains**
- Implementations of repository interfaces.
- Database queries and persistence mapping.
- External service adapters, such as object storage.
- Technical integrations such as logging and token providers.

**Rules**
- Keep SQL and database-specific behavior here.
- Use parameterized queries; never interpolate untrusted values into SQL.
- Map database records to the types expected by Application/Domain.
- Do not make infrastructure implementations responsible for HTTP status codes.
- Reuse the existing database client, connection pool, and transaction conventions.

### 4. Interfaces (HTTP)

**Contains**
- Routes and HTTP controllers.
- Request validation.
- Authentication/authorization middleware integration.
- HTTP response serialization and status codes.

**Rules**
- Routes define HTTP method, path, middleware, and controller.
- Controllers translate HTTP input into use-case input and translate results into HTTP responses.
- Controllers must remain thin.
- Do not put SQL, repository queries, or business workflows in controllers.
- Do not bypass the use case to call infrastructure repositories directly.
- Follow existing response and error-handling conventions.

## Request-to-Database Flow

For a new endpoint, implement the complete existing application flow:

1. **Route:** register the endpoint and required middleware.
2. **Validation:** validate params, query strings, and body using the project's existing validator.
3. **Controller:** extract authenticated user identity and validated input; invoke the use case.
4. **Use case:** enforce application/business rules and call repository contracts.
5. **Repository interface:** define or extend the contract in the existing Application location.
6. **Infrastructure adapter:** implement the contract using the existing database client.
7. **Composition/DI:** wire the implementation using the project's existing dependency-injection or construction pattern.
8. **Tests:** test the use case and the relevant integration/HTTP behavior supported by the project.

Do not report an endpoint as implemented if any required layer or wiring is missing.

## Repository and Persistence Boundaries

- Repository interfaces belong to the Application layer, following the project's current naming and file conventions.
- Concrete SQL/Mongo implementations belong to Infrastructure.
- Keep database-specific types out of Domain and use-case public contracts.
- Reuse existing repository methods where their semantics match the feature.
- Do not create duplicate repositories for the same aggregate without a clear reason.
- Keep queries scoped to the authenticated user's authorized team/project context.
- Use database transactions for multi-write operations that must succeed or fail together.
- Do not assume that two separate repository calls are atomic.
- Do not add a new ORM, query builder, database client, or dependency unless explicitly required.

## Dependency Injection and Composition

- Inspect the existing composition root and follow its current wiring style.
- Reuse existing constructors, factories, and dependency registration.
- Do not introduce a new DI container or service locator.
- Do not instantiate infrastructure implementations inside use cases.
- Keep configuration and environment access outside Domain and Application business rules.

## Scope-Controlled Repository Inspection

Before changing code:

1. Identify the requested endpoint/use case.
2. Read its route, controller, use case, repository contract, and concrete adapter.
3. Read only directly related entities, validators, middleware, composition code, schema/migrations, and tests.
4. Follow an additional dependency only when a required symbol or behavior cannot be understood otherwise.
5. Stop exploring when the implementation path and conventions are clear.

Do not perform a repository-wide audit, rename unrelated files, or refactor neighboring modules as part of a feature task.

## Change Discipline

- Implement one feature or cohesive vertical slice at a time.
- Preserve existing naming, casing, error conventions, and folder structure.
- Prefer the smallest complete change.
- Do not add Kafka, microservices, event-driven architecture, or background processing unless explicitly requested.
- Do not change API contracts unrelated to the task.
- Do not silently change existing database semantics.
- If a schema change is necessary, add a migration using the project's established migration mechanism.

## Completion Checklist

- [ ] The endpoint is registered and reachable.
- [ ] Request validation follows existing conventions.
- [ ] The controller is thin and invokes a use case.
- [ ] The use case depends on abstractions, not infrastructure.
- [ ] Repository contract and adapter are consistent.
- [ ] Dependency wiring is complete.
- [ ] Authorization is enforced server-side.
- [ ] Database writes use transactions where atomicity is required.
- [ ] Focused tests pass.
- [ ] No unrelated files or architecture were changed.
- [ ] The final report lists files changed, behavior implemented, tests run, and known gaps.
