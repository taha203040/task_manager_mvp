import { Pool } from "pg";
import config from "./envs";

export const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }, // Supabase pooler requires TLS
    max: 10,
    application_name: "secure_api",
});

pool.on("error", (error: Error) => {
    console.error("[db] idle client error:", error.message);
});

export default pool;