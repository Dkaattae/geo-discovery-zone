#!/usr/bin/env bun
/**
 * T-109: refuse to format unless the pinned prettier is installed.
 *
 * `bun run format` and `bun run format:check` run this first and only reach
 * prettier when it exits 0. Without it, a missing `node_modules/.bin/prettier`
 * makes `bun run` fall back to whatever prettier is on `PATH`, which rewrites
 * tracked files at the wrong version (E-16, E-17; T-076, T-107).
 *
 * "Installed" means `node_modules/prettier/package.json` has a `version`
 * string-equal to `devDependencies.prettier` in this package's `package.json`,
 * read at run time, and `node_modules/.bin/prettier` exists. Anything else
 * exits 1 with the pinned version, and the found one if any, in the message.
 * `frontend/scripts/prettier-pin-guard.ts` is the same check for `frontend/`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

function refuse(reason: string): never {
  console.error(`refusing to run prettier: ${reason}. Run \`bun install\` in this package first.`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  devDependencies?: Record<string, string>;
};
const pinned = pkg.devDependencies?.["prettier"];
if (!pinned) refuse("package.json pins no prettier in devDependencies");

const manifest = join(root, "node_modules/prettier/package.json");
if (!existsSync(manifest)) {
  refuse(`pinned prettier ${pinned} is required, but node_modules/prettier is missing`);
}
const found = (JSON.parse(readFileSync(manifest, "utf8")) as { version?: unknown }).version;
if (found !== pinned) {
  refuse(`pinned prettier ${pinned} is required, found ${String(found)} in node_modules/prettier`);
}
if (!existsSync(join(root, "node_modules/.bin/prettier"))) {
  refuse(
    `prettier ${pinned} is installed but node_modules/.bin/prettier is missing, so bun run would fall back to PATH`,
  );
}
