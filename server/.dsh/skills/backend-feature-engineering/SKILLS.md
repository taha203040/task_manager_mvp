---
name: backend-feature-engineering
description: >
  Implement backend features using the existing
  Clean Architecture. Use for REST APIs,
  database integration, authorization, and testing.
---

# Backend Feature Engineering

## 1. Scope Control
- Inspect only files relevant to the task.
- Avoid exploring the entire repository.
- Stop exploration once sufficient context is available.

## 2. Architecture
- Follow the existing Clean Architecture.
- Keep controllers thin.
- Put business logic in use cases.
- Use existing repository interfaces.
- Do not introduce unnecessary abstractions.

## 3. Security
- Check authentication and authorization.
- Prevent IDOR and BOLA.
- Validate team and project membership.
- Use parameterized SQL queries.

## 4. Testing
- Write focused unit tests.
- Test authorization failures.
- Test database transactions when relevant.