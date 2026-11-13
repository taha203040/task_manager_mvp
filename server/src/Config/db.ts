import { Pool } from "pg";
import config from "./envs";

// Credentials come from DATABASE_URL only; nothing is hardcoded (TM-06).
const pool = new Pool({
    connectionString: config.db.connectionString,
    // When TLS is on, certificate verification stays enforced: `false` disables TLS
    // entirely rather than silently accepting an unverified certificate.
    ssl: config.db.ssl ? { rejectUnauthorized: true } : false,
    max: 20,
    connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    // Bounds the blast radius of a runaway query instead of pinning a connection forever.
    statement_timeout: 10_000,
    query_timeout: 10_000,
});

export default pool;
