import { Pool } from "pg";
import config from "./envs";

// Managed Postgres providers sign with their own CA, which is not in Node's trust
// store. It arrives as PEM *text* in SUPABASE_CA because a hosting dashboard only
// offers environment variables: a value pasted as one line keeps the literal
// "\n" sequences, so turn them back into real newlines before handing it to TLS.
const supabaseCa = process.env.SUPABASE_CA?.replace(/\\n/g, "\n");

// Credentials come from DATABASE_URL only; nothing is hardcoded (TM-06).
const pool = new Pool({
    connectionString: config.db.connectionString,
    // When TLS is on, certificate verification stays enforced: `false` disables TLS
    // entirely rather than silently accepting an unverified certificate.
    ssl: config.db.ssl ? { rejectUnauthorized: true, ca: supabaseCa } : false,
    max: 20,
    connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    // Bounds the blast radius of a runaway query instead of pinning a connection forever.
    statement_timeout: 10_000,
    query_timeout: 10_000,
});

export default pool;
