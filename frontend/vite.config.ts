// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/** Where `make -C backend dev` serves the API. */
const backend = process.env["GEO_API_URL"] ?? "http://127.0.0.1:8000";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      // The app calls the API at a same-origin `/api/v1`, so the dev server
      // proxies it to the backend. Same origin means no CORS in the browser and
      // no API host baked into the client bundle; set VITE_API_BASE_URL to point
      // a deployed build at another origin.
      proxy: {
        "/api": { target: backend, changeOrigin: true },
      },
    },
  },
});
