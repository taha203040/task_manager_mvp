// server/src/Config/envs.ts (top of file, replace the two dotenv lines)
import dotenv from "dotenv";
import path from "path";
import { getServerRoot } from "../Shared/utils/module-paths";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
// .env / .env.production sit at the server package root, which is what dotenv
// used to reach with `path.resolve(__dirname, "../../", envFile)`. getServerRoot()
// returns the same directory under CommonJS (ts-node from src/, node from dist/)
// and falls back to the working directory inside the bundled ESM function, where
// no env files exist and the platform environment variables are authoritative.
dotenv.config({ path: path.resolve(getServerRoot(), envFile), quiet: true });
/** HS256 needs real entropy; a short shared secret is brute-forceable offline. */
const MIN_JWT_SECRET_LENGTH = 32;

export interface TaskyConfig {
    app: {
        port: number;
        env: string;
        /** Trusted reverse-proxy hops in front of the API (0 = directly exposed). */
        trustProxyHops: number;
    };
    db: {
        connectionString: string;
        ssl: boolean;
        connectionTimeoutMillis: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
}

function required(env: NodeJS.ProcessEnv, name: string): string {
    const raw = env[name];
    if (typeof raw !== "string" || raw.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return raw.trim();
}

function readInteger(
    env: NodeJS.ProcessEnv,
    name: string,
    fallback: number,
    min: number,
    max: number,
): number {
    const raw = env[name];
    if (raw === undefined || raw.trim() === "") return fallback;
    const parsed = Number(raw.trim());
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${name} must be an integer between ${min} and ${max}`);
    }
    return parsed;
}

/**
 * Builds the validated configuration. Throws on any missing or unsafe value so the
 * process fails at boot instead of running with a silent default (TM-06).
 * Exported separately from the default instance so it can be unit-tested.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): TaskyConfig {
    const jwtSecret = required(env, "JWT_SECRET");
    if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
        throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`);
    }

    const connectionString = required(env, "DATABASE_URL");

    return {
        app: {
            port: readInteger(env, "PORT", 4000, 0, 65535),
            env: env.NODE_ENV?.trim() || "development",
            trustProxyHops: readInteger(env, "TRUST_PROXY_HOPS", 1, 0, 5),
        },
        db: {
            connectionString,
            ssl: env.DATABASE_SSL?.trim().toLowerCase() === "true",
            connectionTimeoutMillis: readInteger(env, "DB_CONNECT_TIMEOUT_MS", 5000, 100, 60000),
        },
        jwt: {
            secret: jwtSecret,
            // Preserved from the pre-fix behaviour (1h) until TM-04 shortens it.
            expiresIn: env.JWT_EXPIRES_IN?.trim() || "1h",
        },
    };
}

const config = loadConfig();

export default config;
