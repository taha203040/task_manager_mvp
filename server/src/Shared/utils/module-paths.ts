import { resolve } from "node:path";

/**
 * Absolute directory of the *compiled* server package, for the two runtime shapes
 * this code has to survive.
 *
 * 1. CommonJS — `ts-node src/app.ts` (dev), `node dist/app.js` (standalone API),
 *    and Jest. `__dirname` exists here. This file lives at `<package>/src/Shared/
 *    utils` (or `<package>/dist/Shared/utils`), so three levels up is the package
 *    root in both cases. Note it is THIS file's `__dirname`, not the caller's —
 *    that is why the depth is a fixed, documented convention rather than a
 *    parameter.
 * 2. An ES module — the Nitro/Vercel server function bundles this code and emits
 *    ESM, where `__dirname` does not exist and a bare reference throws
 *    `ReferenceError: __dirname is not defined in ES module scope`. That is the
 *    error that broke production. The bundle has no on-disk module tree, so the
 *    only meaningful base is the process working directory (the function
 *    directory on the platform). Production configuration arrives as platform
 *    environment variables, so resolving env files against it is a harmless no-op.
 *
 * `fileURLToPath(import.meta.url)` is the canonical ESM replacement, but this
 * package compiles with `"module": "commonjs"` — required by the `require.main`
 * listen guard, ts-node and Jest — and TypeScript rejects the meta-property in
 * that mode (TS1343). It therefore cannot appear in a file `tsc` compiles.
 */
const commonJsDir: string | undefined =
    typeof __dirname === "string" ? __dirname : undefined;

/** Package root of `server/`, or the working directory when bundled as ESM. */
export function getServerRoot(): string {
    if (commonJsDir) {
        return resolve(commonJsDir, "../../..");
    }
    return process.cwd();
}
