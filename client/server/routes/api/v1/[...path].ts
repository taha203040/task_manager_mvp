// Imported through `nitro/h3`, not `h3`: nitro is a declared dependency of this
// package, while h3 is only a transitive one, so this specifier is guaranteed to
// resolve in a clean CI install no matter how npm lays out the tree.
import { fromNodeHandler } from "nitro/h3";
// Resolved through the npm workspace link, not a relative path across the Root
// Directory: `secure_api` is the server package (server/package.json) and is now a
// declared dependency of the client, so npm guarantees the symlink exists.
import app from "secure_api/src/app";

/**
 * Single-origin linker: Nitro serves the SSR pages and hands every /api/v1/*
 * request to the Express application in the same server function.
 *
 * `fromNodeHandler` is the h3 v2 replacement for `fromNodeMiddleware`
 * (https://h3.dev/migration#nodejs-utils). Handing over the whole Express app
 * — not a hand-written proxy — is what keeps the Express contract intact:
 * Express receives the original `/api/v1/<path>?<query>` URL, the untouched
 * `Cookie`/`X-Forwarded-*` headers and the unread request body stream, and its
 * `Set-Cookie` headers are written back to the browser by the Node adapter.
 */
export default fromNodeHandler(app);
