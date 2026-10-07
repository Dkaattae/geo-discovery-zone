/**
 * The offline-rebuild harness shared by every suite that checks "the bank is
 * built, not hand-edited" — `committed-bank.test.ts`, `state-animals.test.ts`,
 * `landmarks.test.ts`, `landmarks-verify.test.ts` and, from T-014,
 * `climate-kid.test.ts`.
 *
 * T-014 criterion 16(a): before this file, the dead-loopback proxy map and the
 * "spawn `src/build.ts --offline --out <tempdir>`, read the named files back,
 * clean up" runner were copy-pasted once per suite (four times; a fifth would
 * have landed with this task's own suite if left alone). Two copies drifting
 * is how a real network call could slip into one suite and not the others;
 * extracting the one place both live means there is exactly one
 * `127.0.0.1:1` in `question-bank/src/` to audit, and any future suite that
 * checks an offline rebuild (a tester's `climate-kid-verify.test.ts` included)
 * gets both pieces from here rather than pasting a fifth copy.
 *
 * What stays duplicated on purpose: the tracked-state-file *reading* route.
 * `landmarks.test.ts` reads via `git ls-files` (so a tracked-but-missing file
 * is caught) and `landmarks-verify.test.ts` reads via `readdirSync` (so a
 * stray untracked file is caught) — two different failure modes, deliberately
 * not shared (see that file's header comment). Nothing here touches that.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** No network, ever — the same loopback trick CI uses (`test-guidelines.md`). */
export const DEAD_PROXY = {
  HTTP_PROXY: "http://127.0.0.1:1",
  HTTPS_PROXY: "http://127.0.0.1:1",
  ALL_PROXY: "http://127.0.0.1:1",
  http_proxy: "http://127.0.0.1:1",
  https_proxy: "http://127.0.0.1:1",
  all_proxy: "http://127.0.0.1:1",
} as const;

/** What `rebuildOfflineWithStdout` returns: the files, and what the CLI printed. */
export interface OfflineRebuildReport {
  /** File name to UTF-8 text, exactly as `rebuildOffline` returns it. */
  files: Map<string, string>;
  /** The spawned build's complete stdout, decoded as UTF-8. */
  stdout: string;
}

/**
 * Runs the real CLI offline into a throwaway directory, reads back the named
 * files as UTF-8 text, and always removes the directory again. Nothing is
 * mocked — the isolation is `DEAD_PROXY` plus a temp `--out` dir.
 *
 * Passes `--quiet`, so the build prints nothing; use `rebuildOfflineWithStdout`
 * when the test needs what `report()` printed.
 *
 * @param buildScript absolute path to `src/build.ts` (callers pass
 *   `join(PKG, "src/build.ts")`, since `PKG` differs per caller only in value,
 *   not in shape).
 * @param fileNames the tracked paths to read back out of the rebuild, e.g.
 *   `["index.json", "us-state-co.json", ...]`.
 * @param tmpPrefix a short, suite-specific prefix for the temp directory name,
 *   purely so a leftover dir (if cleanup ever failed) is traceable to its suite.
 */
export function rebuildOffline(
  buildScript: string,
  fileNames: string[],
  tmpPrefix = "question-bank-rebuild-",
): Map<string, string> {
  return runOffline(buildScript, fileNames, tmpPrefix, true).files;
}

/**
 * The same offline build as `rebuildOffline`, without `--quiet`, so the build's
 * `report()` lines ("Wrote N entities …", "N warning(s):", one line per
 * warning) reach stdout. Returns the files and that stdout together (T-080).
 *
 * Same isolation, same throw on a non-zero exit, same temp-dir cleanup. A test
 * should call this rather than spawning `build.ts` itself: the spawn guards in
 * `climate-kid.test.ts` and `top-crops-verify.test.ts` forbid the latter.
 */
export function rebuildOfflineWithStdout(
  buildScript: string,
  fileNames: string[],
  tmpPrefix = "question-bank-rebuild-",
): OfflineRebuildReport {
  return runOffline(buildScript, fileNames, tmpPrefix, false);
}

/** The one spawn both routes share, so their isolation cannot drift apart. */
function runOffline(
  buildScript: string,
  fileNames: string[],
  tmpPrefix: string,
  quiet: boolean,
): OfflineRebuildReport {
  const out = mkdtempSync(join(tmpdir(), tmpPrefix));
  try {
    const argv = ["bun", buildScript, "--offline", "--out", out];
    if (quiet) argv.push("--quiet");
    const proc = Bun.spawnSync(argv, {
      env: { ...process.env, ...DEAD_PROXY },
    });
    if (proc.exitCode !== 0) {
      throw new Error(`offline rebuild exited ${proc.exitCode}: ${proc.stderr?.toString() ?? ""}`);
    }
    const files = new Map<string, string>();
    for (const name of fileNames) files.set(name, readFileSync(join(out, name), "utf8"));
    return { files, stdout: proc.stdout?.toString() ?? "" };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}
