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
  "us-state-ak.json": "0ed4d5975b3dcfdfb099853c3975e04292e6ddc2c9e916bd7f4d0cd54f604e40",
  "us-state-al.json": "07b0593819dd12a4c0dbce3a6a17ad106b8af90a03a950c2c89fda8dd2b62aed",
  "us-state-ar.json": "bfbeb6e735c1badf0566145671d3e7936734a48259240a5cd44646466c7a4e3a",
  "us-state-az.json": "dcd39c02d7cfe18110a8fbbd11c86979ef2c05f7b22387a89cc2bd929382dfc3",
  "us-state-ca.json": "df04d66849846fbeab41f403557a9592f0b0892df158496b548071ed0efe6201",
  "us-state-co.json": "7946bf850ca87d55a3db6ecb3f8d7bcc60d3a49f7ce7e0c10367c28950dd452f",
  "us-state-ct.json": "20a603d14f99a528b3818afae8f624be1d0025d75b2770008d3953ec7f20c80d",
  "us-state-de.json": "c62ae57f380807270b6cce6ef16b583c32b3e66f834e5d29c4e36b8ab61f83b6",
  "us-state-fl.json": "d098ea73401385a19a17e905a654a9e2157d3703f129542e7f77d7c62fe4e7e6",
  "us-state-ga.json": "e75c5242ca326d10306525fefd7c4933a5ecdc2722120037c2c9a5ad4cd49671",
  "us-state-hi.json": "8888ec328f7db7c092f478a48910e298a157d0e9d545820aa4e4bc600d0ed37e",
  "us-state-ia.json": "71d060bbaeb82ac94671305869dd06b9011b09724dad6e168563f64e5ea17b56",
  "us-state-id.json": "eea5a472db7af29bb50f510eb51554de1b4fb1257031a3ef11115129adfb37f2",
  "us-state-il.json": "d4c9ad2429623d2d30786cb701b5c4a97c2d2670eb81d339dd796ee2d1642568",
  "us-state-in.json": "b5e883be5b362235aea0c946a0863bed201f9b7d035d0374a1894077defea620",
  "us-state-ks.json": "ec6d9fd2a71e6f099ed8fb532b7649cead00f208955671b81b55f2c654d524b2",
  "us-state-ky.json": "51b5e8a0c2e9ede77f1823ad3716947878f8311859dcef2f082f73c90d278ecf",
  "us-state-la.json": "968d26711bfb31a4df98586da8b765b166916f727ccdce19b6a957226cfccbfe",
  "us-state-ma.json": "19df3576b23771629bd8947042016e5c303bffc090a6d868db400c49ffc59606",
  "us-state-md.json": "ae3968ba4bef0ddc27202178c903713d8c9b81f28eaee084625572a1ba770509",
  "us-state-me.json": "d0294db44c9c2c4928fbccdeabb69a36d697f1509c825e372b113c7ef435febd",
  "us-state-mi.json": "04399f87d88a1e0687b3b23bd311774f5223a118d033ffccfabd144f5e2d5541",
  "us-state-mn.json": "aad6c2346c6f0577359f9451841b006a2c0a28dbbac9688426a2fea7b39d172a",
  "us-state-mo.json": "5729334df98508d453f1b41e584eeee5e45834bcfdc8841c7f877147422885d8",
  "us-state-ms.json": "e932fa50cb560fe33d758dc0f11aa5d36747515ede86ef2196d00bcb35088275",
  "us-state-mt.json": "0af2e96d0f1bcdb29b246fcff270ae168294a6ec4ee0ddb1ef6ba5f8f0b27726",
  "us-state-nc.json": "26f5d88c0d6d4eeca9617f41054c283486589ed7e2e0d7756dbb60e7f770701e",
  "us-state-nd.json": "9efb948a7108ecf41e26bbfa517e9e4d013370bc34d89ea82b9da9fb351bc6c6",
  "us-state-ne.json": "8ef2da6d5200ca7e4a017cf080204c151a53abfdccc60a487437ed3e4da99d64",
  "us-state-nh.json": "ebe97710f086c6b85011d9d7509699c3df30ed6d57d397cbff76f646e4a36cb6",
  "us-state-nj.json": "612034fc4f2753d124e608e64688f4eb5198bc8010ed6f8da2e602bfcd99a85f",
  "us-state-nm.json": "7ec5775a5f5e327e2e423f2290a16514771a7dd5fbec8ea0aed31e79f1247146",
  "us-state-nv.json": "16fe16a0fd4826dc18918ac994d87ff81fc3d52cb4e7c10f9108efb8b0d0094f",
  "us-state-ny.json": "b92d7495fffb0b544d0b7c743344e110d1f94d18d27f5239849a8fc8de1ef4d7",
  "us-state-oh.json": "047c748df45896bd1f278594a7563e0112c8a869cf00a1e81094823c256e5271",
  "us-state-ok.json": "93c091ec2921931e6e8c9bf76abfae8a714dc12b2af6c000e50ecca408857bae",
  "us-state-or.json": "fc52d9730d113492f91065482f32282a9aca517059e7aa8e89294e3fc9c5e5e6",
  "us-state-pa.json": "2012dbf94997633f39218e4309869595cdf78996ef29432010c4870a5b7aa71e",
  "us-state-ri.json": "bd5b1706d0f81c1cb830e3c0d7051182ffdc6fa69180fb8e086b6b8f79e1da83",
  "us-state-sc.json": "84fde80fcaef23437d11ea0674ed10184f449df12354ee75a76a75d259f8ad4c",
  "us-state-sd.json": "a7ac0ff55cdec517f5fb09f3c8552f4cc4829eab39875af25dbfe9372ee52fb7",
  "us-state-tn.json": "35cfe9347dd7f41dd5c70f6e85bc0ece4eed56c8e8025719f0e5bb0a95bd30e4",
  "us-state-tx.json": "1d7235e54a2d368c45dcffb399286e1cbf19c52f9e7ca0d39f9af9bd38ba4617",
  "us-state-ut.json": "7f288a00406b7cd33e722c4adf9887dcf9258d955abb9ddb93aca402ace91e83",
  "us-state-va.json": "87c3a0c3a02face51f872595983e79b9f23b2939edf610ba8a023be150fda969",
  "us-state-vt.json": "5ac40b4a07dff0b9775fd07349a16af93102fc52b555b49961682b9dd996b532",
  "us-state-wa.json": "4522415e14cb10c9f01b915127449720f36882b17e4a895d198b6c1eb91cdf9f",
  "us-state-wi.json": "a3606b8b65f07c242238787f1c7ce8238771cd395a75cd422becd5b52c9d8306",
  "us-state-wv.json": "a1cdd5166239b704223c7a87217a500855d0edb083c383b95d74061d39c3151c",
  "us-state-wy.json": "e56f1b303199dda19ae2bf6c747e233a004407c34141a961a62238a348376866",
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

/**
 * T-017 (2026-09-18, a later approved task) resettles the `region` vocabulary
 * for all 50 states — the largest change any of these digest guards has
 * absorbed (the brief's own Constraints say so), since most of the eight-region
 * set needed splitting into the finer thirteen-region one. Unlike `top_crops`
 * (reset to a shared `[]`) or Alaska's `highest_point` (absent before, so
 * simply removed), `region` was present with a real value for every state both
 * before and after, and there is no single baseline value to restore it to — so
 * the line is dropped entirely, for all 50 files, the same asymmetry-free shape
 * a field with no common fallback needs.
 */
const REGION_LINE = /^ {2}"region": "[^"]*",\n/m;
const withoutRegion = (raw: string) => raw.replace(REGION_LINE, "");

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

/**
 * T-017 (2026-09-18): `DEFAULT_BRANCH_DIGESTS["us-state-co.json"]` above is now
 * pinned with `region` stripped, for the *tracked* file's criterion-13 check.
 * The sample below is a different, untouched file — its own region
 * ("Mountain West", which T-017 does not change for Colorado, an anchor state)
 * is never removed, so it needs its own un-neutralised baseline rather than
 * reusing that key.
 */
const SAMPLE_DIGEST = "88db1cb06c0bb0c494327703c50cb5afefdf48cc0bc878615ef4277cb28b338f";

describe("T-015 tester, criterion 12 — the committed sample is untouched", () => {
  test("sample-data/us-state-co.json is byte-identical to the default branch", () => {
    expect(digest(readFileSync(SAMPLE, "utf8"))).toBe(SAMPLE_DIGEST);
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
  test("each of the 50 files, with top_crops put back to [], Alaska's highest_point line stripped and region removed, digests to the default branch's bytes", () => {
    for (const { file, raw } of trackedStates()) {
      expect({
        file,
        digest: digest(withoutRegion(withoutAlaskaHighestPoint(file, withEmptyTopCrops(raw)))),
      }).toEqual({
        file,
        digest: DEFAULT_BRANCH_DIGESTS[file] as string,
      });
    }
  });

  test("the region removal actually drops the line — otherwise the digest check proves nothing (T-017)", () => {
    const il = readFileSync(join(DATA_DIR, "us-state-il.json"), "utf8");
    const neutralised = withoutRegion(il);
    expect(neutralised).not.toBe(il);
    expect(il).toContain('"region": "Great Lakes"');
    expect(neutralised).not.toContain('"region"');
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
