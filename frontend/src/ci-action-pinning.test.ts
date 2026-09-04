import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-008, written by the `tester` session from the brief's acceptance criteria
 * (`process.md` step 4) — not from the implementation. It overlaps
 * `ci-workflow-pins.test.ts` (the worker's criterion-10 deliverable) on purpose:
 * this file is the independent restatement, and it is stricter in three places
 * the criteria are explicit about and the worker's file is not — the SHA must be
 * *lowercase* hex (criterion 7), the trailing comment must name a *released
 * version* rather than any `v…` token (criterion 7), and no fifth action may
 * appear at all (criterion 14).
 *
 * The rule being checked is `engineering-decisions.md` E-5's, which criterion 2
 * requires to resolve every reference in `ci.yml` into exactly one category:
 * owner `actions` (GitHub's own) may stay on a version tag; every other owner is
 * pinned to a full commit SHA with a version comment.
 *
 * Reads `.github/workflows/ci.yml` from disk and nothing else. No network, ever
 * (criterion 9, `test-guidelines.md`): the tag -> SHA correspondence of
 * criterion 8 was checked by hand with `git ls-remote` and recorded in the
 * brief's Verdict, never asserted here.
 */

const REPO_ROOT = join(import.meta.dirname, "../..");
const CI_YML = readFileSync(join(REPO_ROOT, ".github/workflows/ci.yml"), "utf8");

/** The four actions `ci.yml` used when T-008 was written. Criterion 14 forbids a fifth. */
const EXPECTED_ACTIONS = [
  "actions/checkout",
  "actions/upload-artifact",
  "astral-sh/setup-uv",
  "oven-sh/setup-bun",
];

const LOWERCASE_SHA = /^[0-9a-f]{40}$/;
const VERSION_TAG = /^v\d+(\.\d+)*$/;
/** "a comment naming the released version it corresponds to (`# v5.0.0`)". */
const RELEASE_COMMENT = /^v\d+\.\d+(\.\d+)?\b/;

interface Reference {
  action: string;
  owner: string;
  ref: string;
  comment: string | null;
}

function references(workflow: string): Reference[] {
  const found: Reference[] = [];
  for (const line of workflow.split("\n")) {
    const match = line.match(
      /^\s*(?:-\s+)?uses:\s*([^/\s]+)\/([^@\s]+)@([^\s#]+)\s*(?:#\s*(.*?))?\s*$/,
    );
    if (!match) continue;
    found.push({
      action: `${match[1]!}/${match[2]!}`,
      owner: match[1]!,
      ref: match[3]!,
      comment: match[4] ?? null,
    });
  }
  return found;
}

/**
 * Every way a workflow's `uses:` lines can violate E-5, as a list of strings so
 * a failure names the offending line rather than just going red.
 */
function violations(workflow: string): string[] {
  const problems: string[] = [];
  for (const { action, owner, ref, comment } of references(workflow)) {
    const pinned = owner !== "actions";
    const isSha = LOWERCASE_SHA.test(ref);
    const isTag = VERSION_TAG.test(ref);

    if (!isSha && !isTag) {
      problems.push(`${action}@${ref}: neither a 40-char lowercase SHA nor a version tag`);
      continue;
    }
    if (pinned && !isSha) {
      problems.push(`${action}@${ref}: third-party action must be pinned to a commit SHA`);
      continue;
    }
    if (isSha && comment === null) {
      problems.push(`${action}@${ref}: SHA pin has no comment naming its release`);
      continue;
    }
    if (isSha && !RELEASE_COMMENT.test(comment ?? "")) {
      problems.push(`${action}@${ref}: comment ${JSON.stringify(comment)} does not name a release`);
    }
  }
  return problems;
}

describe("T-008 criterion 7 — every uses: reference in ci.yml conforms to E-5", () => {
  test("ci.yml still contains the four actions the rule was written for", () => {
    const actions = [...new Set(references(CI_YML).map((r) => r.action))].sort();
    expect(actions).toEqual(EXPECTED_ACTIONS);
  });

  test("ci.yml has thirteen uses: references, none of them unparsed", () => {
    // The survey in the brief counted 13; criterion 11 forbids losing any of the
    // steps that carry them. A `uses:` line the parser cannot read would show up
    // here as a short count rather than passing silently.
    expect(references(CI_YML).length).toBe(13);
    expect(CI_YML.split("\n").filter((l) => /^\s*(?:-\s+)?uses:/.test(l)).length).toBe(13);
  });

  test("no reference uses a branch name — no @main, @master, @latest, nothing unversioned", () => {
    const branchy = references(CI_YML).filter(
      (r) => !LOWERCASE_SHA.test(r.ref) && !VERSION_TAG.test(r.ref),
    );
    expect(branchy.map((r) => `${r.action}@${r.ref}`)).toEqual([]);
  });

  test("third-party references are pinned to a lowercase 40-hex SHA with a release comment", () => {
    const thirdParty = references(CI_YML).filter((r) => r.owner !== "actions");
    expect(thirdParty.length).toBeGreaterThan(0);
    for (const r of thirdParty) {
      expect(`${r.action} ref=${r.ref}`).toMatch(/ ref=[0-9a-f]{40}$/);
      expect(`${r.action} comment=${r.comment}`).toMatch(/ comment=v\d+\.\d+/);
    }
  });

  test("actions/* references are on a version tag, or on a SHA if someone pins tighter", () => {
    const firstParty = references(CI_YML).filter((r) => r.owner === "actions");
    expect(firstParty.length).toBeGreaterThan(0);
    for (const r of firstParty) {
      expect(VERSION_TAG.test(r.ref) || LOWERCASE_SHA.test(r.ref)).toBe(true);
    }
  });

  test("ci.yml as committed has no violations at all", () => {
    expect(violations(CI_YML)).toEqual([]);
  });
});

describe("T-008 criterion 10 — the check goes red when a reference is less pinned", () => {
  // Synthetic workflow fragments, so the discrimination is demonstrated in the
  // suite itself rather than only by hand-mutating ci.yml.
  const bunSha = "0c5077e51419868618aeaa5fe8019c62421857d6";
  const checkoutSha = "fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09";

  test("a third-party action on a major tag is a violation", () => {
    expect(violations("      - uses: oven-sh/setup-bun@v2\n")).toHaveLength(1);
  });

  test("a third-party action on a branch name is a violation", () => {
    expect(violations("      - uses: astral-sh/setup-uv@main\n")).toHaveLength(1);
  });

  test("an actions/* reference on a branch name is a violation", () => {
    expect(violations("      - uses: actions/checkout@main\n")).toHaveLength(1);
  });

  test("an actions/* reference on @latest is a violation", () => {
    expect(violations("      - uses: actions/upload-artifact@latest\n")).toHaveLength(1);
  });

  test("a SHA pin with no comment naming its release is a violation", () => {
    expect(violations(`      - uses: oven-sh/setup-bun@${bunSha}\n`)).toHaveLength(1);
    expect(violations(`      - uses: oven-sh/setup-bun@${bunSha} # pinned\n`)).toHaveLength(1);
  });

  test("a truncated or uppercased SHA is a violation, not a pin", () => {
    expect(
      violations(`      - uses: oven-sh/setup-bun@${bunSha.slice(0, 12)} # v2.2.0\n`),
    ).toHaveLength(1);
    expect(
      violations(`      - uses: oven-sh/setup-bun@${bunSha.toUpperCase()} # v2.2.0\n`),
    ).toHaveLength(1);
  });

  test("pinning tighter than the rule requires is never punished", () => {
    // actions/* may stay on a tag; a SHA there is an improvement, so it stays green.
    expect(violations(`      - uses: actions/checkout@${checkoutSha} # v5.1.0\n`)).toEqual([]);
    expect(violations("      - uses: actions/checkout@v5\n")).toEqual([]);
    expect(violations(`      - uses: oven-sh/setup-bun@${bunSha} # v2.2.0\n`)).toEqual([]);
  });
});

describe("T-008 criterion 14 — no new GitHub Action", () => {
  test("ci.yml uses no action beyond the four it already had", () => {
    const unexpected = references(CI_YML)
      .map((r) => r.action)
      .filter((a) => !EXPECTED_ACTIONS.includes(a));
    expect(unexpected).toEqual([]);
  });
});
