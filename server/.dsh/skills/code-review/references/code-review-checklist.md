# Code Review Checklist

Use this checklist against the changed behavior. Skip items that are not
applicable; do not manufacture findings merely to fill every section.

## Correctness
- [ ] Does the implementation satisfy the stated acceptance criteria?
- [ ] Are empty, missing, malformed, and boundary inputs handled?
- [ ] Are success and failure paths both correct?
- [ ] Are asynchronous operations awaited and errors propagated appropriately?

## Authorization and Security
- [ ] Is authentication required where appropriate?
- [ ] Is actor identity taken from trusted middleware context?
- [ ] Is resource-level authorization enforced (BOLA/IDOR)?
- [ ] Are privileged functions protected by role/policy checks (BFLA)?
- [ ] Are protected fields excluded from client-controlled updates?
- [ ] Are query results scoped to authorized resources?
- [ ] Are secrets and sensitive data excluded from responses and logs?

## Persistence and Data Integrity
- [ ] Are SQL values parameterized?
- [ ] Are reads, updates, and deletes scoped correctly?
- [ ] Are multi-write operations transactional when atomicity is required?
- [ ] Are uniqueness constraints and duplicate requests handled?
- [ ] Are affected-row counts and not-found cases handled correctly?
- [ ] Are migrations compatible with existing data and deployment order?

## API and Validation
- [ ] Are route, method, middleware, and controller wiring correct?
- [ ] Are params, query strings, and body validated?
- [ ] Are enum values and pagination limits bounded?
- [ ] Are response shapes and status codes consistent with the API?
- [ ] Are errors mapped to the project's established error format?

## Architecture and Maintainability
- [ ] Are controllers thin?
- [ ] Do use cases depend on abstractions rather than infrastructure?
- [ ] Is persistence logic kept in infrastructure adapters?
- [ ] Is existing dependency wiring reused?
- [ ] Is the change limited to files relevant to the task?
- [ ] Are unnecessary abstractions, dependencies, and unrelated refactors avoided?

## Tests and Verification
- [ ] Are focused unit tests present for application behavior?
- [ ] Are authorization denial cases tested?
- [ ] Are transaction or integration behaviors tested where relevant?
- [ ] Were the relevant tests actually run?
- [ ] Are unverified checks and environmental limitations stated clearly?
