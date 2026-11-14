/**
 * Deterministic, non-secret environment for the test run. Loaded by jest's
 * `setupFiles`, so it runs before any test module is imported - which matters because
 * src/Config/envs.ts validates process.env at import time (TM-06, fail closed).
 */
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = "test-only-secret-never-used-in-any-real-deployment";
process.env.JWT_EXPIRES_IN = "1h";
// Nothing listens on port 1, so connection attempts fail immediately (ECONNREFUSED).
// Tests that must not touch a database stay fast instead of waiting for a timeout.
process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.DATABASE_SSL = "false";
process.env.DB_CONNECT_TIMEOUT_MS = "2000";
process.env.TRUST_PROXY_HOPS = "1";
