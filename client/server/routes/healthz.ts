// Imported through `nitro/h3`, not `h3`: nitro is a declared dependency of this
// package, while h3 is only a transitive one (see the API route for detail).
import { fromNodeHandler } from "nitro/h3";
// Same workspace-resolved import as the API route (see that file for detail).
import app from "secure_api/src/app";

/**
 * `/healthz` lives on the Express app (mounted before its rate limiters), but
 * the API catch-all only forwards `/api/v1/**`, so without this route the
 * platform probe lands on the SSR router and gets a 404 page instead of JSON.
 * Same adapter, same app instance — Nitro still has exactly one server.
 */
export default fromNodeHandler(app);
