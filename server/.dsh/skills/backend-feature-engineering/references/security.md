# Backend Security Reference

## Purpose

Apply authorization and data-access controls to every backend feature. Authentication alone does not establish permission to access a resource.

Use the project's existing authentication middleware, identity model, validation library, database client, and error-handling conventions. Do not introduce a parallel security system.

## 1. Authentication and Identity

- Require authentication on every private endpoint.
- Obtain the acting user's identity from the verified authentication context populated by middleware.
- Never trust `owner_id`, `user_id`, `member_id`, or role values supplied by the request body or query string as proof of identity.
- Do not accept a user ID from the client when the operation should use the authenticated user.
- Ensure middleware rejects missing, invalid, expired, or malformed credentials according to existing conventions.
- Keep authentication separate from resource authorization.

## 2. Authorization: Deny by Default

For every operation, answer these questions before implementation:

1. Who is the authenticated actor?
2. Which team or project owns the resource?
3. Is the actor a member of that team/project?
4. What role does the actor have?
5. Is that role allowed to perform this exact action?
6. Does the requested resource belong to the authorized scope?

If any required relationship cannot be established, deny the operation.

Do not rely on frontend visibility, disabled buttons, or client-side role checks.

## 3. BOLA / IDOR Prevention

Broken Object Level Authorization occurs when a user can access another user's or team's resource by changing an identifier.

For every endpoint receiving a resource ID:

- Verify that the resource exists within a scope the actor is authorized to access.
- Prefer repository queries that include the authorized scope, rather than fetching globally by ID and trusting the result.
- For a task, verify its project/team relationship and the actor's membership in that scope.
- For a project, verify membership in its owning team or the project's explicit membership policy.
- For files and attachments, verify authorization against the parent task/project and the stored object metadata.
- For invitations, verify that the authenticated user is the intended invitee or an authorized inviter, according to the operation.
- Do not expose another tenant's data through error messages, counts, search results, or nested relations.

A random or unguessable ID is not an authorization control.

## 4. Role and Function Authorization (BFLA)

Broken Function Level Authorization occurs when a user can call an operation that should be restricted to a higher role.

- Define allowed roles per operation, not merely per route group.
- Enforce role checks in the application/use-case boundary or through an established authorization policy used by the use case.
- Treat role information loaded from trusted persistence as authoritative.
- Do not accept role names from request payloads.
- Check permissions for create, update, delete, invite, member management, and other privileged actions independently.
- Verify that role changes cannot be performed by users who lack permission to manage members.

Example policy questions:
- Can a MEMBER create a project, or only an OWNER/ADMIN?
- Can a MEMBER change another member's role?
- Can a task be assigned to a user who is not a member of the project?
- Can a VIEWER add comments or attachments?

Use the actual policy defined by the application; do not invent permissions when the requirements are unclear.

## 5. Input Validation

Validate all untrusted input at the HTTP boundary:

- Path parameters and identifiers.
- Query parameters, including search terms, filters, pagination, and sorting.
- Request body fields and nested objects.
- Enum values such as task status and priority.
- String length, numeric ranges, array size, and required fields.
- File metadata and upload constraints.

Additional rules:

- Reject unknown or invalid enum values instead of silently accepting them.
- Apply sensible limits to pagination and search result sizes.
- Normalize values only where the domain requires it.
- Do not treat validation as authorization.
- Reuse the project's existing validation package and error format.

## 6. SQL and Database Safety

- Use parameterized SQL for every value originating from a request or external source.
- Never build SQL by concatenating untrusted input.
- For dynamic sorting or column selection, map user choices to a fixed allowlist of known identifiers; SQL parameters cannot safely represent identifiers.
- Scope reads, updates, and deletes by both resource identity and authorization context where practical.
- Check affected-row counts when they determine whether an operation succeeded.
- Use transactions for operations that require atomic multi-step writes.
- Keep transaction ownership and commit/rollback behavior explicit.
- Do not leak raw SQL errors, connection strings, or database internals to clients.

## 7. Mass Assignment and Property-Level Authorization

Do not pass the entire request body directly into a database update.

- Explicitly select fields that the caller may change.
- Prevent clients from setting protected fields such as `owner_id`, `created_at`, internal status fields, or roles unless the use case explicitly authorizes that action.
- Separate create/update DTOs from persistence records when needed.
- Check whether the actor may modify each sensitive property, not only the resource as a whole.

## 8. Search and Data Exposure

For member search and similar endpoints:

- Search only within the team/project scope the actor is allowed to see, when the feature is scoped.
- Return only fields required by the UI, such as an approved display name and identifier.
- Do not expose password hashes, tokens, private profile fields, or internal database metadata.
- Apply query length, pagination, and result limits.
- Avoid returning users from unrelated teams merely because their email or username matches.

## 9. File Uploads and Attachments

- Enforce allowed file types and maximum sizes on the server.
- Do not trust the client-provided MIME type or filename by itself.
- Generate storage object keys on the server; do not let users choose arbitrary storage paths.
- Verify access to the parent resource before attaching, downloading, or deleting a file.
- Keep storage credentials and bucket configuration server-side.
- Avoid exposing private object URLs unless the application's access model explicitly permits it.
- Ensure deleting an attachment cannot delete an object belonging to another resource or tenant.

## 10. Invitations and Membership Changes

- Validate invitation state and expiry before accepting or rejecting.
- Ensure the responding user is the intended invitee, unless the product policy explicitly allows an administrator to respond.
- Prevent duplicate membership and duplicate acceptance races using database constraints and/or transactional checks.
- When accepting an invitation requires inserting a team membership and updating the invitation, perform both writes in one database transaction.
- Enforce inviter permissions when creating or revoking invitations.
- Do not trust a client-provided team ID if the invitation record already determines the team.

## 11. Error Handling and Logging

- Return consistent application errors using existing conventions.
- Do not reveal whether another tenant's private resource exists when that would disclose sensitive information.
- Do not return stack traces, SQL text, secrets, tokens, or internal paths.
- Log security-relevant failures with enough context for investigation, but never log passwords, access tokens, refresh tokens, or secret values.
- Avoid logging full sensitive request bodies.

## 12. Security Tests

Add focused tests for both allowed and denied cases.

Minimum checks where relevant:

- Unauthenticated request is rejected.
- Authenticated user cannot access another team's/project's resource.
- User without the required role cannot perform privileged actions.
- User cannot assign a task to an unauthorized/non-member user.
- Client cannot overwrite protected ownership or role fields.
- Search does not return users outside the permitted scope.
- Attachment access/deletion checks the parent resource authorization.
- Invitation response is restricted to the intended invitee.
- Concurrent or repeated invitation acceptance does not create duplicate membership.
- Multi-step writes roll back when one step fails.

## Security Review Checklist

- [ ] Authentication is required.
- [ ] Actor identity comes from verified middleware context.
- [ ] Resource-level authorization is checked (BOLA/IDOR).
- [ ] Function/role authorization is checked (BFLA).
- [ ] Sensitive properties cannot be mass-assigned.
- [ ] Input is validated and bounded.
- [ ] SQL is parameterized.
- [ ] Reads and writes are scoped to authorized resources.
- [ ] Transactions protect atomic workflows.
- [ ] Search and responses expose only permitted data.
- [ ] File operations verify parent-resource access.
- [ ] Errors and logs do not leak secrets or private data.
- [ ] Positive and negative authorization tests pass.
