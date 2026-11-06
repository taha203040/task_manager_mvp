---
name: code-review
description: >
  Review backend code changes for correctness, maintainability, security,
  regressions, and test coverage. Use after implementing a feature or when
  explicitly asked to review a diff, pull request, or selected files.
---

# Code Review

## Objective

Find actionable defects in the changed code. Prioritize correctness, security,
data integrity, and regressions over style preferences.

## Review Scope

1. Identify the requested change and its acceptance criteria.
2. Inspect the diff first.
3. Read only changed files and directly related code needed to verify behavior.
4. Trace affected execution paths when necessary: route, controller, use case,
   repository contract, infrastructure adapter, and tests.
5. Do not explore the entire repository unless the task explicitly requires it.
6. Do not modify files while performing a review unless the user explicitly asks
   you to fix the findings.

## Review Priorities

Review in this order:

1. **Correctness:** Does the code implement the intended behavior? Are edge
   cases and failure paths handled?
2. **Authorization and security:** Can a user access or modify another user's,
   team's, or project's data? Are privileged actions protected?
3. **Data integrity:** Are transactions, constraints, concurrency, and
   idempotency handled correctly where required?
4. **API behavior:** Are request validation, response shape, status codes, and
   error handling consistent with the existing API?
5. **Architecture:** Are responsibilities placed in the correct existing
   Clean Architecture layer? Are dependencies pointing in the correct
   direction?
6. **Reliability:** Are external service failures, timeouts, retries, and
   resource cleanup handled appropriately?
7. **Testing:** Do tests cover the changed behavior, important edge cases, and
   authorization failures?
8. **Maintainability:** Is the change understandable and consistent with local
   conventions, without unnecessary abstractions or unrelated refactoring?

## Backend-Specific Checks

- Controllers should translate HTTP input/output and delegate to use cases.
- Use cases should depend on application contracts, not concrete infrastructure.
- Repository implementations should own persistence-specific queries.
- SQL values must be parameterized.
- Updates must not allow mass assignment of protected fields.
- Resource access must be scoped to the authenticated actor's authorized team
  or project.
- Multi-step writes that must succeed together must use a transaction.
- Check affected-row counts where they determine whether an operation succeeded.
- Validate path parameters, query parameters, request bodies, enums, and limits.
- Avoid leaking stack traces, SQL details, secrets, or private data.
- Do not introduce Kafka, microservices, event-driven architecture, or new
  infrastructure unless explicitly required.

For detailed authorization checks, consult the security reference in the
`backend-feature-engineering` skill when it is available. Do not duplicate that
reference in this skill.

## Finding Quality

Report only findings that are supported by the code.

A finding should:
- Identify a concrete defect or meaningful risk.
- Explain the condition that triggers it.
- Describe its impact.
- Point to the exact file and line range when available.
- Suggest a focused correction.

Do not report:
- Purely subjective style preferences.
- Issues in unchanged code unless the change exposes or materially worsens them.
- Speculative risks without a plausible execution path.
- Missing tests as a standalone finding unless the gap leaves a material
  behavior or security property unverified.

## Severity

Use these levels consistently:

- **Critical:** A severe exploitable vulnerability, data loss, or broad service
  compromise.
- **High:** A significant security, authorization, data-integrity, or
  availability defect.
- **Medium:** A functional defect or reliability issue with a meaningful but
  limited impact.
- **Low:** A minor defect or maintainability issue with limited impact.

Do not inflate severity. Explain assumptions when impact depends on deployment
configuration or product policy.

## Output Format

Start with the overall result:

- `Approve` — no material issues found.
- `Request changes` — one or more material issues require correction.
- `Needs verification` — the review is blocked by missing context or tests.

Then list findings from highest to lowest severity:

### [Severity] Short finding title

- **Location:** `path/to/file.ts:line`
- **Issue:** What is wrong.
- **Trigger:** When the issue occurs.
- **Impact:** What can happen.
- **Recommendation:** The smallest appropriate correction.

If no findings are identified, say so explicitly. Then include a short section
for tests or checks performed and any important verification limitations.

## Review Discipline

- Review the actual diff; do not assume the implementation matches its summary.
- Distinguish confirmed defects from questions or suggestions.
- Do not claim tests passed unless they were actually run and their results were
  observed.
- Do not silently change code during a review.
- Keep the report concise, specific, and actionable.
