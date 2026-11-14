import axios from "axios";

/**
 * Always same-origin, hardcoded.
 *
 * Nitro serves these SSR pages and the Express API lives on the same host under
 * /api/v1, so relative requests already carry the session cookie: no CORS
 * preflight, no `withCredentials`, no absolute URL to keep in sync per
 * environment. No `window`/`document` access here — this module is imported
 * during SSR as well as in the browser.
 */
const baseURL = "/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
