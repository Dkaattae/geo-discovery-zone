// Build config for the static bundle the backend serves.
//
// `vite.config.ts` is unchanged and still drives dev and the nitro/Cloudflare
// build. This one exists so `bun run build:static` can produce something a
// plain file server understands, without changing how anything else is built.
//
// Two differences from the default build:
//
//   - **nitro off.** The container has no Node runtime for the frontend; the
//     Python image serves files. A nitro server bundle would be dead weight.
//   - **SPA mode on.** The build prerenders one shell to `dist/client/index.html`
//     and the app takes over on the client. Nothing is lost: every screen waits
//     on `localStorage` and the API before it can render, so there was never
//     useful HTML to server-render.
//
// Run it through `scripts/build-static.mjs`, which is what the Dockerfile calls.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    spa: {
      enabled: true,
      // The shell is `index.html` rather than the default `_shell.html`, so
      // `dist/client/` is a directory any static server can serve as-is.
      prerender: { outputPath: "/index.html" },
    },
  },
});
