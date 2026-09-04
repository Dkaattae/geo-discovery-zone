import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-008 acceptance criteria 7 and 10, written out as assertions by the worker
 * session (`process.md` step 3) as the criterion-10 deliverable — "a test that
 * CI already runs fails when a `uses:` reference in `ci.yml` is less pinned
 * than E-5's rule requires."
 *
 * `engineering-decisions.md` E-5's rule, restated as a predicate: an action's
 * *owner* decides its category. `actions/*` — published and operated by
 * GitHub — stays on a major tag (or, since that is strictly tighter, a full
 * commit SHA). Every other owner is pinned to a full 40-character commit SHA
 * with a trailing comment naming the release it corresponds to.
 *
 * This reads `.github/workflows/ci.yml` from disk and nothing else — no
 * network, per `test-guidelines.md` "No network in tests, ever". The
 * corresponding tag → SHA lookup (criterion 8) was done once, by hand, from a
 * shell with `git ls-remote`, and is recorded in the brief's Handoff — it is
 * never encoded here (criterion 9).
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const CI_PATH = ".github/workflows/ci.yml";
const workflow = readFileSync(join(REPO_ROOT, CI_PATH), "utf8");

interface UsesRef {
  line: string;
  owner: string;
  repo: string;
  ref: string;
  comment: string | null;
}

/** Every `uses: owner/repo@ref [# comment]` line in the workflow, in order. */
function usesRefs(): UsesRef[] {
  const matches: UsesRef[] = [];
  for (const line of workflow.split("\n")) {
    const match = line.match(
      /^\s*(?:-\s+)?uses:\s+([^/\s]+)\/([^@\s]+)@(\S+?)(?:\s+#\s*(.+))?\s*$/,
    );
    if (!match) continue;
    matches.push({
      line,
      owner: match[1]!,
      repo: match[2]!,
      ref: match[3]!,
      comment: match[4] ?? null,
    });
  }
  return matches;
}

const FULL_SHA = /^[0-9a-f]{40}$/;
const FORBIDDEN_REFS = new Set(["main", "master", "latest"]);

/** E-5's rule: is this owner pinned by SHA, or allowed to stay on a tag? */
function isPinnedCategory(owner: string): boolean {
  return owner !== "actions";
}

describe("T-008 criterion 10 — ci.yml's uses: refs conform to E-5's rule", () => {
  test("ci.yml has at least the four actions the rule was written for", () => {
    const owners = usesRefs().map((u) => `${u.owner}/${u.repo}`);
    expect(owners).toContain("actions/checkout");
    expect(owners).toContain("actions/upload-artifact");
    expect(owners).toContain("oven-sh/setup-bun");
    expect(owners).toContain("astral-sh/setup-uv");
  });

  test("no reference anywhere uses @main, @master, @latest or another branch name", () => {
    for (const u of usesRefs()) {
      expect(FORBIDDEN_REFS.has(u.ref)).toBe(false);
    }
  });

  test("actions/* references stay on a version tag (or an equal-or-tighter commit SHA)", () => {
    const firstParty = usesRefs().filter((u) => !isPinnedCategory(u.owner));
    expect(firstParty.length).toBeGreaterThan(0);
    for (const u of firstParty) {
      const isVersionTag = /^v[0-9]/.test(u.ref);
      const isSha = FULL_SHA.test(u.ref);
      expect(isVersionTag || isSha).toBe(true);
    }
  });

  test("every non-actions/* reference is pinned to a full commit SHA with a version comment", () => {
    const thirdParty = usesRefs().filter((u) => isPinnedCategory(u.owner));
    expect(thirdParty.length).toBeGreaterThan(0);
    for (const u of thirdParty) {
      expect(FULL_SHA.test(u.ref)).toBe(true);
      expect(u.comment).not.toBeNull();
      expect(u.comment ?? "").toMatch(/^v[0-9]/);
    }
  });
});
