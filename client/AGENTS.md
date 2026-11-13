# Architecture
- Keep the TanStack file router and existing axios Express integration; the frontend must remain compatible with the user's server.
- Centralize workspace models and mutations in a browser-safe provider; demo data is isolated to mock sessions and never silently replaces failed live requests.
- Use a shared workspace shell and focused feature views for consistent navigation across content routes.
- Keep task API normalization and payloads in the browser-safe task adapter, and load assignment candidates on demand through the workspace provider; this preserves Express contracts without duplicating mapping or fetching users individually.
- Normalize activity responses in a browser-safe activity adapter and fetch them through the workspace provider; activity failures stay separate so invitations remain available.- The public landing page lives at / and the signed-in dashboard at /dashboard; keeps marketing separate from the protected workspace.
