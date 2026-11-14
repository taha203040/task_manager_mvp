import { defineConfig, type LovableViteTanstackOptions } from "@lovable.dev/vite-tanstack-config";

/**
 * The Nitro preset is NOT set anywhere else in this repo: it comes from
 * `@lovable.dev/vite-tanstack-config`, which spreads `{ defaultPreset:
 * "cloudflare-module", ...userOptions }` into `nitro()`. An explicit `preset`
 * here therefore wins over that Cloudflare default.
 *
 * `vercel` (not the edge variant) is required: the Express app talks to
 * PostgreSQL through `pg` over raw TCP and uses the native `bcrypt` addon,
 * neither of which runs in the edge runtime.
 *
 * `serverDir` is what makes Nitro scan `client/server/{routes,api,...}`. Nitro
 * v3 defaults it to `false`, so without this option the
 * `server/routes/api/v1/[...path].ts` linker is never registered and every
 * /api/v1/* request would fall through to the SSR router.
 */
const nitroOptions = {
  preset: "vercel",
  serverDir: "./server",
} as unknown as LovableViteTanstackOptions["nitro"];

export default defineConfig({
  nitro: nitroOptions,
  vite: {
    server: {
      proxy: {
        // Dev only: `npm run dev` serves the SSR app on Vite's port and forwards
        // the same `/api/v1` paths the production function handles, so the
        // relative axios base URL works identically in both modes.
        "/api/v1": {
          target: `http://localhost:${process.env.API_PORT ?? 4000}`,
          changeOrigin: true,
        },
      },
    },
  },
});
