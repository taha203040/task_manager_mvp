# Deploying Tasky to Vercel

One Vercel project, one server function, one origin. Nitro serves the TanStack Start
SSR pages and hands every `/api/v1/*` request to the Express application in the same
function, so the browser only ever talks to a single host: no CORS, no cross-site
cookies, no second project to keep in sync.

```
Vercel request
   │
   ├── /api/v1/**   ──► client/server/routes/api/v1/[...path].ts ──► h3 fromNodeHandler(Express app)
   ├── /healthz     ──► client/server/routes/healthz.ts          ──► h3 fromNodeHandler(Express app)
   └── everything else ──► TanStack Start SSR router
```

Both routes import `server/src/app.ts` directly, so Express receives the original
path, query string, unread body stream and all headers (`Cookie`, `X-Forwarded-*`),
and its `Set-Cookie` headers go back to the browser untouched.

---

## 1. Vercel project settings

| Setting | Value |
|---|---|
| **Root Directory** | `client` |
| **Include source files outside of the Root Directory** | **ON** — required: the function imports `server/src/app.ts`, which lives above the root directory. With this OFF the build fails with `Could not resolve "../../../../../server/src/app"`. |
| **Framework Preset** | Vercel detects `vite`; leave it — Nitro writes the Vercel output itself. |
| **Build Command** | leave the default (`npm run build`, i.e. `vite build` in `client/`). |
| **Install Command** | `npm install` — the lockfile is at the **repo root**, not in `client/`. The workspace install is detected via the root `package.json`; if it is not, set `cd .. && npm install`. |
| **Output Directory** | leave empty. Nitro writes `.vercel/output` (Build Output API v3). |
| **Node.js Version** | **22.x** (Nitro's Vercel preset supports 20/22/24; 22 is the current default LTS). |
| **Function runtime** | Node — **not** Edge. `pg` opens raw TCP and `bcrypt` is a native addon; neither exists in the Edge runtime. |

The Nitro preset is pinned to `vercel` in `client/vite.config.ts`, because
`@lovable.dev/vite-tanstack-config` otherwise defaults to `cloudflare-module`. The
same file sets `serverDir: "./server"`, without which Nitro v3 (default
`serverDir: false`) never scans `client/server/routes` and `/api/v1/*` falls through
to the SSR router.

---

## 2. Environment variables

Set these for **Production** and for **Preview** separately, and use **different
secrets for each** — a leaked preview secret must not unlock production.

| Variable | Production | Preview | Notes |
|---|---|---|---|
| `DATABASE_URL` | Supabase **transaction pooler**, port **6543**, user `tasky_app.<project-ref>` | same, ideally a separate branch/staging DB | Transaction pooler keeps connection count bounded across serverless invocations. Never use the direct `5432` connection string here, and never the service-role URL with a superuser. |
| `DATABASE_SSL` | `true` | `true` | Without it `pg` connects unencrypted and Supabase refuses. |
| `SUPABASE_CA` | PEM **text** of the Supabase CA certificate | same | See §3 — the code accepts a single-line value with literal `\n` sequences. |
| `JWT_SECRET` | **newly generated**, 32+ chars | **different** newly generated value | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. The API refuses to boot if it is missing or shorter than 32 chars. |
| `TRUST_PROXY_HOPS` | `1` | `1` | Vercel terminates TLS and appends exactly one `X-Forwarded-For` entry. See §5. |

Deliberately **not** set:

- **No `REDIS_URL` / no shared rate-limit store.** The limiters are in-memory by
  design for this deployment (see §6).
- **No `CORS_ORIGINS` / no `CORS_*`.** There is exactly one origin and CORS was
  removed from Express; adding it back would reopen the cross-origin path.
- **No `NODE_ENV`.** Vercel sets `production` for you. That value is what turns the
  session cookie `Secure` (see §7).
- `PORT` — Vercel injects its own; `app.listen` only runs outside the function anyway.

Never commit any of these. `.env` and `.env.*` are gitignored; only `.env.example`
carries placeholders.

---

## 3. The Supabase CA (`SUPABASE_CA`)

`server/src/Config/db.ts` builds the TLS options as:

```ts
const supabaseCa = process.env.SUPABASE_CA?.replace(/\\n/g, "\n");
ssl: config.db.ssl ? { rejectUnauthorized: true, ca: supabaseCa } : false
```

Certificate verification stays **on**. `rejectUnauthorized` is never set to `false`
anywhere in this repository, and it must stay that way: it would accept any
certificate and silently defeat TLS.

Because a Vercel environment variable holds a single line, paste the PEM with its
newlines escaped as `\n` and let the code above un-escape them:

```
-----BEGIN CERTIFICATE-----\nMIID…\n…\n-----END CERTIFICATE-----\n
```

If you prefer to keep real newlines, paste the PEM as-is — both forms work, the
`replace` is a no-op when there are no literal `\n` sequences.

Locally, `NODE_EXTRA_CA_CERTS=/path/to/supabase-ca.pem` is an equally valid
alternative (Node adds it to the trust store for every TLS connection in the process).

---

## 4. Smoke tests

Run these against the deployment URL right after the first deploy, and again after
every change to the linker.

```bash
BASE="https://<your-project>.vercel.app"

# 1. Liveness: served by Express inside the Nitro function, no auth, no DB
curl -i "$BASE/healthz"
# expect: 200, content-type: application/json, body {"status":"ok"}

# 2. The API reachability probe: must be JSON from Express,
#    NOT an HTML 404 page from the SSR router
curl -i "$BASE/api/v1/auth/verify"
# expect: 401, content-type: application/json, body {"error":"Unauthorized"},
#         plus X-Powered-By: Express and RateLimit-* headers

# 3. Rejected credentials: must be 401 JSON (a 500 here means the DB is unreachable)
curl -i -X POST "$BASE/api/v1/users/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"WrongPass!123"}'
# expect: 401, body {"error":"Invalid credentials"}

# 4. Register + sign in, and inspect the cookie flags
curl -i -X POST "$BASE/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"smoke","email":"smoke+1@example.com","password":"Passw0rd!123"}'
# expect: 201

curl -i -c cookies.txt -X POST "$BASE/api/v1/users/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke+1@example.com","password":"Passw0rd!123"}'
# expect: 200 and
#   Set-Cookie: token=<jwt>; Path=/; HttpOnly; Secure; SameSite=Lax

# 5. The cookie authenticates the follow-up request (same origin, no CORS)
curl -i -b cookies.txt "$BASE/api/v1/auth/verify"
# expect: 200 {"msg":"done","user_id":…}

# 6. SSR is still served by the same function
curl -i "$BASE/" | head -20
# expect: 200, text/html, the Tasky landing page markup

# 7. API responses must not be cached by the CDN
curl -sI "$BASE/api/v1/auth/verify" | grep -i cache-control
# expect: no-store   (from client/vercel.json)

# 8. Logout clears the cookie with matching attributes
curl -i -b cookies.txt "$BASE/api/v1/auth/logout"
# expect: 200 and Set-Cookie: token=; …; HttpOnly; Secure; SameSite=Lax
```

A quick manual check in the browser: open the deployment, DevTools → Network, and
confirm requests go to `https://<your-project>.vercel.app/api/v1/...` — **same
origin**, no preflight `OPTIONS`, and the `token` cookie is `HttpOnly; Secure;
SameSite=Lax`.

---

## 5. Why `TRUST_PROXY_HOPS=1`

`app.set("trust proxy", n)` decides how much of `X-Forwarded-For` Express believes.

- Vercel's edge terminates TLS and appends **one** entry: the real client address,
  on the **right** of any header the client sent.
- With `n = 1` Express reads that rightmost entry, so a client cannot rotate its
  rate-limit bucket by prepending a fake address (`X-Forwarded-For: 1.2.3.4, <real>`).
- `n = 0` would ignore the header and bucket every user under the proxy's IP — one
  attacker would exhaust the shared budget.
- `n > 1` would trust a client-supplied field, which is exactly the forgery
  scenario the rate limiting is supposed to survive.
- `trust proxy: true` is **never** used: it trusts every hop and makes the header
  fully attacker-controlled.

Verified locally against the built function: two requests with different
`X-Forwarded-For` values produced independent `RateLimit-Remaining` counters, and a
chained value (`203.0.113.10, 6.6.6.6`) resolved to the rightmost entry.

---

## 6. Known risks and demo limitations

1. **Rate limiting is per instance, not global (demo limitation).** Both limiters
   (`createGlobalLimiter` 300/15min, `createAuthLimiter` 10/15min on the credential
   endpoints) use `express-rate-limit`'s in-memory store. On serverless that means:
   - limits apply **per warm function instance** — N concurrent instances multiply
     the effective ceiling by N;
   - a **cold start resets the counters**, so a patient attacker gets a fresh budget;
   - the first request to a new instance can slip through even while another
     instance is throttling.
   This is accepted for the demo. A global limit would need a shared store (Redis and
   the rate-limit store packages are intentionally **not** installed here), or a WAF /
   edge rule in front of the deployment. The per-account Postgres throttle in the
   login use case is separate and still applies.
2. **Nitro v3 beta.** `nitro@3.0.260603-beta` is pre-RC. Helper names and options
   have moved between builds already (`fromNodeMiddleware` → `fromNodeHandler`).
   Pin the version, and re-run §4 after any Nitro upgrade.
3. **Cold starts.** A Node function with `pg`, `express` and the SSR bundle is not
   tiny; expect a slow first request after idle. The DB pool (max 20) is per
   instance, so a burst of cold instances can exceed Supabase's connection limit —
   another reason to use the **transaction pooler on 6543**.
4. **Pooling and prepared statements.** Through the transaction pooler, avoid
   session-level SQL (`SET`, advisory locks, long transactions); statements are
   multiplexed across backends.
5. **`vite preview` cannot serve this build.** The TanStack preview plugin expects
   `client/dist/server/server.js`, which a Nitro build does not emit, and it also
   re-enables the Vite dev proxy. To exercise the production build locally, run the
   emitted function handler directly (see below).
6. **`loadConfig()` runs at import.** A missing `JWT_SECRET` or `DATABASE_URL`
   throws while the function module loads, which takes down **SSR too**, not just
   the API. Set the environment variables before the first deploy.
7. **`tsc` must keep passing.** The workspace install resolves
   `@types/express` 5.3.x, which types a route parameter as `string | string[]`.
   Every controller therefore normalizes params through
   `server/src/Interfaces/http/utils/params.ts` (`routeParam`) instead of
   destructuring `req.params` straight into `string` arguments. A new handler that
   destructures `req.params` directly will fail `npm run build` in `server/` — and
   because Vercel builds the workspace, that fails the deploy.

---

## 7. Local notes

- **`NODE_ENV=production` over plain HTTP drops the cookie.** The session cookie is
  `Secure` whenever `config.app.env === "production"`. Browsers refuse to store a
  `Secure` cookie received over `http://`, so a local run with
  `NODE_ENV=production` will look like "login succeeds but I am not authenticated".
  For browser testing locally use `NODE_ENV=development` (or serve HTTPS). `curl`
  shows the attribute regardless, which is how it was verified here.
- **Run the built function locally** (this is what Vercel does):
  ```powershell
  cd client
  # export the real environment variables first (JWT_SECRET, DATABASE_URL, ...)
  node -e "Promise.all([import('node:http'),import('srvx/node'),import('file:///…/client/.vercel/output/functions/__server.func/index.mjs')]).then(([{createServer},{toNodeHandler},m])=>{const h=toNodeHandler(m.default.fetch);createServer(h).listen(4313)})"
  ```
  The built entry exports `{ default: { fetch } }` (Vercel's Web-Standard Node
  signature), so it needs a Node↔fetch bridge — `srvx/node`'s `toNodeHandler` — to
  listen on a port. Do not expect `export default (req, res)`.
- **Dev mode** (`cd client && npm run dev`) serves SSR on Vite's port and proxies
  `/api` to `http://localhost:${API_PORT:-4000}`, where `server` must be running
  (`cd server && npm run dev`). The relative `/api/v1` base URL is identical in both
  modes.
- **Migrations** live in `server/src/Infrastructure/Database/migrations/` and run
  with `cd server && npm run migrate` against `DATABASE_URL`. Apply them to the
  Supabase database before the first deploy that needs them.

---

## 8. Rollback

The deployment is a single immutable build, so rollback is a promotion, not a revert.

1. **Instant rollback (preferred):** Vercel dashboard → Deployments → pick the last
   known-good deployment → **Promote to Production**. It restores the previous
   function bundle, and its build-time output, in seconds. `vercel rollback`
   (CLI) does the same from a terminal.
2. **Environment-variable change gone wrong** (e.g. wrong `SUPABASE_CA` or
   `JWT_SECRET`): fix the variable and **redeploy** — env changes are not applied to
   an existing deployment until it is rebuilt or promoted. Rotating `JWT_SECRET`
   invalidates every existing session cookie; that is expected and safe.
3. **Code-level rollback:** `git revert <commit>` for the offending commit — keep
   `deploy(step-1)` … `deploy(step-3)` (workspaces, linker, vercel preset) in place
   unless you intend to abandon the single-project design — then push. The `deploy`
   commits are additive: reverting the step-4 commit only restores the old client
   base URL.
4. **Abandoning the single-project design:** the fallback is two projects (client +
   API) with a Vercel rewrite of `/api/*` to the API project. That reintroduces
   cross-origin cookie rules and is **not** implemented here; do not switch without
   a explicit decision.
5. **After any rollback,** re-run the §4 smoke tests, especially check 2 — an
   HTML 404 on `/api/v1/auth/verify` means the linker route is missing and the SSR
   router is answering instead.
