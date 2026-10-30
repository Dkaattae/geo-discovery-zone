/**
 * T-091 tester: one `describe` per acceptance criterion of
 * `tasks/T-091-climate-cold-trade-accepted.md`. Expected values come from the
 * criteria and from the committed files; the counts in criteria 5-7 are
 * computed here from `question-bank/data/questions/us-states.json` and each
 * state's `climate_kid`, never read out of the record being checked.
 *
 * **Main** is `12d242e`. Its baselines are embedded as sha256 digests,
 * computed once by running this same file in a `git worktree` of `12d242e`,
 * because CI checks out shallow and no git call here may be handed a revision
 * (the T-081 guard, `git-exit-guard.criteria.test.ts`). Each pin is labelled
 * "recorded at 12d242e". A later task that deliberately changes one of these
 * files turns its pin red; that task's tester raises a test change request.
 *
 * Pure: no network, no seam, nothing mocked, nothing written. The only I/O is
 * reading committed files and `git ls-files`.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dirname, "../..");
const read = (p: string): string => readFileSync(join(REPO, p), "utf8");
const sha = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");
const collapse = (s: string): string => s.replace(/\s+/g, " ");

function gitLsFiles(...paths: string[]): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", ...paths], { cwd: REPO });
  if (proc.exitCode !== 0) {
    throw new Error(`git ls-files exited ${proc.exitCode}: ${proc.stderr.toString()}`);
  }
  return proc.stdout.toString().split("\0").filter(Boolean).sort();
}
const fileRowsSha = (files: string[]): string =>
  sha(JSON.stringify(files.map((f) => [f, sha(readFileSync(join(REPO, f)))])));
const isTestFile = (f: string): boolean =>
  /\.test\.tsx?$/.test(f) || /(^|\/)test_[^/]*\.py$/.test(f);

// ---- Pins, recorded at 12d242e ----------------------------------------------

/** Criterion 13: E-27 from its heading up to "None of this breaks a T-090 criterion". */
const MAIN_E27_HEAD_SHA = "95240097ecb8ae2979c234a1e7a4ff581c82310909bf5e7f85259ce9d11bfa1d";
/** Criterion 14: E-27 from `### (c)` up to `## E-28 `. */
const MAIN_E27_TAIL_SHA = "0d474555a57a7ec253216cf7b38adf99d012921f64b5e163d643852aebdd864e";
/** Criterion 15: E-25 with the climate bullet cut out. */
const MAIN_E25_OUTSIDE_BULLET_SHA =
  "0b38f1a8bf86fc218dac6b3289b73cd2577267fbdd7feef226eb18dec68952c8";
/** Criterion 16: the file with E-25 and E-27 cut out. */
const MAIN_ED_OUTSIDE_E25_E27_SHA =
  "03397fadbfde82f66361a371adccbb2fccc5221c61dc60549d8c873bce54e8e5";
/** Criterion 16: every `## E-n` heading line, joined by "\n". */
const MAIN_HEADINGS_SHA = "d47040bc7ba1f9ceef9494956f3405b7a1568f227cda8875781b14c373647bd0";
/** Criterion 17. */
const MAIN_QUESTIONS_SHA = "cfd2f1f9092ac70b9a455110bb254c8145b71fff1b5d1331d384656088fec64b";
/** Criterion 18: every tracked file under question-bank/data/us-states/. */
const MAIN_STATES_DIR_SHA = "08b0d412d56003214f21359cce858b9211c549e4bd4d3a663da4564fd95f179c";
/** Criterion 19. */
const MAIN_CONTENT_JSON_SHA = "103e22e5a51b0e98145b423ca0cda5c1967b1d52a8b86d39853eb66862a33e58";
/** Criterion 20: every tracked non-test file under the three source trees. */
const MAIN_SOURCE_TREES_SHA = "3bd8eaa669e229cb4efe714e28233f802204759078a392aa5aa29b19c6763150";
/** Criterion 21: every package.json, bun.lock, pyproject.toml and uv.lock. */
const MAIN_DEPENDENCY_FILES_SHA =
  "74f692ed8754aa416b9c2d83dc3501213f947b1dba34d1293016e51eea248419";
/** Criterion 22: tracked non-test files outside CRITERION_22_ALLOWED. */
const MAIN_UNTOUCHABLE_SHA = "e0084ca28ce178da03ccef730813962af2b7415611b7a19a3e2f26a3c68d12b2";
const MAIN_UNTOUCHABLE_COUNT = 301;
/** Criterion 22: pre-existing test files, less the ones named in the brief's Test change request. */
const MAIN_TESTS_SHA = "0a3987e8c7dd965e77da71dba31fdea0f23c5ed66c163f50dcfc3e6cfdda6e8b";
const MAIN_TESTS_COUNT = 110;
/** Criterion 22: each file in TEST_CHANGE_REQUEST_FILES, as it was at 12d242e. */
const MAIN_REQUEST_FILE_SHAS: Record<string, string> = {
  "question-bank/src/agriculture-true-wrong-answers-verify.test.ts":
    "3080e942bfe0030142d8b66246b4951dca5fbcb26e41908be99f31d37b323139",
  "question-bank/src/seed-level-loose-ends-verify.test.ts":
    "1adbc040445874727421320ca36ac687da0f573f2ea41f099f5c21d0de808134",
  "question-bank/src/map-click-no-candidates-verify.test.ts":
    "fd81f12cbddf2c29a03693a59af296ff31b1613b5bfe352fb6f19ed7b8250958",
  "question-bank/src/farm-animal-loose-ends-verify.test.ts":
    "2786beb72297fba0dd26ca9067e77d48126fbceb3ebb6cfe879f2860d2d6223d",
  "question-bank/src/familiarity-drawn-apart-verify.test.ts":
    "c28a7039af33fc9577f2239d41716a789adcaada83e4a67526e241b0f780118d",
  "backend/tests/test_t089_tester_criteria.py":
    "d90d2f2c75803b6f14c3f9d95d7b60d44912c9bc971b490e32016af4f8c619b6",
};

/**
 * Criterion 22's list. `tasks.md` and `PROGRESS.md` are the reviewer's sweep;
 * `tasks.md` also carries the expander's `todo` -> `doing` flip on T-091's
 * heading, the loop's own record (same reading as T-096's tester).
 */
const CRITERION_22_ALLOWED = new Set([
  "engineering-decisions.md",
  "tasks/T-091-climate-cold-trade-accepted.md",
  "runs/T-091-climate-cold-trade-accepted.md",
  "tasks.md",
  "PROGRESS.md",
]);
/** New test files this task adds. */
const T091_TEST_FILES = new Set(["question-bank/src/climate-cold-trade-accepted-verify.test.ts"]);
/**
 * Pre-existing tests named in the brief's Test change request. They may differ
 * from main only once the brief's header reads `Test changes: approved`.
 */
const TEST_CHANGE_REQUEST_FILES = new Set([
  "question-bank/src/agriculture-true-wrong-answers-verify.test.ts",
  "question-bank/src/seed-level-loose-ends-verify.test.ts",
  "question-bank/src/map-click-no-candidates-verify.test.ts",
  "question-bank/src/farm-animal-loose-ends-verify.test.ts",
  "question-bank/src/familiarity-drawn-apart-verify.test.ts",
  "backend/tests/test_t089_tester_criteria.py",
]);

// ---- The record -------------------------------------------------------------

const ED = (): string => read("engineering-decisions.md");

/** From the line starting `start` up to, not including, the line starting `end`. */
function between(text: string, start: string, end: string): string {
  const a = text.indexOf(start);
  if (a < 0) throw new Error(`missing ${JSON.stringify(start)}`);
  const b = text.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`missing ${JSON.stringify(end)} after ${JSON.stringify(start)}`);
  return text.slice(a, b);
}
const E25 = (ed: string): string => between(ed, "\n## E-25 ", "\n## E-26 ").slice(1);
const E27 = (ed: string): string => between(ed, "\n## E-27 ", "\n## E-28 ").slice(1);
const BULLET_START = "**`climates_outside_group`**";
const BULLET_END = "**`crops_not_grown_nearby`**";
const climateBullet = (ed: string): string => between(E25(ed), BULLET_START, BULLET_END);
const T091_MARKER = /Amended \d{4}-\d{2}-\d{2} \(T-091\)/g;
function amendment(ed: string): string {
  const bullet = collapse(climateBullet(ed));
  const m = bullet.search(/Amended \d{4}-\d{2}-\d{2} \(T-091\)/);
  if (m < 0) throw new Error("no T-091 marker in the climate bullet");
  return bullet.slice(m);
}
const e27b = (ed: string): string => collapse(between(E27(ed), "### (b)", "### (c)"));
const sentences = (s: string): string[] => s.split(/(?<=[.!?])\s+/);

// ---- The bank ---------------------------------------------------------------

interface Q {
  templateId: string;
  choices: string[];
  correctIndex: number;
}
function climateQuestions(): Q[] {
  const j = JSON.parse(read("question-bank/data/questions/us-states.json")) as { questions: Q[] };
  return j.questions.filter((q) => q.templateId === "tpl-climate-of");
}
/** climate_kid text -> state ids that have it, from the committed state files. */
function stateOfPhrase(): Map<string, string[]> {
  const dir = "question-bank/data/us-states";
  const out = new Map<string, string[]>();
  for (const f of readdirSync(join(REPO, dir))) {
    if (!/^us-state-[a-z]{2}\.json$/.test(f)) continue;
    const e = JSON.parse(read(`${dir}/${f}`)) as { id: string; climate_kid?: string };
    if (typeof e.climate_kid !== "string") continue;
    out.set(e.climate_kid, [...(out.get(e.climate_kid) ?? []), e.id]);
  }
  return out;
}
const wrongOf = (q: Q): string[] => q.choices.filter((_c, i) => i !== q.correctIndex);
const hasCold = (s: string): boolean => /cold/i.test(s);
function wrongStates(q: Q, phrases: Map<string, string[]>): string[] {
  return wrongOf(q).map((c) => {
    const [id, ...more] = phrases.get(c) ?? [];
    if (id === undefined || more.length > 0)
      throw new Error(`choice does not map to one state: ${c}`);
    return id;
  });
}
function counts(): { onlyCold: number; hiCaOr: number; waAndOr: number } {
  const qs = climateQuestions();
  if (qs.length !== 50) throw new Error(`expected 50 climate questions, got ${qs.length}`);
  const phrases = stateOfPhrase();
  let onlyCold = 0;
  let hiCaOr = 0;
  let waAndOr = 0;
  for (const q of qs) {
    if (hasCold(q.choices[q.correctIndex] ?? "") && !wrongOf(q).some(hasCold)) onlyCold++;
    const ws = wrongStates(q, phrases);
    const set = [...new Set(ws)].sort();
    if (ws.length === 3 && set.join() === "us-state-ca,us-state-hi,us-state-or") hiCaOr++;
    if (ws.includes("us-state-wa") && ws.includes("us-state-or")) waAndOr++;
  }
  return { onlyCold, hiCaOr, waAndOr };
}

// ---- Criteria 1-9: the record in E-25 ---------------------------------------

describe("T-091 criterion 1: one T-091 amendment marker, after the T-090 one", () => {
  test("exactly one `Amended YYYY-MM-DD (T-091)` in the climate bullet, after `Amended … (T-090)`", () => {
    const bullet = collapse(climateBullet(ED()));
    expect(bullet.match(T091_MARKER)?.length ?? 0).toBe(1);
    const t090 = bullet.search(/Amended \d{4}-\d{2}-\d{2} \(T-090\)/);
    const t091 = bullet.search(/Amended \d{4}-\d{2}-\d{2} \(T-091\)/);
    expect(t090).toBeGreaterThanOrEqual(0);
    expect(t091).toBeGreaterThan(t090);
  });
});

describe("T-091 criterion 2: the amendment names Dkaattae, 2026-10-27 and (a)", () => {
  test("all three appear in the amendment", () => {
    const a = amendment(ED());
    for (const s of ["Dkaattae", "2026-10-27", "(a)"])
      expect([s, a.includes(s)]).toEqual([s, true]);
  });
});

describe("T-091 criterion 3: accepted, rule and caps unchanged", () => {
  test("contains `accept` and `unchanged` or `not changed`, case-insensitive", () => {
    const a = amendment(ED());
    expect(/accept/i.test(a)).toBe(true);
    expect(/unchanged|not changed/i.test(a)).toBe(true);
  });
});

describe("T-091 criterion 4: the amendment names E-27", () => {
  test("contains `E-27`", () => {
    expect(amendment(ED()).includes("E-27")).toBe(true);
  });
});

describe("T-091 criterion 5: `N of 50` for the only-cold answers, N from the bank", () => {
  test("the bank's count appears as `N of 50`, in a sentence about cold", () => {
    const n = counts().onlyCold;
    const hits = sentences(amendment(ED())).filter((s) => new RegExp(`\\b${n} of 50\\b`).test(s));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((s) => /cold/i.test(s))).toBe(true);
  });
});

describe("T-091 criterion 6: `N of 50` for wrong choices exactly {HI, CA, OR}, N from the bank", () => {
  test("the bank's count appears as `N of 50`, in a sentence naming the three states", () => {
    const n = counts().hiCaOr;
    const hits = sentences(amendment(ED())).filter((s) => new RegExp(`\\b${n} of 50\\b`).test(s));
    expect(hits.length).toBeGreaterThan(0);
    const names = (s: string) =>
      (/Hawaii/.test(s) && /California/.test(s) && /Oregon/.test(s)) ||
      (/\bHI\b/.test(s) && /\bCA\b/.test(s) && /\bOR\b/.test(s));
    expect(hits.some(names)).toBe(true);
  });
});

describe("T-091 criterion 7: how many offer both WA's and OR's phrases as wrong, N from the bank", () => {
  test("a number followed in its sentence by Washington and Oregon (or WA and OR) equals the bank's count", () => {
    const n = counts().waAndOr;
    const stated: number[] = [];
    for (const s of sentences(amendment(ED()))) {
      for (const m of s.matchAll(/\b\d+\b/g)) {
        const rest = s.slice((m.index ?? 0) + m[0].length);
        const both =
          (/Washington/.test(rest) && /Oregon/.test(rest)) ||
          (/\bWA\b/.test(rest) && /\bOR\b/.test(rest));
        if (both) stated.push(Number(m[0]));
      }
    }
    expect(stated.length).toBeGreaterThan(0);
    expect(stated).toEqual(stated.map(() => n));
  });
});

describe("T-091 criterion 8: the three options not taken, by label and key term", () => {
  test("(b) same-climate group, (c) season word, (d) same words", () => {
    const a = amendment(ED());
    expect(/\(b\)[^()]*?same-climate group/i.test(a)).toBe(true);
    expect(/\(c\)[^()]*?season word/i.test(a)).toBe(true);
    expect(/\(d\)[^()]*?same words/i.test(a)).toBe(true);
  });
});

describe("T-091 criterion 9: NY, RI and CA, and `too hard`", () => {
  test("names the three (by code or name) and `too hard`", () => {
    const a = amendment(ED());
    expect(/\bNY\b|New York/.test(a)).toBe(true);
    expect(/\bRI\b|Rhode Island/.test(a)).toBe(true);
    expect(/\bCA\b|California/.test(a)).toBe(true);
    expect(a.includes("too hard")).toBe(true);
  });
});

// ---- Criteria 10-12: the Owner line in E-27 (b) ------------------------------

describe("T-091 criterion 10: the open Owner line is gone", () => {
  test("E-27 (b) has no `Owner: the person reading T-090's escalated review`", () => {
    expect(e27b(ED()).includes("Owner: the person reading T-090's escalated review")).toBe(false);
  });
});

describe("T-091 criterion 11: E-27 (b) records the settlement", () => {
  test("contains Dkaattae, 2026-10-27, T-091 and E-25", () => {
    const b = e27b(ED());
    for (const s of ["Dkaattae", "2026-10-27", "T-091", "E-25"]) {
      expect([s, b.includes(s)]).toEqual([s, true]);
    }
  });
});

describe("T-091 criterion 12: E-27 (b) keeps the strings T-090's verify file reads", () => {
  test("`**47** offer at least one` and `**0** offer both`", () => {
    const b = e27b(ED());
    expect(b.includes("**47** offer at least one")).toBe(true);
    expect(b.includes("**0** offer both")).toBe(true);
  });
});

// ---- Criteria 13-16: nothing else in the record moves ------------------------

describe("T-091 criterion 13: E-27 up to `None of this breaks a T-090 criterion` is main's", () => {
  test("byte-identical to 12d242e's", () => {
    const e27 = E27(ED());
    const cut = e27.indexOf("\nNone of this breaks a T-090 criterion");
    expect(cut).toBeGreaterThan(0);
    expect(sha(e27.slice(0, cut + 1))).toBe(MAIN_E27_HEAD_SHA);
  });
});

describe("T-091 criterion 14: E-27 from `### (c)` to `## E-28 ` is main's", () => {
  test("byte-identical to 12d242e's", () => {
    const e27 = E27(ED());
    const at = e27.indexOf("### (c)");
    expect(at).toBeGreaterThan(0);
    expect(sha(e27.slice(at))).toBe(MAIN_E27_TAIL_SHA);
  });
});

describe("T-091 criterion 15: E-25 outside the climate bullet is main's", () => {
  test("byte-identical to 12d242e's, T-088 amendment and Revisit paragraph included", () => {
    const e25 = E25(ED());
    const bullet = climateBullet(ED());
    const at = e25.indexOf(bullet);
    expect(at).toBeGreaterThan(0);
    const outside = e25.slice(0, at) + e25.slice(at + bullet.length);
    expect(outside.includes("(T-088)")).toBe(true);
    expect(outside.includes("**Revisit when**")).toBe(true);
    expect(sha(outside)).toBe(MAIN_E25_OUTSIDE_BULLET_SHA);
  });
});

describe("T-091 criterion 16: outside E-25 and E-27 the file is main's; headings E-1..E-30", () => {
  test("byte-identical to 12d242e's outside the two entries", () => {
    const ed = ED();
    const e25 = E25(ed);
    const e27 = E27(ed);
    const rest = ed.replace(e25, "").replace(e27, "");
    expect(rest.length).toBe(ed.length - e25.length - e27.length);
    expect(sha(rest)).toBe(MAIN_ED_OUTSIDE_E25_E27_SHA);
  });
  test("the `## E-n` headings are exactly E-1..E-30, in order, each line main's", () => {
    const lines = ED()
      .split("\n")
      .filter((l) => /^## E-\d+/.test(l));
    expect(lines.map((l) => Number(/^## E-(\d+)/.exec(l)?.[1]))).toEqual(
      Array.from({ length: 30 }, (_v, i) => i + 1),
    );
    expect(sha(lines.join("\n"))).toBe(MAIN_HEADINGS_SHA);
  });
});

// ---- Criteria 17-20: nothing in the bank or the code moves --------------------

describe("T-091 criterion 17: the question file is main's", () => {
  test("question-bank/data/questions/us-states.json is byte-identical to 12d242e's", () => {
    expect(sha(readFileSync(join(REPO, "question-bank/data/questions/us-states.json")))).toBe(
      MAIN_QUESTIONS_SHA,
    );
  });
});

describe("T-091 criterion 18: every state file is main's", () => {
  test("every tracked file under question-bank/data/us-states/ is byte-identical to 12d242e's", () => {
    const files = gitLsFiles("question-bank/data/us-states/");
    expect(files.length).toBe(51);
    expect(fileRowsSha(files)).toBe(MAIN_STATES_DIR_SHA);
  });
});

describe("T-091 criterion 19: content.json is main's", () => {
  test("backend/app/data/content.json is byte-identical to 12d242e's", () => {
    expect(sha(readFileSync(join(REPO, "backend/app/data/content.json")))).toBe(
      MAIN_CONTENT_JSON_SHA,
    );
  });
});

describe("T-091 criterion 20: no non-test source file moves", () => {
  test("every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's", () => {
    const files = gitLsFiles("question-bank/src/", "backend/app/", "frontend/src/").filter(
      (f) => !isTestFile(f),
    );
    expect(files).toContain("question-bank/src/distractors.ts");
    expect(files).toContain("question-bank/src/templates.ts");
    expect(files).toContain("question-bank/src/seed-level.ts");
    expect(fileRowsSha(files)).toBe(MAIN_SOURCE_TREES_SHA);
  });
});

// ---- Criteria 21-23: boundaries ---------------------------------------------

describe("T-091 criterion 21: no dependency is added or changed", () => {
  test("every package.json, bun.lock, backend/pyproject.toml and backend/uv.lock is 12d242e's", () => {
    const files = gitLsFiles().filter(
      (f) =>
        /(^|\/)package\.json$/.test(f) ||
        /(^|\/)bun\.lock$/.test(f) ||
        f === "backend/pyproject.toml" ||
        f === "backend/uv.lock",
    );
    expect(files).toContain("backend/pyproject.toml");
    expect(files).toContain("backend/uv.lock");
    expect(fileRowsSha(files)).toBe(MAIN_DEPENDENCY_FILES_SHA);
  });
});

describe("T-091 criterion 22: the diff touches only the allowed files", () => {
  test("every tracked non-test file outside the allowed list is 12d242e's, and none is added", () => {
    const rest = gitLsFiles().filter((f) => !CRITERION_22_ALLOWED.has(f) && !isTestFile(f));
    expect(rest.length).toBe(MAIN_UNTOUCHABLE_COUNT);
    expect(fileRowsSha(rest)).toBe(MAIN_UNTOUCHABLE_SHA);
  });
  test("pre-existing test files are main's, except ones in an approved Test change request", () => {
    const tests = gitLsFiles().filter(
      (f) => isTestFile(f) && !T091_TEST_FILES.has(f) && !TEST_CHANGE_REQUEST_FILES.has(f),
    );
    expect(tests.length).toBe(MAIN_TESTS_COUNT);
    expect(fileRowsSha(tests)).toBe(MAIN_TESTS_SHA);
  });
  test("a test named in the Test change request differs from main only once the brief says approved", () => {
    const brief = read("tasks/T-091-climate-cold-trade-accepted.md").split("\n").slice(0, 20);
    const approved = brief.some((l) => /^\*\*Test changes:\*\* `?approved/.test(l));
    const now = Object.fromEntries(
      [...TEST_CHANGE_REQUEST_FILES].map((f) => [f, sha(readFileSync(join(REPO, f)))]),
    );
    if (!approved) expect(now).toEqual(MAIN_REQUEST_FILE_SHAS);
    else expect(Object.keys(now).sort()).toEqual(Object.keys(MAIN_REQUEST_FILE_SHAS).sort());
  });
});

describe("T-091 criterion 23: no test reaches the network", () => {
  test("this task's test files hold no fetch, URL or http import, and spawn only git ls-files", () => {
    for (const f of T091_TEST_FILES) {
      const src = read(f);
      for (const needle of [
        "fetch" + "(",
        "http" + "://",
        "https" + "://",
        "node:" + "http",
        "node:" + "net",
      ]) {
        expect([f, needle, src.includes(needle)]).toEqual([f, needle, false]);
      }
      const spawns = src.match(/Bun\.spawn(?:Sync)?\(\s*\[[^\]]*\]/g) ?? [];
      expect(spawns.length).toBeGreaterThan(0);
      for (const s of spawns) expect([f, s.includes('"git", "ls-files"')]).toEqual([f, true]);
    }
  });
});
