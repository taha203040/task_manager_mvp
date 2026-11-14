import { fromNodeHandler } from "h3";
import app from "../../../../../server/src/app";

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
