import fs from "fs";
import path from "path";
import pool from "../../Config/db";
import { getServerRoot } from "../../Shared/utils/module-paths";

/**
 * Minimal forward-only migration runner built on the existing pg pool.
 * Each .sql file in ./migrations runs once, inside a transaction, and is recorded in schema_migrations.
 * Usage: npm run migrate
 *
 * The runner is deliberately NOT part of the bundled server function: it needs the
 * .sql files on disk, which a serverless bundle does not carry, so migrations stay
 * a CI/human step against the database rather than a request-time operation. It
 * runs under ts-node, i.e. CommonJS, and the .sql files live next to this source
 * file under src/; built from the package root so the path does not depend on the
 * CommonJS `__dirname` global.
 */
const MIGRATIONS_DIR = path.resolve(getServerRoot(), "src", "Infrastructure", "Database", "migrations");

async function run(): Promise<void> {
    await pool.query(
        `CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
    );

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    }

    const files = fs.readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith(".sql")).sort();
    if (files.length === 0) {
        console.log("No migrations to apply.");
        return;
    }

    for (const file of files) {
        const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE version = $1", [file]);
        if ((applied.rowCount ?? 0) > 0) {
            console.log(`skip   ${file}`);
            continue;
        }

        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query(sql);
            await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
            await client.query("COMMIT");
            console.log(`apply  ${file}`);
        } catch (error) {
            await client.query("ROLLBACK");
            throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
        } finally {
            client.release();
        }
    }
}

run()
    .then(() => pool.end())
    .then(() => console.log("Migrations complete."))
    .catch(async (error) => {
        console.error(error);
        await pool.end();
        process.exit(1);
    });
