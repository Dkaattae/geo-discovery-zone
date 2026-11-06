import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-047, written by the `tester` session from the brief's acceptance criteria
 * (`tasks/T-047-test-guidelines-backend.md`, `process.md` step 4) — never from
 * the edited document. Criteria 1–12, 14 and 15 are shape checks on
 * `test-guidelines.md` and are asserted here. Criterion 13 (the block runs from
 * a cold checkout) is an execution check, criterion 16 is diff-shaped and
 * criterion 17 is a whole-suite outcome; all three are recorded in the brief's
 * Verdict rather than asserted here, because asserting them would need the
 * network or a git revision (the T-081 guard forbids the latter in tests).
 *
 * "The backend section" is the brief's definition: from the `###` heading that
 * introduces the pytest suite up to the next `##` heading ("Before you say it
 * passes").
 *
 * Local file reads only. No network (`test-guidelines.md`, "No network in
 * tests, ever").
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const doc = readFileSync(join(REPO_ROOT, "test-guidelines.md"), "utf8");

const PROXY_VARS = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
];
const DEAD_PROXY = "http://127.0.0.1:1";

/** The backend section: the `### ` heading that names pytest, up to the next `## ` heading. */
function backendSection(text: string): { heading: string; body: string } {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("### ") && /pytest/.test(l));
  if (start < 0) throw new Error("no ### heading introducing the pytest suite");
  let end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  if (end < 0) end = lines.length;
  return { heading: lines[start]!, body: lines.slice(start, end).join("\n") };
}

/** The "No network in tests, ever" paragraph and the first fenced block after it. */
function noNetworkRegion(text: string): {
  start: number;
  end: number;
  prose: string;
  block: string;
} {
  const start = text.indexOf("**No network in tests, ever.**");
  if (start < 0) throw new Error("no 'No network in tests, ever' paragraph");
  const fenceOpen = text.indexOf("\n```", start);
  const blockStart = text.indexOf("\n", fenceOpen + 1) + 1;
  const fenceClose = text.indexOf("\n```", blockStart - 1);
  const end = text.indexOf("\n", fenceClose + 1) + 1;
  return {
    start,
    end,
    prose: text.slice(start, fenceOpen),
    block: text.slice(blockStart, fenceClose + 1),
  };
}

/** The fenced block of "## Before you say it passes". */
function beforeYouSayRegion(text: string): { start: number; end: number; block: string } {
  const h = text.indexOf("\n## Before you say it passes");
  if (h < 0) throw new Error("no 'Before you say it passes' section");
  const fenceOpen = text.indexOf("\n```", h + 1);
  const start = fenceOpen + 1;
  const blockStart = text.indexOf("\n", start) + 1;
  const fenceClose = text.indexOf("\n```", blockStart - 1);
  const end = text.indexOf("\n", fenceClose + 1) + 1;
  return { start, end, block: text.slice(blockStart, fenceClose + 1) };
}

/** Shell lines with backslash continuations joined, comments kept. */
function logicalLines(block: string): string[] {
  return block
    .replace(/\\\n/g, " ")
    .split("\n")
    .filter((l) => l.trim() !== "");
}

/** The text without the three regions criterion 15 lets change. */
function unchangedRemainder(text: string): string {
  const nn = noNetworkRegion(text);
  const lines = text.split("\n");
  const bStartLine = lines.findIndex((l) => l.startsWith("### ") && /pytest/.test(l));
  const bStart = lines.slice(0, bStartLine).join("\n").length + 1;
  const bEnd = text.indexOf("\n## Before you say it passes") + 1;
  const bys = beforeYouSayRegion(text);
  if (!(nn.end <= bStart && bEnd <= bys.start))
    throw new Error("regions out of the expected order");
  return (
    text.slice(0, nn.start) +
    "<<NO-NETWORK>>" +
    text.slice(nn.end, bStart) +
    "<<BACKEND-SECTION>>" +
    text.slice(bEnd, bys.start) +
    "<<BEFORE-BLOCK>>" +
    text.slice(bys.end)
  );
}

/**
 * sha256 of `unchangedRemainder` applied to `test-guidelines.md` as it was on
 * `origin/main` at a7945cf (the brief's survey baseline), computed once from a
 * scratch copy of this function. Embedded, because CI checks out shallow and no
 * test may resolve a git revision.
 */
const REMAINDER_SHA256_AT_A7945CF =
  "d028b32dc2b5d0906e41cf25ff85e2421aa68793a55928526cd2d8e61632fbfd";

const section = backendSection(doc);

describe("T-047 test-guidelines.md backend section", () => {
  test("criterion 1: the forward-looking marker is gone", () => {
    for (const s of ["Forward-looking", "does not exist yet", "Nothing below has been exercised"]) {
      expect(doc.includes(s), s).toBe(false);
    }
  });

  test("criterion 2: no `api/` directory, no `cd api`, no `# api` shell comment", () => {
    expect(doc.includes("`api/`")).toBe(false);
    expect(doc.includes("cd api")).toBe(false);
    expect(/#\s+api\b/.test(doc)).toBe(false);
  });

  test("criterion 3: the heading names backend/ and the run command is uv run pytest from backend/", () => {
    expect(section.heading).toContain("backend/");
    const runsFromBackend =
      section.body.includes("cd backend && uv run pytest") ||
      /make -C backend test(?![-\w])/.test(section.body);
    expect(runsFromBackend).toBe(true);
  });

  test("criterion 4: SQLite is the default, Postgres via GEO_TEST_DATABASE_URL, SQLite not forbidden", () => {
    const sentences = section.body.split(/(?<=[.;:])\s+|\n-\s/);
    expect(sentences.some((s) => /SQLite/.test(s) && /default/i.test(s))).toBe(true);
    expect(sentences.some((s) => /Postgres/.test(s) && /GEO_TEST_DATABASE_URL/.test(s))).toBe(true);
    expect(/make -C backend test-postgres|GEO_TEST_DATABASE_URL/.test(section.body)).toBe(true);
    expect(/not\s+SQLite|never\s+SQLite|avoid\s+SQLite|instead of SQLite/i.test(doc)).toBe(false);
  });

  test("criterion 5: per-test transaction rolled back, app commits joined to a savepoint, points at conftest", () => {
    const bullets = section.body.split(/\n- /);
    const isolation = bullets.find(
      (b) => /transaction/.test(b) && /roll(ed)? back/.test(b) && /commit/.test(b),
    );
    // The savepoint must be said in prose, not only inside a code identifier such as `create_savepoint`.
    const prose = (isolation ?? "").replace(/`[^`]*`/g, "");
    expect(/commits?[^.]*savepoint/.test(prose)).toBe(true);
    expect(isolation).toBeDefined();
    expect(/nothing is left behind/i.test(isolation ?? "")).toBe(true);
    expect(/db_session|backend\/tests\/conftest\.py/.test(section.body)).toBe(true);
  });

  test("criterion 6: endpoint tests via httpx.AsyncClient over httpx.ASGITransport, no server, no socket", () => {
    const bullets = section.body.split(/\n- /);
    const endpoint = bullets.find(
      (b) => /httpx\.AsyncClient/.test(b) && /httpx\.ASGITransport/.test(b),
    );
    expect(endpoint).toBeDefined();
    expect(/no server/i.test(endpoint ?? "")).toBe(true);
    expect(/no socket/i.test(endpoint ?? "")).toBe(true);
    expect(/`client`|conftest\.py/.test(section.body)).toBe(true);
  });

  test("criterion 7: openapi.yaml follows the backend (E-14), kept in step by test_contract.py and assert_matches", () => {
    expect(
      /`openapi\.yaml` follows the backend|openapi\.yaml follows the backend/.test(section.body),
    ).toBe(true);
    expect(section.body).toContain("engineering-decisions.md");
    expect(section.body).toContain("E-14");
    expect(section.body).toContain("test_contract.py");
    expect(/both directions/.test(section.body)).toBe(true);
    expect(section.body).toContain("assert_matches");
    const am = section.body.slice(section.body.indexOf("assert_matches"));
    expect(/required key/.test(am)).toBe(true);
    expect(/undeclared key/.test(am)).toBe(true);
  });

  test("criterion 8: the old contract rule is gone; a difference is fixed by updating openapi.yaml", () => {
    expect(doc.includes("It is the contract")).toBe(false);
    expect(doc.includes("a bug even when")).toBe(false);
    const sentences = doc.split(/(?<=[.!?])\s+/);
    const accusing = sentences.filter(
      (s) => /openapi\.yaml/.test(s) && /\b(is a bug|is wrong|is broken|must match)\b/i.test(s),
    );
    expect(accusing).toEqual([]);
    expect(/update `?openapi\.yaml`?|updating `?openapi\.yaml`?/.test(section.body)).toBe(true);
  });

  test("criterion 9: uv run pytest runs backend/tests/ only; integration lives in backend/integration/", () => {
    expect(
      /`uv run pytest` runs `backend\/tests\/` only|uv run pytest runs backend\/tests\/ only/.test(
        section.body,
      ),
    ).toBe(true);
    expect(section.body).toContain("backend/integration/");
    expect(section.body).toContain("make -C backend test-integration");
  });

  const nn = noNetworkRegion(doc);
  const nnLines = logicalLines(nn.block);
  const setsProxy = (l: string) =>
    PROXY_VARS.some((v) => new RegExp(`(?<![A-Za-z_])${v}=`).test(l));
  const guardIdx = nnLines.findIndex(setsProxy);

  test("criterion 10: the backend install runs before the guarded command, without proxy variables, from backend/", () => {
    const installIdx = nnLines.findIndex((l) => /^\s*uv sync( --frozen)?(\s|$)/.test(l));
    expect(installIdx).toBeGreaterThanOrEqual(0);
    expect(guardIdx).toBeGreaterThan(installIdx);
    expect(setsProxy(nnLines[installIdx]!)).toBe(false);
    for (const v of PROXY_VARS) expect(nnLines[installIdx]!.includes(v), v).toBe(false);
    const cdBackend = nnLines.slice(0, installIdx).some((l) => /^\s*cd backend\/?(\s|$|#)/.test(l));
    const startsInBackend = /from `?backend\/`?/.test(nn.prose);
    expect(cdBackend || startsInBackend).toBe(true);
  });

  test("criterion 11: the guarded test command sets all six proxy variables to http://127.0.0.1:1", () => {
    expect(guardIdx).toBeGreaterThanOrEqual(0);
    const guard = nnLines[guardIdx]!;
    for (const v of PROXY_VARS) {
      expect(
        new RegExp(`(?<![A-Za-z_])${v}=${DEAD_PROXY.replace(/[.:/]/g, "\\$&")}(\\s|$)`).test(guard),
        v,
      ).toBe(true);
    }
    expect(/uv run pytest/.test(guard)).toBe(true);
  });

  test("criterion 12: any bun package the block offers has its bun install before the guard, unguarded", () => {
    for (const pkg of ["frontend", "question-bank"]) {
      if (!nn.block.includes(pkg)) continue;
      const install = nnLines.findIndex(
        (l, i) =>
          i < guardIdx &&
          /bun install/.test(l) &&
          !setsProxy(l) &&
          (l.includes(pkg) ||
            nnLines.slice(0, i).some((p) => new RegExp(`cd [^\\n]*${pkg}`).test(p))),
      );
      expect(install, pkg).toBeGreaterThanOrEqual(0);
    }
    if (/bun test/.test(nn.block)) expect(/bun install/.test(nn.block)).toBe(true);
  });

  test("criterion 14: the 'Before you say it passes' pytest/ruff line is labelled backend, not api", () => {
    const line = beforeYouSayRegion(doc)
      .block.split("\n")
      .find((l) => /uv run pytest/.test(l) && /ruff/.test(l));
    expect(line).toBeDefined();
    expect(/#\s*backend\/?\s*$/.test(line ?? "")).toBe(true);
  });

  test("criterion 15: everything outside the three allowed regions is byte-identical to main at the survey baseline", () => {
    const digest = createHash("sha256").update(unchangedRemainder(doc)).digest("hex");
    expect(digest).toBe(REMAINDER_SHA256_AT_A7945CF);
  });
});
