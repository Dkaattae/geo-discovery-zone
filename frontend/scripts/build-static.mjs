/**
 * Builds the static bundle the backend serves: `bun run build:static`.
 *
 * It is a script rather than a bare `vite build --config` for one reason. SPA
 * mode prerenders the shell by starting a throwaway HTTP server, and Node binds
 * `::` when no host is given. On a host without IPv6 — which includes plenty of
 * containers, and the sandbox this was written in — that fails with
 * `EAFNOSUPPORT` and takes the whole build with it. Forcing an unspecified
 * listen onto IPv4 makes the build work the same way everywhere.
 *
 * The patch is build-only and never reaches the bundle.
 */
import net from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createBuilder } from "vite";

const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function listenOnIpv4(...args) {
  const [first, second] = args;
  if (typeof first === "object" && first !== null) {
    if (!first.host || first.host === "::") args[0] = { ...first, host: "127.0.0.1" };
  } else if (typeof first === "number") {
    if (second === "::") args[1] = "127.0.0.1";
    else if (typeof second !== "string") args.splice(1, 0, "127.0.0.1");
  }
  return originalListen.apply(this, args);
};

/** The `frontend/` directory, whatever the working directory is. */
const root = path.resolve(fileURLToPath(import.meta.url), "../..");

// `createBuilder().buildApp()` rather than `build()`: the app build is what
// runs the client bundle, the SSR bundle and then the prerender pass that
// writes the shell. `build()` alone stops after the client bundle.
const builder = await createBuilder({
  root,
  configFile: path.join(root, "vite.static.config.ts"),
  mode: "production",
});
await builder.buildApp();
