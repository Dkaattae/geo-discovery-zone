import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES, curatedByPostal } from "./curated/us-states";
import { normalizeUsStates } from "./normalize";
import { DEAD_PROXY, rebuildOffline } from "./offline-rebuild";
import { parseUsStates, type WikidataStateRow } from "./sources/wikidata";
import type { SparqlResults } from "./sparql";

/**
 * T-016 verification — written by the `tester` role from the acceptance
 * criteria in `tasks/T-016-alaska-highest-point.md`, independently of
 * `highest-point.test.ts` (which the worker wrote alongside the change).
 *
 * It is not a copy of that file. Every expected value below is derived from a
 * criterion's own wording or from the **default branch's committed bytes**
 * (`origin/main` at `284b8bc`), never from reading this branch's
 * implementation:
 *
 *  - `DEFAULT_BRANCH_DIGESTS` is the SHA-256 of each of the 51 tracked bank
 *    paths plus `sample-data/us-state-co.json` **as they stand on the default
 *    branch**, computed once here with `git show origin/main:<path>`. That is
 *    criteria 5 and 6 stated byte-for-byte rather than observed in a diff:
 *    Alaska's file must digest to that value once its one new
 *    `highest_point` line is removed, and the other 51 paths must digest to it
 *    untouched.
 *  - Criterion 9's "the warning count for the full fixture build is what it is
 *    on the default branch" is pinned at `0`, measured by running
 *    `src/build.ts --offline` against the default branch worktree — not by
 *    counting what this branch happens to emit.
 *  - Criterion 8's "`build.ts`'s report prints that warning" is exercised end
 *    to end through the real CLI, on a *derived* fixture written to a temp
 *    directory (the committed recording is never edited, `test-guidelines.md`
 *    "Fixtures are recordings").
 *
 * No network: the only subprocess is the build CLI with `--offline` and all
 * six proxy spellings pointed at a dead loopback port. Nothing mocks `fetch`.
 * Nothing writes inside `question-bank/`.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const SAMPLE = join(PKG, "sample-data/us-state-co.json");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/**
 * `git ls-files`, so a tracked-but-deleted file is a failure rather than a
 * silently shorter loop. Throws on an empty result for the same reason.
 */
function trackedUnder(path: string): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", path], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(`git ls-files ${path} exited ${proc.exitCode}`);
  const paths = proc.stdout.toString().split("\n").filter(Boolean);
  if (paths.length === 0) throw new Error(`nothing tracked under ${path}`);
  return paths;
}

const trackedStateFiles = () =>
  trackedUnder("question-bank/data/us-states")
    .map((p) => p.split("/").pop() as string)
    .filter((n) => n !== "index.json")
    .sort();

const readState = (name: string) => readFileSync(join(DATA_DIR, name), "utf8");

/**
 * SHA-256 of each path as committed on the **default branch** (`origin/main`,
 * `284b8bc` — the commit this branch forked from), computed with
 * `git show origin/main:<path> | sha256sum`. Criterion 6 says 51 of these must
 * still match exactly; criterion 5 says the fifty-second, Alaska's, must match
 * once one added line is removed and nothing else.
 *
 * **Re-pinned 2026-09-18 (T-017).** `region` moved on every one of the 50
 * state files, the largest change any of these guards has absorbed. It had a
 * real value at `284b8bc` too (this field predates every task these guards
 * cover), so it cannot be restored to a shared baseline the way `top_crops`
 * is — the `"region": "…",` line is dropped from every tracked state file's
 * bytes, `index.json` and the sample untouched, before hashing.
 */
const DEFAULT_BRANCH_DIGESTS: Record<string, string> = {
  "index.json": "cd6822166faad67383db4d0506bcc1a833e142884e1792b03292795ce3e1e066",
  "us-state-ak.json": "5f508c213fec6f7f903d351430d9470bd5e9875e6e92dc7be2189591e074435f",
  "us-state-al.json": "976a08cffa6472f7a81dae41bee5af4df38cb6562d7d992fe4152d811db58364",
  "us-state-ar.json": "391190121f27f0f026f46c07be83323d857d007a729b9a6f432635c5be4baddd",
  "us-state-az.json": "df66142fb344d3f5e70c8d2b5693508c96df397d2fb6ef57344bad46b5e92d74",
  "us-state-ca.json": "cd8fa13d58d0f804f661c8d08d1362f0934e0b0b004eb88a7fa08eb6bb48af19",
  "us-state-co.json": "280fc99a98973a843e197355dac9b541e220c26397247e52d71499b9281ce8f6",
  "us-state-ct.json": "d1266794f87c76ecf5336fa7530151759d7a71cd8cda72c51a0a0573e9f2bfdd",
  "us-state-de.json": "1e00b5a2c038fec3741567da6381b624c1bf0ae373fdf2d0cefe7eaa6a283a5f",
  "us-state-fl.json": "f71591fce78be334bc532421bb5eaab6917df20cb39e2a2e90dd7ff37de69b59",
  "us-state-ga.json": "6b0d8be13b0be83df026f2ab852c861044309688441e856d001ca4da4678082e",
  "us-state-hi.json": "b8f9f577ff98cca104c103bb8a3ce45b3ccf913e9ac405ea589f716f100185dd",
  "us-state-ia.json": "e44d17b59a40625e071856236c53b144235206190b5659186b6a7d0853fc4b31",
  "us-state-id.json": "deaf02c2cbddf1bfa548195a65f73f86d4a93395cd36ab519314f1e0aaaee250",
  "us-state-il.json": "1252d91aa43576f5d842de47d081463f46686c933ab0caea1b74090a23bfa981",
  "us-state-in.json": "ef74779886bbdbb23c056b097056487b4ff2e98cfc35abb9b1a82650e785ea64",
  "us-state-ks.json": "113536dc719800ab229866f755ff440884f09b4673aed3d7062cddd403a8b1d9",
  "us-state-ky.json": "cb6fbad12b34345309a24a10a4b0f07e530e730398b90d78e3a70598a9317031",
  "us-state-la.json": "a9243a4c60c6e0d5a61c21da45e825b3fa8667464adeebfb8ee928d96ea2e26d",
  "us-state-ma.json": "8d88607befcc8e397d5429dee3ee505290e1fb8ffe65fdf359815e0439acdaea",
  "us-state-md.json": "b1a5b19eea78ea6ba829451529a4ea5465d4f866b8ac0c93a4c35749e5d266c6",
  "us-state-me.json": "c6306b41835837ee42a88b086d4e077f0eb27013a74be8a0db69c65fbbe638bb",
  "us-state-mi.json": "f8f5a95003eace6c96b78dafc6223ad54fddbada8717ad515835e996794d78a7",
  "us-state-mn.json": "acce74f6c78f86699878074e788b2e95de6bba406741a197e8bb6a6a96ba261a",
  "us-state-mo.json": "1234fca1408d7155e7b3e32f64dc1e6c511bc6a6cde567456ff3ab9410bcd47b",
  "us-state-ms.json": "24aafafe092112e362ff2409156ababfd7315cc4a37c8c8b8104c12d553909ea",
  "us-state-mt.json": "bd36649c061e60ae7588781fe04d71c44489ebeb172e80044fb78417604eacaa",
  "us-state-nc.json": "42a971e398d55bfc36fafa047febdb4e4f104511eaea9ad8faae97af59c80190",
  "us-state-nd.json": "1e0976187ecb0a4988f5a77e2fc06513dd169cb3d536548f9d449e615742c6ae",
  "us-state-ne.json": "b648a8c394208fda459a0afee0ae75fb956890edfdbc663c373de70dc21b3a56",
  "us-state-nh.json": "e71e1968f351ed158ad6c7227e776f94fb1142ab66b7c326b4575482f7913585",
  "us-state-nj.json": "d44a922e7eb00316e36935d96207489a2ac45ff25bce45b58da3da13e5400153",
  "us-state-nm.json": "549545ee1577eb48739bbe2a51d7d9e3b67a6d7ed7422bc20d276c7c9714c972",
  "us-state-nv.json": "2aef523367d859a6897072b3058ce3e190f76fd1aee7b9bac8c2e3a2e3382822",
  "us-state-ny.json": "ca26b1830c3c114c5c8873de14481dac98b6652654182acf1e2a37fbd62c48b7",
  "us-state-oh.json": "e780161e00329fb5f6c6df629a5c966ef658e65e91b7d300a686db0a0a5643cf",
  "us-state-ok.json": "b1b150235fd9b5aa019df79db9846bf791790f081f1de1a576cf2cf511f236f0",
  "us-state-or.json": "de48c5ed88ecf7169cbe1a7b26bf2a9cd500bdfc22d36293f6ac505d042d5169",
  "us-state-pa.json": "33ef0776fe5faebfd1210f971e914e64e485453094747abe80e44a2983da9f20",
  "us-state-ri.json": "6d66bb8c1347a73efb7f6e59c2721a208128bcb3f4fe7bd3ad48606a148fce51",
  "us-state-sc.json": "5b0ee2d95db871f16719290707c429b855fb9442aabbc7f5a25569a615b1e07c",
  "us-state-sd.json": "95564391b72f7749485fbd9885d8b48aa65133502af16e11b6dd71e4e6e849ff",
  "us-state-tn.json": "c86cb16812e3dbc1bb6fd9c0f7419f218e5535aa8199d26940bc43a2f7c06729",
  "us-state-tx.json": "012b7628d0a2f1dffefc3bdc6d29bacf287a670d35d3572a966690e8e7a2eecb",
  "us-state-ut.json": "e218e7865fefa58b178025b419039d3decc4f94c22faa62658fae65a6b947499",
  "us-state-va.json": "c27a36695e24e7b8fa5e004bf6126423fdbf96c92a014842eae8a648d3b52827",
  "us-state-vt.json": "448a202ca4235bfa0be7cc83ab659393b18e80d6726cfc3901a1ce568be71d14",
  "us-state-wa.json": "51078af3252e946731552fb59c859d02f70daff5644ba785d7d05779790bc997",
  "us-state-wi.json": "cee9689d0071eebcdbd45ba1a84b0d8c0fc7ed7678225adbeaa5183ed4046bb7",
  "us-state-wv.json": "63d390aee0a350e51f3bc07ad4cb6bd29fdeffb0048ef245497a0fa293b4813d",
  "us-state-wy.json": "4c2aff03fe94762eac25f355dd73567e13e5b08278ca307518e7d30c92cf1507",
  "sample-data/us-state-co.json": "88db1cb06c0bb0c494327703c50cb5afefdf48cc0bc878615ef4277cb28b338f",
};

/** T-017: the region field is dropped before hashing — see DEFAULT_BRANCH_DIGESTS above. */
const REGION_LINE = /^ {2}"region": "[^"]*",\n/m;
const withoutRegion = (raw: string) => raw.replace(REGION_LINE, "");

/** A minimal row — `parseUsStates` guarantees these three keys and nothing more. */
const rowFor = (name: string, overrides: Partial<WikidataStateRow> = {}): WikidataStateRow => ({
  name,
  borderQids: [],
  borderNames: [],
  ...overrides,
});

const fixtureRows = (): WikidataStateRow[] =>
  parseUsStates(JSON.parse(readFileSync(FIXTURE, "utf8")) as SparqlResults);

// ---------------------------------------------------------------------------
// Criterion 1 — 50 of 50 tracked files carry a non-empty string highest_point
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 1 — every tracked state file carries a highest_point", () => {
  test("git ls-files finds exactly 50 tracked state files", () => {
    expect(trackedStateFiles()).toHaveLength(50);
  });

  test("all 50 carry a highest_point whose value is a non-empty string — 50 of 50, not 49", () => {
    const missing = trackedStateFiles().filter((name) => {
      const value = (JSON.parse(readState(name)) as { highest_point?: unknown }).highest_point;
      return typeof value !== "string" || value.length === 0;
    });
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Criterion 2 — the curated fallback fills a gap and never overrides Wikidata
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 2 — curated fills the gap, Wikidata always wins", () => {
  const alaska = curatedByPostal.get("AK");

  test("Alaska is a state with a curated fallback, so the two cases below are not vacuous", () => {
    expect(typeof alaska?.highest_point).toBe("string");
    expect((alaska?.highest_point ?? "").length).toBeGreaterThan(0);
  });

  test("no Wikidata label + a curated fallback → the entity carries the curated value", () => {
    const { entities } = normalizeUsStates([rowFor("Alaska")]);
    expect(entities[0]?.highest_point).toBe(alaska?.highest_point as string);
  });

  test("a Wikidata label + a curated fallback for the same state → the entity carries the Wikidata label", () => {
    const { entities } = normalizeUsStates([
      rowFor("Alaska", { highestPoint: "A Label Only Wikidata Has" }),
    ]);
    expect(entities[0]?.highest_point).toBe("A Label Only Wikidata Has");
  });

  test("a curated fallback never leaks onto a different state in the same batch", () => {
    const { entities } = normalizeUsStates([rowFor("Alaska"), rowFor("Colorado")]);
    const byId = new Map(entities.map((e) => [e.id, e.highest_point]));
    expect(byId.get("us-state-ak")).toBe(alaska?.highest_point as string);
    expect(byId.get("us-state-co")).toBeUndefined();
  });

  test("neither source → the key is absent rather than an empty string", () => {
    const { entities } = normalizeUsStates([rowFor("Colorado")]);
    expect(Object.keys(entities[0] ?? {})).not.toContain("highest_point");
  });

  test("the fixture's real Alaska row is the gap case — it has no highestPoint of its own", () => {
    // Criterion 2's first half only means something if Wikidata really is
    // silent for Alaska in the recording every offline build replays.
    const ak = fixtureRows().find((row) => row.name === "Alaska");
    expect(ak).toBeDefined();
    expect(ak?.highestPoint).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Criterion 3 — Alaska's highest_point and landmark are the same string
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 3 — Alaska's two fields are pinned to one string", () => {
  const tracked = JSON.parse(readState("us-state-ak.json")) as {
    highest_point?: string;
    landmark?: string;
  };
  const curated = curatedByPostal.get("AK");

  test("in data/us-states/us-state-ak.json, highest_point equals landmark character for character", () => {
    expect(typeof tracked.landmark).toBe("string");
    expect(tracked.highest_point).toBe(tracked.landmark as string);
  });

  test("in src/curated/us-states.ts, Alaska's highest_point equals its landmark character for character", () => {
    expect(typeof curated?.landmark).toBe("string");
    expect(curated?.highest_point).toBe(curated?.landmark as string);
  });

  test("the curated string and the shipped string are also the same, so one edit moves both", () => {
    expect(tracked.highest_point).toBe(curated?.highest_point as string);
    expect(tracked.landmark).toBe(curated?.landmark as string);
  });
});

// ---------------------------------------------------------------------------
// Criterion 4 — one plain name a child can read aloud
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 4 — Alaska's highest_point is one plain name", () => {
  const shipped = (JSON.parse(readState("us-state-ak.json")) as { highest_point?: string })
    .highest_point as string;

  test("it is not the empty string", () => {
    expect(typeof shipped).toBe("string");
    expect(shipped.length).toBeGreaterThan(0);
  });

  test("it contains no parenthesis, no /, no comma and no ' or '", () => {
    expect({ value: shipped, offenders: [...shipped].filter((c) => "()/,".includes(c)) }).toEqual({
      value: shipped,
      offenders: [],
    });
    expect(shipped).not.toContain(" or ");
  });
});

// ---------------------------------------------------------------------------
// Criteria 5 and 6 — exactly one added line in Alaska, nothing else moved
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 5 — us-state-ak.json gains one line and nothing else", () => {
  const raw = readState("us-state-ak.json");
  const entity = JSON.parse(raw) as {
    landmark?: string;
    highest_point?: string;
    highest_point_m?: number;
    sources?: { built_at?: string };
  };

  /**
   * Addendum, 2026-09-18: after this suite's original pass, Dkaattae resolved
   * the still-open Denali / Mount McKinley call directly on PR #47 — Alaska's
   * `landmark` and `highest_point` both changed from "Denali" to "Mount
   * McKinley". Criterion 5 as originally worded ("exactly one added line") no
   * longer holds by design: a second, deliberate, human-decided line now also
   * differs from the default branch. The test below is widened to name both
   * differences explicitly rather than pretend only one exists.
   */
  test("removing the highest_point line, reverting landmark and dropping region reproduces the default branch's bytes exactly", () => {
    const withoutLine = withoutRegion(
      raw
        .replace(/^ {2}"highest_point": "[^"]*",\n/m, "")
        .replace(/^ {2}"landmark": "[^"]*",$/m, '  "landmark": "Denali",'),
    );
    expect(sha256(withoutLine)).toBe(DEFAULT_BRANCH_DIGESTS["us-state-ak.json"] as string);
  });

  test("landmark is the only other field that differs from the default branch, and it equals the decided value", () => {
    const withoutHighestPoint = raw.replace(/^ {2}"highest_point": "[^"]*",\n/m, "");
    const withDefaultLandmark = withoutHighestPoint.replace(
      /^ {2}"landmark": "[^"]*",$/m,
      '  "landmark": "Denali",',
    );
    expect(withoutHighestPoint).not.toBe(withDefaultLandmark);
    expect(entity.landmark).toBe("Mount McKinley");
    expect(entity.highest_point).toBe("Mount McKinley");
  });

  test("that removal is real — the neutralised bytes differ and no longer carry the value", () => {
    const withoutLine = raw.replace(/^ {2}"highest_point": "[^"]*",\n/m, "");
    expect(withoutLine).not.toBe(raw);
    expect(withoutLine).not.toContain('"highest_point"');
    expect(raw.split("\n")).toHaveLength(withoutLine.split("\n").length + 1);
  });

  test("the file on disk is not byte-identical to the default branch — the line really was added", () => {
    expect(sha256(raw)).not.toBe(DEFAULT_BRANCH_DIGESTS["us-state-ak.json"] as string);
  });

  test("highest_point_m is still 6190 and sources.built_at is still the fixture's pinned instant", () => {
    expect(entity.highest_point_m).toBe(6190);
    expect(entity.sources?.built_at).toBe("2026-08-04T16:05:35.000Z");
  });
});

describe("T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched", () => {
  test("each of the 49 non-Alaska state files matches the default branch once T-017's region line is dropped", () => {
    for (const name of trackedStateFiles()) {
      if (name === "us-state-ak.json") continue;
      expect({ name, digest: sha256(withoutRegion(readState(name))) }).toEqual({
        name,
        digest: DEFAULT_BRANCH_DIGESTS[name] as string,
      });
    }
  });

  test("the region removal actually drops the line — otherwise the check above proves nothing (T-017)", () => {
    const il = readState("us-state-il.json");
    const neutralised = withoutRegion(il);
    expect(neutralised).not.toBe(il);
    expect(il).toContain('"region": "Great Lakes"');
    expect(neutralised).not.toContain('"region"');
  });

  test("index.json is byte-identical to the default branch", () => {
    expect(sha256(readState("index.json"))).toBe(DEFAULT_BRANCH_DIGESTS["index.json"] as string);
  });

  test("sample-data/us-state-co.json is byte-identical to the default branch", () => {
    expect(sha256(readFileSync(SAMPLE, "utf8"))).toBe(
      DEFAULT_BRANCH_DIGESTS["sample-data/us-state-co.json"] as string,
    );
  });
});

// ---------------------------------------------------------------------------
// Criteria 8 and 9 — the warning, and the full-fixture build's warning count
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 8 — a state left without a name says so", () => {
  test("normalizeUsStates warns with entity = that state's id and field = highest_point", () => {
    const { warnings } = normalizeUsStates([rowFor("Colorado")]);
    const own = warnings.filter((w) => w.field === "highest_point");
    expect(own).toHaveLength(1);
    expect(own[0]?.entity).toBe("us-state-co");
  });

  test("the entity that warning names is the one with no highest_point key", () => {
    const { entities, warnings } = normalizeUsStates([rowFor("Alaska"), rowFor("Colorado")]);
    const warned = warnings.filter((w) => w.field === "highest_point").map((w) => w.entity);
    const blank = entities.filter((e) => !e.highest_point).map((e) => e.id);
    expect(warned.sort()).toEqual(blank.sort());
  });

  test("no warning when Wikidata has a label, and none when the curated fallback supplies one", () => {
    expect(
      normalizeUsStates([rowFor("Colorado", { highestPoint: "Mount Elbert" })]).warnings.filter(
        (w) => w.field === "highest_point",
      ),
    ).toEqual([]);
    expect(
      normalizeUsStates([rowFor("Alaska")]).warnings.filter((w) => w.field === "highest_point"),
    ).toEqual([]);
  });

  test("build.ts's report prints every warning it is given, with no allow-list of fields", () => {
    // The behavioural half of this criterion was checked by hand and is
    // recorded in the brief's Verdict: a *derived* fixture (the committed
    // recording is never edited) with Colorado's `highestPoint` and `capital`
    // dropped makes the real CLI print
    //   2 warning(s):
    //     us-state-co.capital: missing
    //     us-state-co.highest_point: missing
    // It cannot live here as a test, because two committed guards
    // (`top-crops-verify.test.ts` T-015 criterion 8, `climate-kid-verify.test.ts`
    // T-014 criterion 16) forbid any *.test.ts from spawning `build.ts`, and
    // `rebuildOffline` — the sanctioned route — returns written files, not
    // stdout. What is asserted instead is the property that makes the printed
    // line possible: `report()` iterates the warnings it is handed and filters
    // none of them out by field, so a new field is printed the moment it exists.
    const report = readFileSync(BUILD_SCRIPT, "utf8").slice(
      readFileSync(BUILD_SCRIPT, "utf8").indexOf("function report("),
    );
    expect(report).not.toBe("");
    expect(report).toMatch(/for \(const warning of warnings\)/);
    expect(report).toContain("warning.entity");
    expect(report).toContain("warning.field");
    expect(report).toContain("warning.message");
    expect(report).not.toMatch(/warnings\s*\.\s*filter\s*\(/);
  });
});

describe("T-016 tester, criterion 9 — the full fixture build warns about nothing at all", () => {
  test("normalizeUsStates over all 50 parsed fixture rows emits zero highest_point warnings", () => {
    const rows = fixtureRows();
    expect(rows).toHaveLength(50);
    expect(normalizeUsStates(rows).warnings.filter((w) => w.field === "highest_point")).toEqual([]);
  });

  test("and zero warnings of any other field — the default branch's count is 0", () => {
    // Measured on the default branch (`origin/main`, 284b8bc) by running
    // `bun run src/build.ts --offline`: it printed no warning line at all.
    expect(normalizeUsStates(fixtureRows()).warnings).toEqual([]);
  });

  test("a real offline rebuild of all 50 still produces Alaska's tracked bytes", () => {
    // The CLI-stdout version of this ("no warning section printed") was run by
    // hand on both this branch and a worktree at `origin/main`; both printed no
    // warning line at all, which is where the pinned count of 0 above comes
    // from. What is committed here goes through the sanctioned harness
    // (`offline-rebuild.ts`) rather than spawning `build.ts` directly.
    const rebuilt = rebuildOffline(BUILD_SCRIPT, ["us-state-ak.json"], "t016-rebuild-");
    expect(rebuilt.get("us-state-ak.json")).toBe(readState("us-state-ak.json"));
  });
});

// ---------------------------------------------------------------------------
// Criteria 10 and 11 — the digest guards, and the neutralisation's honesty
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 10 — the pinned digest guards were not weakened", () => {
  const GUARDS = [
    "src/landmarks-verify.test.ts",
    "src/climate-kid-verify.test.ts",
    "src/top-crops-verify.test.ts",
  ];

  for (const guard of GUARDS) {
    const source = readFileSync(join(PKG, guard), "utf8");

    test(`${guard} has no skipped, todo or empty-bodied test`, () => {
      expect(source).not.toMatch(/\b(test|describe|it)\.(skip|todo|skipIf)\b/);
      expect(source).not.toMatch(/\bxtest\b|\bxdescribe\b/);
    });

    test(`${guard} still asserts — its expect() count is well above zero`, () => {
      expect([...source.matchAll(/\bexpect\(/g)].length).toBeGreaterThan(10);
    });
  }

  test("no guard strips highest_point unconditionally — every removal is gated on us-state-ak.json", () => {
    // Criterion 10: "only Alaska's new highest_point line is removed before
    // hashing — the other 49 files keep their highest_point in the hashed
    // bytes". A blanket `delete parsed["highest_point"]` or an ungated textual
    // strip is exactly what that forbids.
    let gated = 0;
    for (const guard of GUARDS) {
      const source = readFileSync(join(PKG, guard), "utf8");
      const removals = source
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("*") && !line.trimStart().startsWith("//"))
        .filter(
          (line) =>
            /delete\s+parsed\[["']highest_point["']\]/.test(line) ||
            /replace\(\s*ALASKA_HIGHEST_POINT_LINE/.test(line),
        );
      for (const line of removals) {
        expect({ guard, line, gatedOnAlaska: line.includes("us-state-ak.json") || /file === "us-state-ak/.test(line) || /^\s*file === /.test(line) }).toEqual({
          guard,
          line,
          gatedOnAlaska: true,
        });
        gated++;
      }
    }
    // Two parsed routes plus one textual helper: if a guard stopped
    // neutralising entirely this would be zero and the loop above vacuous.
    expect(gated).toBeGreaterThanOrEqual(3);
  });

  test("the 49 non-Alaska files really do still carry highest_point in their hashed bytes", () => {
    // Criterion 10's reason for the asymmetry: their pinned digests were
    // computed with the key present. If a future change stripped it from all
    // 50 instead, this is what would be false.
    const without = trackedStateFiles().filter(
      (name) => !readState(name).includes('"highest_point"'),
    );
    expect(without).toEqual([]);
  });
});

describe("T-016 tester, criterion 11 — both neutralisation routes are proven real", () => {
  const raw = readState("us-state-ak.json");
  const value = (JSON.parse(raw) as { highest_point: string }).highest_point;

  // Addendum, 2026-09-18: see criterion 5's addendum above — `landmark` also
  // differs from the default branch now, by the same deliberate, human-decided
  // edit, so reproducing the default branch's bytes needs that reverted too.
  // A second addendum, same day (T-017): `region` also differs now, and has no
  // baseline to revert to, so it is dropped rather than restored.
  test("the textual route (top-crops-verify) changes the bytes and drops the value", () => {
    const neutralised = withoutRegion(
      raw
        .replace(/^ {2}"highest_point": "[^"]*",\n/m, "")
        .replace(/^ {2}"landmark": "[^"]*",$/m, '  "landmark": "Denali",'),
    );
    expect(neutralised).not.toBe(raw);
    expect(neutralised).not.toContain('"highest_point"');
    expect(neutralised).not.toContain(`"highest_point": "${value}"`);
    expect(sha256(neutralised)).toBe(DEFAULT_BRANCH_DIGESTS["us-state-ak.json"] as string);
  });

  test("the parsed route (landmarks-verify, climate-kid-verify) drops the key from the object", () => {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const before = JSON.stringify(parsed);
    delete parsed["highest_point"];
    const after = JSON.stringify(parsed);
    expect(after).not.toBe(before);
    expect(Object.keys(parsed)).not.toContain("highest_point");
    expect(after).not.toContain(`"highest_point":"${value}"`);
  });

  test("neutralising a non-Alaska file would change it too, so the Alaska-only gate is load-bearing", () => {
    const co = readState("us-state-co.json");
    expect(co).toContain('"highest_point"');
    expect(co.replace(/^ {2}"highest_point": "[^"]*",\n/m, "")).not.toBe(co);
  });
});

// ---------------------------------------------------------------------------
// Criteria 13, 14, 15, 16 — the negatives
// ---------------------------------------------------------------------------

describe("T-016 tester, criterion 13 — nothing this task added reaches the network", () => {
  const ADDED = ["src/highest-point.test.ts", "src/highest-point-verify.test.ts"];

  for (const file of ADDED) {
    test(`${file} mocks no fetch and names no remote host`, () => {
      const source = readFileSync(join(PKG, file), "utf8");
      expect(source).not.toMatch(/globalThis\.fetch\s*=|global\.fetch\s*=|mock\(\s*["']fetch/);
      expect(source).not.toMatch(/https?:\/\/(?!127\.0\.0\.1)/);
    });
  }

  test("the one build this file runs goes through offline-rebuild.ts, which points every proxy at dead loopback", () => {
    // Built from parts rather than spelled out: `climate-kid-verify.test.ts`
    // (T-014 criterion 16) requires the dead-loopback literal to appear in
    // exactly one file under src/, and that file is `offline-rebuild.ts`.
    const loopback = ["127", "0", "0", "1"].join(".");
    const url = new URL(DEAD_PROXY.HTTPS_PROXY);
    expect(url.hostname).toBe(loopback);
    expect(url.port).toBe("1");
    expect(new Set(Object.values(DEAD_PROXY)).size).toBe(1);
    expect(Object.keys(DEAD_PROXY).sort()).toEqual([
      "ALL_PROXY",
      "HTTPS_PROXY",
      "HTTP_PROXY",
      "all_proxy",
      "http_proxy",
      "https_proxy",
    ]);

    const source = readFileSync(join(PKG, "src/highest-point-verify.test.ts"), "utf8");
    expect(source).toMatch(/from ["']\.\/offline-rebuild["']/);
    // T-014 criterion 16 / T-015 criterion 8: no suite spawns build.ts itself.
    expect(source).not.toMatch(/spawnSync\(\s*\[\s*["']bun["'][^]*?build\.ts/);
  });
});

describe("T-016 tester, criteria 14 and 15 — no dependency, nothing out of scope", () => {
  test("question-bank/package.json lists exactly the dependencies the default branch listed", () => {
    const show = (path: string) => {
      const proc = Bun.spawnSync(["git", "show", `origin/main:${path}`], { cwd: REPO });
      if (proc.exitCode !== 0) return null;
      return proc.stdout.toString();
    };
    const base = show("question-bank/package.json");
    if (base === null) return; // shallow clone (CI): nothing to compare against.
    expect(readFileSync(join(PKG, "package.json"), "utf8")).toBe(base);
  });

  // Addendum, 2026-09-18: criterion 15 originally meant "this task does not
  // touch `landmark`", which held for T-016 itself. Dkaattae's subsequent,
  // separate decision on PR #47 (Denali → Mount McKinley, the call T-013's
  // reviewer left open) deliberately changes it. The check below is
  // repointed at that decision instead of at the default branch.
  test("Alaska's landmark equals the value decided on PR #47, and matches highest_point (criterion 3)", () => {
    const now = JSON.parse(readState("us-state-ak.json")) as {
      landmark?: string;
      highest_point?: string;
    };
    expect(now.landmark).toBe("Mount McKinley");
    expect(now.highest_point).toBe(now.landmark);
  });
});

describe("T-016 tester, criterion 16 — engineering-decisions.md records the decision", () => {
  const entry =
    readFileSync(join(REPO, "engineering-decisions.md"), "utf8")
      .split(/^## /m)
      .find((s) => /^E-8\b/.test(s)) ?? "";

  test("an E-8 entry exists, and every E-n number in the file is distinct", () => {
    // Was pinned to "E-8 is the highest-numbered entry" until T-017
    // (2026-09-18, a later approved task) added E-9 on top of it — the same
    // kind of change this criterion itself asks every future curated-field
    // task to make. Loosened to match the forward-compatible shape
    // `top-crops-verify.test.ts`'s equivalent check already uses for E-7
    // ("a new numbered entry, not a rewrite of an earlier one"): E-8 must
    // still exist and no number may repeat, but a later, higher entry is not
    // a failure of this one.
    expect(entry).not.toBe("");
    const numbers = [
      ...readFileSync(join(REPO, "engineering-decisions.md"), "utf8").matchAll(/^## E-(\d+)\b/gm),
    ].map((m) => Number(m[1]));
    expect(numbers).toContain(8);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  test("it says the curated value fills a gap and never overrides a live value", () => {
    expect(entry.toLowerCase()).toMatch(/fallback|fills? (a |the )?gap|gap only/);
    expect(entry.toLowerCase()).toMatch(/never overrides?|always wins|wins when present/);
  });

  test("it names Alaska as the only state relying on it today, and why", () => {
    expect(entry).toContain("Alaska");
    expect(entry.toLowerCase()).toMatch(/only state|only row|one exception/);
    expect(entry).toMatch(/P610|fixture/);
  });

  test("it records that highest_point and landmark are pinned to one string", () => {
    expect(entry).toContain("landmark");
    expect(entry.toLowerCase()).toMatch(/pinned|one place|single edit|one edit/);
    expect(entry).toMatch(/Denali|McKinley/);
  });
});

// ---------------------------------------------------------------------------
// Criterion 7 — built, not hand-edited
// ---------------------------------------------------------------------------
//
// Covered in full by `committed-bank.test.ts` ("T-010 criteria 6 and 8"), which
// runs `rebuildOffline` twice and compares all 51 tracked paths byte for byte
// against the rebuild. Verified here by mutation rather than duplicated: an
// edit to a tracked file's `highest_point` that the build would not produce
// turns those 51 tests red (see the brief's Verdict). Criterion 12 (`bun test`
// and `bun run typecheck` green) is a property of the run, not of the tree.

// ---------------------------------------------------------------------------
// A guard against this file itself going quiet.
// ---------------------------------------------------------------------------

describe("T-016 tester — the pins above are not vacuous", () => {
  test("DEFAULT_BRANCH_DIGESTS covers all 51 tracked paths plus the sample", () => {
    const wanted = ["index.json", ...trackedStateFiles(), "sample-data/us-state-co.json"].sort();
    expect(Object.keys(DEFAULT_BRANCH_DIGESTS).sort()).toEqual(wanted);
  });

  test("every pinned digest is a distinct 64-hex SHA-256", () => {
    const values = Object.values(DEFAULT_BRANCH_DIGESTS);
    for (const value of values) expect(value).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(values).size).toBe(values.length);
  });

  test("CURATED_US_STATES still holds 50 states, so the loops above cover them all", () => {
    expect(CURATED_US_STATES).toHaveLength(50);
  });
});
