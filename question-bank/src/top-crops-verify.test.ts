import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";
import { rebuildOffline } from "./offline-rebuild";

/**
 * T-015 verification — written by the `tester` role from the 14 frozen
 * acceptance criteria in `tasks/T-015-us-crops-nass.md`, not from the
 * implementation and not from `top-crops.test.ts` (which the worker wrote
 * alongside the data). It overlaps that file deliberately on criteria 1–4 and
 * covers the ten criteria it does not reach at all: the curated table as the
 * source (5), the twice-over offline rebuild (6), the absent network and
 * environment surface (7, 8), the replaced stale assertions (9), the untouched
 * lockfile (10), the three documents (11), the frozen sample (12), the
 * "nothing else in the bank moved" digest check (13) and the two provenance
 * statements (14).
 *
 * Expected values come from the criterion text. Where a criterion is phrased
 * against "the default branch", that branch's bytes are pinned here as
 * SHA-256 digests computed once from `git show eda7fde:<path>` (`eda7fde` is
 * `origin/main` at the time of verification, and this branch's merge base), so
 * the checks hold in a shallow CI clone with no git history at all.
 *
 * No network: the only subprocesses are `git ls-files` (read-only, no remote)
 * and the build CLI run through `rebuildOffline`, which points all six proxy
 * spellings at a dead loopback port. Nothing mocks `fetch`; nothing writes
 * inside `question-bank/`.
 *
 * What no test here can settle is whether each crop is *true* of its state —
 * that is the brief's Review checklist, and only a person closes it.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");
const SAMPLE = join(PKG, "sample-data/us-state-co.json");
const BUILD_SCRIPT = join(PKG, "src/build.ts");

/** Criterion 13 names this instant: `built_at` is pinned to the fixture's capture. */
const PINNED_BUILT_AT = "2026-08-04T16:05:35.000Z";

/** Criterion 4's list, transcribed word for word from the criterion. */
const LIVESTOCK_WORDS = [
  "cattle",
  "beef",
  "dairy",
  "milk",
  "poultry",
  "chicken",
  "broiler",
  "turkey",
  "egg",
  "hog",
  "pig",
  "swine",
  "cow",
  "livestock",
] as const;

/**
 * Criteria 12 and 13: SHA-256 of each tracked path **as it stands on the
 * default branch** (`eda7fdeb5d44f726995f297e9583ea9c3fc3e0d0`), where every
 * state file carried the literal `"top_crops": [],`. Criterion 13 is then
 * testable without git history: take the file as it is now, put that literal
 * back textually, and the bytes must hash to the pinned value — any other
 * field moving, `built_at` included, turns it red.
 *
 * **`us-state-ak.json` re-pinned 2026-09-18.** Alaska's `landmark` (and the
 * `highest_point` this task already strips) changed from "Denali" to "Mount
 * McKinley" — Dkaattae's decision on PR #47, the same call T-013's reviewer
 * left open. This digest is recomputed with the new value.
 */
const DEFAULT_BRANCH_DIGESTS: Record<string, string> = {
  "index.json": "cd6822166faad67383db4d0506bcc1a833e142884e1792b03292795ce3e1e066",
  "us-state-ak.json": "8d4e6ac03298f52438e7cd9ad3301f6671891b77b060ae1d9cb438e633b2ac33",
  "us-state-al.json": "8cb7ced87ad6bfce10a266cca404123d717413b74b89178475a09caca027bb4a",
  "us-state-ar.json": "38c1e0c7dcd10daf78f0400fc7e808edc85785a7bb488e946d277b6d8bfac533",
  "us-state-az.json": "53b19aa64223a29b4152a73c5333284da4cbdb57be49deb0994e107450ee03cc",
  "us-state-ca.json": "8c9e5fa3e8cd5872c2009b32fd0fb9ec4c9692d96900f2d5041936ff93b8950d",
  "us-state-co.json": "88db1cb06c0bb0c494327703c50cb5afefdf48cc0bc878615ef4277cb28b338f",
  "us-state-ct.json": "aa83ecdee44696ebb37e45cdb3d7db38f1d5527b29e23740e5b1dc894af095e3",
  "us-state-de.json": "d26a2aabb6d7e72399d7331533e0419787ccecc0be6859214e2392a71ece52fb",
  "us-state-fl.json": "031b88b2d7ebe036ad96a6005db07b8539e73bd769e34adddcc01b007419e5eb",
  "us-state-ga.json": "f96c8ed8c25c642504692cd70e8d89afae6ad2a04cd6598fe5bd339e5ad8c145",
  "us-state-hi.json": "9b14068bb8b2da6ca0db711b2a157f529ad0009dc87c54b92439151bb4092684",
  "us-state-ia.json": "ef5d4844dc9bbb7ea2d19b479f175a179584111edf495467c69ba022756f2f3c",
  "us-state-id.json": "628cd4313b7681abb2ac33dfe9a887876918c1a0c4154452989afbad62eac8cd",
  "us-state-il.json": "af8544013b831bc01d640fd843657771c5dbc7bd65a068cb78c4a404a5e686c7",
  "us-state-in.json": "d1fecd007debfa7d76084beaef524c052b25bfb4c89d046ca4a4007db342146a",
  "us-state-ks.json": "3b8ce8eda9c4b8e490e343f6284f2531eb3cbb9592a4e397600e6439280a4e44",
  "us-state-ky.json": "e101240dcdad75d55a6365788752fef0f690393a9ed6aea40df3e48b8547d8af",
  "us-state-la.json": "d091960973b8d2b9401c0d340f5f719a403c3691860eb576007cb2596bff073d",
  "us-state-ma.json": "58926c964f5f989bd4a504df55e90f2dd37ad3a5c57cd0646a84921a2ed31ea6",
  "us-state-md.json": "e8aa7f5479fb6308469c6b12225953865673646019fbe36ef041bfa9b7b84ab5",
  "us-state-me.json": "44394c4e4c7c9d2168ee7e03fa16d165716b24a5675b74f8b3a40d9aa8d70524",
  "us-state-mi.json": "ecc2df44f6ccaa131303e9383f271078022a330176f3411202033bd8382a4c32",
  "us-state-mn.json": "771abcd8ebc84123b0ab5e97280b2b60c85ded50c17be91c2564b3c7620a2b2e",
  "us-state-mo.json": "4158f907946fbe4fc3f496ac5b6acbea6798f685dbe10c5a5e3ced2d0dc98674",
  "us-state-ms.json": "9313593c012e9a272b26284be6a2e37349a3b3ab45c03ddb5651926f030a2542",
  "us-state-mt.json": "916d21d6968786cfb241aced5e99db23fb1c6d36ca744d0516e267fecc41e805",
  "us-state-nc.json": "06e50ed8d7e6a5d5a8cb31be319c3a56ec6877dbbd3b4385a775792e36baff7b",
  "us-state-nd.json": "036b8e02bfd58c34383166088101fad14aa1fd33a20a45a4f543cefe8784324a",
  "us-state-ne.json": "00eda14317978584c8457cb3116785bd128461be53a662ba882b50a8449b5916",
  "us-state-nh.json": "5a8c21fb14f7f41d6f053f058380c652c05cdee1cd4f0f92d35cc95e705e91f7",
  "us-state-nj.json": "69750185c4eab7b6bbe9da01ba9613f9608debae92da921c36e2df44c320c2a0",
  "us-state-nm.json": "2def65b72040fee5b128b74e9cefb45ab71c75863a274a6ecd3e546eda06fd5d",
  "us-state-nv.json": "8d6b801d8e643cb9821b496dba37d834d6ad7d1861a9549cf8ad99bb5c87a2c7",
  "us-state-ny.json": "a6fe84795b9da35fd386cb47093e4dad82ffd7da6e34d50d3e234a0fc5f7c812",
  "us-state-oh.json": "eb8ebfff125e9c0f19787ff1fb9f2ee857f8852f82b4e14f1870788d233d3100",
  "us-state-ok.json": "5ceeeecdb93f69e5338e7e31733907b583ebf7e1a8be3840ad406f4e38999ba8",
  "us-state-or.json": "6463baffbbd722ac6501f0c338b9f8f4c8e16d13399384a140854673dbb256f0",
  "us-state-pa.json": "df0485102694f4675f9445c979ef1c7da86adda6519ccf04f982ce3236f29eb0",
  "us-state-ri.json": "3263c891f5267809fb0f988e2c95cc53d4b4177c05e0de1e40f039dfa906c017",
  "us-state-sc.json": "bec2013eb18738656211216cb53514d72567a8283f79a4bd02e2268dcf992a60",
  "us-state-sd.json": "5ad612aee50f2297c0e64e418b43017dc39d74d71e876ed69cfdcc21934cdaa3",
  "us-state-tn.json": "747352fa7fd030165249f7c50d47ab81d8d37ee52943306bcbcf06e954619447",
  "us-state-tx.json": "321b4c269e3a112d28e2dd925a2bba310080ac7adf21519202223da93856701d",
  "us-state-ut.json": "f66a39622e6b006ce20bf4c7b31a5d3cb5468cebccf80e4dce03bf97ebedf014",
  "us-state-va.json": "6bbce553dd4121266f20a2dd58f37ad6e4366c7145a5a9d2835918a04d3aa6f2",
  "us-state-vt.json": "4ee12cc5664cfe4eb834f186b4927233e166d736fcae2986a5ed66a153d356dc",
  "us-state-wa.json": "0f7bcaa4b2baf3399a96775e86d3f00b01fe00023403c8fdfa36ff405fc40c0e",
  "us-state-wi.json": "fe5bd462f7e471e1a9b9a2b27f20c26fa859bf44f85a9ee6880462dc58526aa4",
  "us-state-wv.json": "a3ee05e4c7356d0fc610849636f492c249835f4bb7ae2c5d97f3755b778bcf30",
  "us-state-wy.json": "902feb5d1f10db7e92141b1ff12ad706d3806d74e072aa28e79dcf9e3f43aee8",
};

/** Criterion 10: the two dependency files, on the same default-branch commit. */
const DEPENDENCY_DIGESTS: Record<string, string> = {
  "question-bank/package.json":
    "533ab267bea404a6937a8ada1fe46668a0d4062c26b7bfeed1602ae9428bb6fd",
  "question-bank/bun.lock": "d19f5717f5df989a3c9f5c97f59e8907625aa1d497c66b29c098d403977888f1",
};

const digest = (text: string) => createHash("sha256").update(text).digest("hex");

function git(args: string[]): string {
  const proc = Bun.spawnSync(["git", ...args], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(`git ${args.join(" ")} exited ${proc.exitCode}`);
  return proc.stdout.toString();
}

/** Criterion 1 names this glob literally. Throws rather than yielding an empty list. */
function trackedStateFileNames(): string[] {
  const names = git(["ls-files", "question-bank/data/us-states/us-state-??.json"])
    .split("\n")
    .filter(Boolean)
    .map((p) => p.split("/").pop() as string)
    .sort();
  if (names.length !== 50) throw new Error(`expected 50 tracked state files, found ${names.length}`);
  return names;
}

function trackedUnder(prefix: string): string[] {
  return git(["ls-files", prefix]).split("\n").filter(Boolean).sort();
}

interface StateEntity {
  id: string;
  top_crops?: unknown;
  sources?: { built_at?: string };
}

const postalOf = (file: string) => file.slice("us-state-".length, -".json".length).toUpperCase();

function trackedStates(): { file: string; postal: string; raw: string; entity: StateEntity }[] {
  return trackedStateFileNames().map((file) => {
    const raw = readFileSync(join(DATA_DIR, file), "utf8");
    return { file, postal: postalOf(file), raw, entity: JSON.parse(raw) as StateEntity };
  });
}

/** The tracked `top_crops` as a plain array, with the type assertion done once. */
function cropsOf(entity: StateEntity): string[] {
  expect(Array.isArray(entity.top_crops)).toBe(true);
  return entity.top_crops as string[];
}

const curatedByPostal = new Map(CURATED_US_STATES.map((s) => [s.postal, s] as const));

/** Every shipped string, from both places criterion 4 names, tagged with its origin. */
function allCropStrings(): { where: string; value: string }[] {
  const out: { where: string; value: string }[] = [];
  for (const state of CURATED_US_STATES) {
    for (const crop of state.top_crops ?? []) out.push({ where: `curated:${state.postal}`, value: crop });
  }
  for (const { file, entity } of trackedStates()) {
    for (const crop of cropsOf(entity)) out.push({ where: file, value: crop });
  }
  return out;
}

/**
 * The `"top_crops": [...]` block as the sink emits it (`JSON.stringify(_, 2)`),
 * put back to the literal `[]` the default branch carried. Textual rather than
 * parse-and-restringify so the comparison stays byte-for-byte on every other
 * line of the file.
 */
const TOP_CROPS_BLOCK = /^ {2}"top_crops": \[\n(?: {4}[^\n]*\n)* {2}\],$/m;
const withEmptyTopCrops = (raw: string) => raw.replace(TOP_CROPS_BLOCK, '  "top_crops": [],');

/**
 * T-016 (2026-09-18, a later approved task) adds a `highest_point` line to
 * Alaska only — the other 49 states already carried the field at this
 * suite's own baseline (`eda7fde`), so their pinned digests already include
 * it. Alaska's did not, so its new line alone is removed textually before
 * hashing, the same asymmetric shape `landmarks-verify.test.ts` and
 * `climate-kid-verify.test.ts` use for the same field.
 */
const ALASKA_HIGHEST_POINT_LINE = /^ {2}"highest_point": "[^"]*",\n/m;
const withoutAlaskaHighestPoint = (file: string, raw: string) =>
  file === "us-state-ak.json" ? raw.replace(ALASKA_HIGHEST_POINT_LINE, "") : raw;

describe("T-015 tester, criterion 1 — one to three non-blank crops in every tracked file", () => {
  test("git ls-files matches exactly 50 state files, and readdirSync finds no stray extra", () => {
    const tracked = trackedStateFileNames();
    expect(tracked).toHaveLength(50);
    const onDisk = readdirSync(DATA_DIR)
      .filter((f) => /^us-state-[a-z]{2}\.json$/.test(f))
      .sort();
    expect(onDisk).toEqual(tracked);
  });

  test("each file's top_crops is an array whose length is 1, 2 or 3 — never 0, never 4 or more", () => {
    const lengths: Record<string, number> = {};
    for (const { file, entity } of trackedStates()) lengths[file] = cropsOf(entity).length;
    const outOfRange = Object.entries(lengths).filter(([, n]) => n < 1 || n > 3);
    expect(outOfRange).toEqual([]);
    // The boundary the criterion names, stated as a count so a regression reads
    // as a number rather than as a missing file: 50 files, all inside 1..3.
    expect(Object.values(lengths).filter((n) => n >= 1 && n <= 3)).toHaveLength(50);
  });

  test("no crop string is empty or whitespace-only after trimming", () => {
    const blank = allCropStrings().filter(({ value }) => value.trim().length === 0);
    expect(blank).toEqual([]);
  });

  test("the observed length distribution accounts for all 50 files", () => {
    const byLength = new Map<number, string[]>();
    for (const { file, entity } of trackedStates()) {
      const n = cropsOf(entity).length;
      byLength.set(n, [...(byLength.get(n) ?? []), file]);
    }
    const total = [...byLength.values()].reduce((sum, files) => sum + files.length, 0);
    expect(total).toBe(50);
    expect([...byLength.keys()].sort()).toEqual([...byLength.keys()].filter((n) => n >= 1 && n <= 3).sort());
  });
});

describe("T-015 tester, criterion 2 — register", () => {
  test("every shipped string is trimmed", () => {
    expect(allCropStrings().filter(({ value }) => value !== value.trim())).toEqual([]);
  });

  test("no shipped string matches /[A-Z]{2,}/ — no shouted machine label", () => {
    expect(allCropStrings().filter(({ value }) => /[A-Z]{2,}/.test(value))).toEqual([]);
  });

  test("no shipped string contains a comma", () => {
    expect(allCropStrings().filter(({ value }) => value.includes(","))).toEqual([]);
  });

  test('no shipped string contains " - "', () => {
    expect(allCropStrings().filter(({ value }) => value.includes(" - "))).toEqual([]);
  });

  test("the register checks run over every string in both places, not an empty list", () => {
    const strings = allCropStrings();
    expect(strings.filter((s) => s.where.startsWith("curated:")).length).toBeGreaterThanOrEqual(50);
    expect(strings.filter((s) => !s.where.startsWith("curated:")).length).toBeGreaterThanOrEqual(50);
  });
});

describe("T-015 tester, criterion 3 — distinct within a state, case-insensitively", () => {
  test("no tracked file lists the same crop twice", () => {
    const repeats: { file: string; crops: string[] }[] = [];
    for (const { file, entity } of trackedStates()) {
      const keys = cropsOf(entity).map((c) => c.trim().toLowerCase());
      if (new Set(keys).size !== keys.length) repeats.push({ file, crops: cropsOf(entity) });
    }
    expect(repeats).toEqual([]);
  });

  test("no curated entry lists the same crop twice", () => {
    const repeats: { postal: string; crops: string[] }[] = [];
    for (const state of CURATED_US_STATES) {
      const crops = state.top_crops ?? [];
      const keys = crops.map((c) => c.trim().toLowerCase());
      if (new Set(keys).size !== keys.length) repeats.push({ postal: state.postal, crops });
    }
    expect(repeats).toEqual([]);
  });

  test("a three-entry state really has three different crops", () => {
    const threes = trackedStates().filter(({ entity }) => cropsOf(entity).length === 3);
    expect(threes.length).toBeGreaterThan(0);
    for (const { file, entity } of threes) {
      const keys = cropsOf(entity).map((c) => c.trim().toLowerCase());
      expect({ file, distinct: new Set(keys).size }).toEqual({ file, distinct: 3 });
    }
  });
});

describe("T-015 tester, criterion 4 — plant crops only, no livestock word anywhere", () => {
  test("no string in the 50 tracked files contains a livestock word", () => {
    const hits: { file: string; value: string; word: string }[] = [];
    for (const { file, entity } of trackedStates()) {
      for (const value of cropsOf(entity)) {
        for (const word of LIVESTOCK_WORDS) {
          if (value.toLowerCase().includes(word)) hits.push({ file, value, word });
        }
      }
    }
    expect(hits).toEqual([]);
  });

  test("no string in CURATED_US_STATES contains a livestock word", () => {
    const hits: { postal: string; value: string; word: string }[] = [];
    for (const state of CURATED_US_STATES) {
      for (const value of state.top_crops ?? []) {
        for (const word of LIVESTOCK_WORDS) {
          if (value.toLowerCase().includes(word)) hits.push({ postal: state.postal, value, word });
        }
      }
    }
    expect(hits).toEqual([]);
  });

  test("the banned-word list is the 14 words the criterion names", () => {
    expect([...LIVESTOCK_WORDS]).toHaveLength(14);
    expect(LIVESTOCK_WORDS.some((w) => "cattle beef dairy".includes(w))).toBe(true);
  });
});

describe("T-015 tester, criterion 5 — the curated table is the source", () => {
  test("all 50 curated entries carry top_crops", () => {
    expect(CURATED_US_STATES).toHaveLength(50);
    const missing = CURATED_US_STATES.filter((s) => s.top_crops === undefined).map((s) => s.postal);
    expect(missing).toEqual([]);
  });

  test("each tracked file's array equals its curated entry's — same strings, same order", () => {
    for (const { file, postal, entity } of trackedStates()) {
      const curated = curatedByPostal.get(postal);
      expect({ file, hasCuratedEntry: curated !== undefined }).toEqual({ file, hasCuratedEntry: true });
      expect({ file, crops: cropsOf(entity) }).toEqual({
        file,
        crops: curated?.top_crops as string[],
      });
    }
  });

  test("order matters: a reversed curated list would not match the tracked file", () => {
    // Guards the equality above from being a set comparison in disguise.
    const multi = trackedStates().filter(({ entity }) => cropsOf(entity).length > 1);
    expect(multi.length).toBeGreaterThan(0);
    for (const { file, postal, entity } of multi) {
      const reversed = [...(curatedByPostal.get(postal)?.top_crops ?? [])].reverse();
      expect({ file, equalsReversed: JSON.stringify(cropsOf(entity)) === JSON.stringify(reversed) }).toEqual(
        { file, equalsReversed: false },
      );
    }
  });
});

describe("T-015 tester, criterion 6 — two offline rebuilds agree with each other and with the bank", () => {
  const names = () => trackedStateFileNames();

  test("top_crops survives two consecutive offline rebuilds byte-identically", () => {
    const first = rebuildOffline(BUILD_SCRIPT, names(), "t015-verify-a-");
    const second = rebuildOffline(BUILD_SCRIPT, names(), "t015-verify-b-");
    const block = (raw: string) => raw.match(TOP_CROPS_BLOCK)?.[0] ?? raw.match(/^ {2}"top_crops": .*$/m)?.[0];
    for (const file of names()) {
      const a = first.get(file) as string;
      const b = second.get(file) as string;
      const tracked = readFileSync(join(DATA_DIR, file), "utf8");
      expect({ file, block: block(a) }).toEqual({ file, block: block(b) });
      expect({ file, block: block(a) }).toEqual({ file, block: block(tracked) });
      // And the value itself, parsed, in case the emitted formatting ever changes.
      const crops = (raw: string) => (JSON.parse(raw) as StateEntity).top_crops;
      expect({ file, crops: crops(a) }).toEqual({ file, crops: crops(tracked) });
      expect({ file, crops: crops(b) }).toEqual({ file, crops: crops(tracked) });
    }
  }, 120_000);
});

describe("T-015 tester, criterion 7 — no new network or environment surface", () => {
  const nonTestSources = () =>
    trackedUnder("question-bank/src").filter((p) => p.endsWith(".ts") && !p.endsWith(".test.ts"));

  /** Comments are where the *rejected* NASS route is allowed to be named. Code is not. */
  const stripComments = (source: string) =>
    source.replace(/\/\*[^]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  test("no NASS-named variable is referenced anywhere under question-bank/src/", () => {
    const offenders = nonTestSources().filter((p) =>
      /nass/i.test(stripComments(readFileSync(join(REPO, p), "utf8"))),
    );
    expect(offenders).toEqual([]);
  });

  test("the build's outbound hosts are still only Wikidata and Wikipedia", () => {
    const hosts = new Set<string>();
    for (const path of nonTestSources()) {
      const source = readFileSync(join(REPO, path), "utf8");
      for (const match of source.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)) hosts.add(match[1] as string);
    }
    // `github.com` is the contact URL inside the User-Agent string
    // (`sparql.ts`), never a request target; `www.wikidata.org` is the entity
    // URI prefix. Pinned as a whole set so a genuinely new host — a NASS
    // endpoint, say — turns this red.
    const outbound = [...hosts].filter((h) => h !== "127.0.0.1" && !h.endsWith("example.org"));
    expect(outbound.sort()).toEqual([
      "en.wikipedia.org",
      "github.com",
      "query.wikidata.org",
      "www.wikidata.org",
    ]);
  });

  test("no new file was added under question-bank/src/fixtures/", () => {
    expect(trackedUnder("question-bank/src/fixtures")).toEqual([
      "question-bank/src/fixtures/us-states.sparql.json",
    ]);
  });
});

describe("T-015 tester, criterion 8 — no test reaches the network", () => {
  test("exactly one file under question-bank/src/ carries the dead-loopback literal", () => {
    // Assembled from parts so this suite is not itself a match for what it counts.
    const needle = ["127", "0", "0", "1"].join(".") + ":1";
    const own = "question-bank/src/top-crops-verify.test.ts";
    const files = trackedUnder("question-bank/src").filter(
      (p) => !p.endsWith(".json") && p !== "question-bank/src/climate-kid.test.ts" && p !== own,
    );
    const withProxy = files.filter((p) => readFileSync(join(REPO, p), "utf8").includes(needle));
    expect(withProxy).toEqual(["question-bank/src/offline-rebuild.ts"]);
  });

  test("no *.test.ts under question-bank/src/ spawns src/build.ts itself", () => {
    const tests = trackedUnder("question-bank/src").filter((p) => p.endsWith(".test.ts"));
    expect(tests.length).toBeGreaterThan(0);
    for (const path of tests) {
      const source = readFileSync(join(REPO, path), "utf8");
      expect({
        path,
        spawnsBuild: /spawnSync\(\s*\[\s*["']bun["'][^]*?build\.ts/.test(source),
      }).toEqual({ path, spawnsBuild: false });
    }
  });

  test("this suite obtains its rebuild from offline-rebuild.ts rather than re-creating it", () => {
    const own = readFileSync(join(PKG, "src/top-crops-verify.test.ts"), "utf8");
    expect(/from ["']\.\/offline-rebuild["']/.test(own)).toBe(true);
    expect(/HTTP_PROXY:\s*["']http:\/\//.test(own)).toBe(false);
  });
});

describe("T-015 tester, criterion 9 — the stale assertions are replaced, not deleted", () => {
  const suites = () => trackedUnder("question-bank/src").filter((p) => p.endsWith(".test.ts"));

  test("no suite asserts that a tracked file's top_crops is an empty array", () => {
    // The shape the four replaced assertions had: comparing the tracked value
    // against a literal `[]`, with the tracked file as the subject.
    const offenders: { path: string; line: string }[] = [];
    for (const path of suites()) {
      const lines = readFileSync(join(REPO, path), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (/topCrops:\s*\[\s*\]/.test(line) && !/parsed\[|restore|baseline/i.test(lines[i - 1] ?? "")) {
          offenders.push({ path, line: line.trim() });
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  test("each of the four named suites now asserts a populated top_crops invariant", () => {
    for (const path of [
      "question-bank/src/climate-kid.test.ts",
      "question-bank/src/climate-kid-verify.test.ts",
      "question-bank/src/landmarks.test.ts",
      "question-bank/src/state-animals.test.ts",
    ]) {
      const source = readFileSync(join(REPO, path), "utf8");
      expect({ path, mentionsCurated: source.includes("CURATED_US_STATES") }).toEqual({
        path,
        mentionsCurated: true,
      });
      expect({ path, asserts: /top_crops is populated/.test(source) }).toEqual({ path, asserts: true });
    }
  });
});

describe("T-015 tester, criterion 10 — no new dependency", () => {
  test("package.json and bun.lock are byte-identical to the default branch", () => {
    for (const [path, expected] of Object.entries(DEPENDENCY_DIGESTS)) {
      expect({ path, digest: digest(readFileSync(join(REPO, path), "utf8")) }).toEqual({
        path,
        digest: expected,
      });
    }
  });
});

describe("T-015 tester, criterion 11 — the docs no longer say the field is empty", () => {
  const readDoc = (path: string) => readFileSync(join(REPO, path), "utf8");

  test("sample-data/README.md no longer says top_crops needs USDA NASS", () => {
    const text = readDoc("question-bank/sample-data/README.md");
    expect(/top_crops[^\n]*needs USDA NASS/i.test(text)).toBe(false);
    expect(/curated/i.test(text)).toBe(true);
  });

  test("normalize.ts's top_crops comment no longer defers to USDA NASS", () => {
    const source = readDoc("question-bank/src/normalize.ts");
    // No NASS anywhere in the module, and the emitted value reads the curated
    // table rather than a literal (criterion 5's fold-in, checked from here
    // because criterion 11 is about what the comment beside it claims).
    expect(/NASS/i.test(source)).toBe(false);
    expect(source).toContain("top_crops: curated.top_crops ?? []");
    const upTo = source.indexOf("top_crops: curated");
    const commentAbove = source.slice(source.lastIndexOf("//", upTo) - 400, upTo);
    expect(/curated/i.test(commentAbove)).toBe(true);
  });

  test("PROGRESS.md no longer describes top_crops as empty or awaiting NASS", () => {
    const text = readDoc("PROGRESS.md");
    expect(/`top_crops` is empty/.test(text)).toBe(false);
    expect(/`top_crops` is \*\*50 of 50\*\*/.test(text)).toBe(true);
  });
});

describe("T-015 tester, criterion 12 — the committed sample is untouched", () => {
  test("sample-data/us-state-co.json is byte-identical to the default branch", () => {
    expect(digest(readFileSync(SAMPLE, "utf8"))).toBe(
      DEFAULT_BRANCH_DIGESTS["us-state-co.json"] as string,
    );
  });

  test("the sample's own top_crops is still []", () => {
    const sample = JSON.parse(readFileSync(SAMPLE, "utf8")) as StateEntity;
    expect(sample.top_crops).toEqual([]);
  });

  test("sample-data/README.md says the sample is an older snapshot with empty top_crops while the bank is curated", () => {
    const text = readFileSync(join(PKG, "sample-data/README.md"), "utf8");
    expect(/older snapshot/i.test(text)).toBe(true);
    expect(/top_crops/.test(text)).toBe(true);
    expect(/data\/us-states/.test(text)).toBe(true);
  });
});

describe("T-015 tester, criterion 13 — nothing else in the bank moves", () => {
  test("each of the 50 files, with top_crops put back to [] and Alaska's highest_point line stripped, digests to the default branch's bytes", () => {
    for (const { file, raw } of trackedStates()) {
      expect({ file, digest: digest(withoutAlaskaHighestPoint(file, withEmptyTopCrops(raw))) }).toEqual({
        file,
        digest: DEFAULT_BRANCH_DIGESTS[file] as string,
      });
    }
  });

  test("the restoration actually removes the crops — otherwise the digest check proves nothing", () => {
    const ca = readFileSync(join(DATA_DIR, "us-state-ca.json"), "utf8");
    expect(ca).not.toBe(withEmptyTopCrops(ca));
    expect(withEmptyTopCrops(ca)).toContain('"top_crops": [],');
    expect(withEmptyTopCrops(ca)).not.toContain('"grapes"');
  });

  test("the Alaska neutralisation actually removes the highest_point line — otherwise the digest check proves nothing (T-016 criterion 11)", () => {
    const ak = readFileSync(join(DATA_DIR, "us-state-ak.json"), "utf8");
    const neutralised = withoutAlaskaHighestPoint("us-state-ak.json", ak);
    expect(neutralised).not.toBe(ak);
    expect(ak).toContain('"highest_point": "Mount McKinley"');
    expect(neutralised).not.toContain('"highest_point"');
  });

  test("index.json is byte-identical to the default branch", () => {
    expect(digest(readFileSync(join(DATA_DIR, "index.json"), "utf8"))).toBe(
      DEFAULT_BRANCH_DIGESTS["index.json"] as string,
    );
  });

  test("built_at has not moved in any of the 50 files", () => {
    for (const { file, entity } of trackedStates()) {
      expect({ file, builtAt: entity.sources?.built_at }).toEqual({
        file,
        builtAt: PINNED_BUILT_AT,
      });
    }
  });

  test("index.json and the per-state files still agree on ids and count", () => {
    const index = JSON.parse(readFileSync(join(DATA_DIR, "index.json"), "utf8")) as {
      count: number;
      entities: { id: string }[];
    };
    expect(index.count).toBe(50);
    expect(index.entities.map((e) => e.id).sort()).toEqual(
      trackedStates()
        .map(({ entity }) => entity.id)
        .sort(),
    );
  });
});

describe("T-015 tester, criterion 14 — provenance recorded in two places", () => {
  /** Both documents hard-wrap, so phrases are matched against unwrapped text. */
  const unwrap = (text: string) => text.replace(/\s+/g, " ");
  /**
   * The criterion says "the header comment", so this is the file's leading
   * block comment alone — not the whole preamble, which would let the doc
   * comment on the field itself satisfy a claim the header never makes.
   */
  const header = () => {
    const source = readFileSync(join(PKG, "src/curated/us-states.ts"), "utf8");
    const end = source.indexOf("*/");
    expect(source.startsWith("/**")).toBe(true);
    expect(end).toBeGreaterThan(0);
    return unwrap(source.slice(0, end + 2));
  };
  const e7 = () => {
    const text = readFileSync(join(REPO, "engineering-decisions.md"), "utf8");
    const start = text.indexOf("## E-7");
    expect(start).toBeGreaterThan(-1);
    return unwrap(text.slice(start));
  };

  for (const [label, read] of [
    ["curated/us-states.ts header", header],
    ["engineering-decisions.md E-7", e7],
  ] as const) {
    test(`${label} says the values are hand-picked by a human, not from a live source`, () => {
      const text = read();
      expect({ label, handPicked: /hand-(picked|curated)/i.test(text) }).toEqual({ label, handPicked: true });
      expect({ label, notNass: /not[^.]{0,60}(USDA NASS|NASS-derived)/i.test(text) }).toEqual({
        label,
        notNass: true,
      });
    });

    test(`${label} says production quantity was the informal guide, with no year pinned`, () => {
      const text = read();
      // Tied to the "guided by" clause, not just any mention of the phrase —
      // E-7 also discusses production quantity when explaining why NASS's own
      // ranking measure is ambiguous, and that sentence is not this claim.
      expect({ label, quantity: /guided[^.]{0,80}production quantity/i.test(text) }).toEqual({
        label,
        quantity: true,
      });
      expect({ label, noYear: /year/i.test(text) }).toEqual({ label, noYear: true });
    });

    test(`${label} says plant crops only, livestock tracked by T-068`, () => {
      const text = read();
      expect({ label, plantOnly: /plant crops only|plant\b/i.test(text) }).toEqual({ label, plantOnly: true });
      expect({ label, t068: text.includes("T-068") }).toEqual({ label, t068: true });
    });

    test(`${label} says the curated strings are themselves the reviewed kid-facing text`, () => {
      const text = read();
      expect({ label, reviewed: /reviewed/i.test(text) }).toEqual({ label, reviewed: true });
      expect({ label, contentRules: /CLAUDE\.md/.test(text) }).toEqual({ label, contentRules: true });
    });
  }

  test("E-7 is a new numbered entry, not a rewrite of an earlier one", () => {
    const text = readFileSync(join(REPO, "engineering-decisions.md"), "utf8");
    const headings = [...text.matchAll(/^## (E-\d+)/gm)].map((m) => m[1]);
    expect(headings).toContain("E-7");
    expect(new Set(headings).size).toBe(headings.length);
  });
});
