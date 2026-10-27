/**
 * T-090 tester: one `describe` per acceptance criterion of
 * `tasks/T-090-climate-far-phrases.md`. Expected values come from the
 * criteria, the committed entity files and the committed files at the base
 * commit `3279555`. `distractors.ts` was read for entry points and signatures
 * only.
 *
 * Baselines at `3279555` are embedded as sha256 digests, computed once from a
 * `git worktree` of `3279555` with the same helper functions as below, because
 * CI checks out shallow and cannot read it. Criterion 20's trees (frontend/,
 * backend/app/ but content.json, openapi.yaml, geoquizdataplan.md, migrations)
 * are pinned the same way, so no git call is ever handed a revision (the T-081
 * guard, `git-exit-guard.criteria.test.ts`). Those pins go red when a later
 * task deliberately changes one of those trees; that task's tester raises a
 * test change request.
 *
 * Pure: no network, no seam, nothing mocked, nothing written. The only I/O is
 * reading committed files and `git`.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AGRICULTURE_SAME_THING_PAIRS,
  buildChoices,
  greatCircleKm,
  LANDMARK_TRAPS,
  SAME_ANIMAL_PAIRS,
  SAME_CLIMATE_GROUPS,
  SAME_LANDMARK_PAIRS,
} from "./distractors";
import { generate } from "./generate";
import { buildQuestionBank, renderQuestionFile } from "./question-file";
import { LEVEL_SEED_WEIGHTS } from "./seed-level";
import { type DistractorStrategy, TEMPLATES, type Template } from "./templates";
import type { Entity } from "./types";
import { loadCommittedEntities, REPO_ROOT } from "./write-questions";

const REPO = REPO_ROOT;
const CLIMATE_TPL = "tpl-climate-of";
const CLIMATE = TEMPLATES.find((t) => t.id === CLIMATE_TPL) as Template;
const CAP_SET = ["us-state-hi", "us-state-ak"];

// ---------------------------------------------------------------------------
// Helpers shared with the one-off script that computed the 3279555 digests.

function canon(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, (v as Record<string, unknown>)[k]]),
        )
      : v,
  );
}
const sha = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");
interface Q {
  id: string;
  templateId: string;
  entityId: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  level?: number;
  topic?: string;
  answer?: string;
}
const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
function nonClimateDigest(qs: Q[]): string {
  return sha(canon(qs.filter((q) => q.templateId !== CLIMATE_TPL).sort(byId)));
}
function climateFixedDigest(qs: Q[]): string {
  return sha(
    canon(
      qs
        .filter((q) => q.templateId === CLIMATE_TPL)
        .sort(byId)
        .map((q) => ({
          id: q.id,
          entityId: q.entityId,
          prompt: q.prompt,
          answer: q.answer ?? q.choices[q.correctIndex],
          correctIndex: q.correctIndex,
          answerAt: q.choices.indexOf(q.answer ?? (q.choices[q.correctIndex] as string)),
        })),
    ),
  );
}
function tracked(root: string, path: string): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "--", path], { cwd: root });
  if (proc.exitCode !== 0) throw new Error(`git ls-files ${path} exited ${proc.exitCode}`);
  const paths = proc.stdout.toString().split("\n").filter(Boolean).sort();
  if (paths.length === 0) throw new Error(`nothing tracked under ${path}`);
  return paths;
}
function treeDigest(root: string, path: string, except: string[] = []): string {
  return sha(
    tracked(root, path)
      .filter((p) => !except.includes(p))
      .map((p) => `${p}\t${sha(readFileSync(join(root, p)))}\n`)
      .join(""),
  );
}
function sectionOf(doc: string, heading: string): string {
  const start = doc.indexOf(`\n## ${heading} `);
  if (start < 0) throw new Error(`no section ${heading}`);
  const next = doc.indexOf("\n## ", start + 1);
  return next < 0 ? doc.slice(start) : doc.slice(start, next);
}

/** A fixture state on the equator: distance from `[0, 0]` grows with `|lon|`. */
function st(code: string, lon: number, climate: string, extra: Record<string, unknown> = {}) {
  return {
    id: `us-state-${code.toLowerCase()}`,
    type: "state" as const,
    scope: "us" as const,
    name: `State ${code}`,
    capital: `Capital ${code}`,
    geometry_id: `g${code}`,
    region: "Fixture Region",
    centroid: [lon, 0] as [number, number],
    climate_kid: climate,
    state_animal: `animal ${code}`,
    landmark: `landmark ${code}`,
    top_crops: [`crop ${code}`],
    top_livestock: [`beast ${code}`],
    ...extra,
  };
}
/** Inputs that would trip both caps: HI and AK farthest, three Great Plains next. */
function strategyProbeEntities() {
  return [
    st("TX", 0, "tx climate", { region: "South", borders: ["us-state-ks"], area_rank: 2 }),
    st("HI", 175, "hi climate", { area_rank: 3 }),
    st("AK", 172, "ak climate", { area_rank: 4 }),
    st("IA", 170, "ia climate", { area_rank: 5 }),
    st("NE", 165, "ne climate", { area_rank: 6 }),
    st("KS", 160, "ks climate", { area_rank: 1 }),
    st("OR", 120, "or climate", { region: "South" }),
    st("CO", 90, "co climate"),
  ];
}
const STRATEGIES = [
  "neighbours_first",
  "sibling_capitals_same_region",
  "next_ranked_by_area",
  "state_animals_neighbours_first",
  "landmarks_neighbours_first",
  "crops_not_grown_nearby",
  "livestock_not_raised",
];

// ---------------------------------------------------------------------------
// Fixture runner for the climate rule.

const phrase = (code: string): string => `climate of ${code}`;

/** Build the climate question for `answerCode` over the fixture states. */
function climateFor(answerCode: string, fixture: ReturnType<typeof st>[]) {
  const entities = fixture as unknown as Entity[];
  const { drafts } = generate(entities, [CLIMATE]);
  const id = `us-state-${answerCode.toLowerCase()}`;
  const mine = drafts.filter((d) => d.entityId === id);
  expect(mine).toHaveLength(1);
  return buildChoices(mine, entities, [CLIMATE]);
}
function wrongOf(q: { choices: string[]; correctIndex: number }): string[] {
  return q.choices.filter((_, i) => i !== q.correctIndex);
}
function wrongFor(answerCode: string, fixture: ReturnType<typeof st>[]): string[] {
  const out = climateFor(answerCode, fixture);
  expect(out.shortPools).toEqual([]);
  expect(out.questions).toHaveLength(1);
  return [...wrongOf(out.questions[0] as Q)].sort();
}
const s = (code: string, lon: number) => st(code, lon, phrase(code));
const phrases = (...codes: string[]) => codes.map(phrase).sort();

// ---------------------------------------------------------------------------
// The committed bank.

const entities = loadCommittedEntities();
const entityById = new Map(entities.map((e) => [e.id, e]));
const postal = (id: string): string => id.slice(-2).toUpperCase();
const groupOfId = (id: string): string | null => {
  for (const [g, codes] of Object.entries(SAME_CLIMATE_GROUPS)) {
    if (codes.includes(postal(id))) return g;
  }
  return null;
};
const committedQb = JSON.parse(
  readFileSync(join(REPO, "question-bank/data/questions/us-states.json"), "utf8"),
) as { count: number; questions: Q[] };
const content = JSON.parse(readFileSync(join(REPO, "backend/app/data/content.json"), "utf8")) as {
  questions: Q[];
};
const climateQb = committedQb.questions.filter((q) => q.templateId === CLIMATE_TPL);
const climateCj = content.questions.filter((q) => q.templateId === CLIMATE_TPL);

/** Every entity whose `climate_kid` is exactly `text` (state ids). */
function sourcesOf(text: string): string[] {
  return entities.filter((e) => e.climate_kid === text).map((e) => e.id);
}
function capCount(q: Q): number {
  return wrongOf(q).filter((w) => sourcesOf(w).some((id) => CAP_SET.includes(id))).length;
}
function maxFromOneGroup(q: Q): number {
  const counts = new Map<string, number>();
  for (const w of wrongOf(q)) {
    const groups = new Set(
      sourcesOf(w)
        .map(groupOfId)
        .filter((g) => g !== null),
    );
    for (const g of groups) counts.set(g as string, (counts.get(g as string) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

/**
 * Criterion 5 written out from its wording, independently of `distractors.ts`:
 * walk the other states farthest first (ties to the smaller id), skip same text
 * as the answer or an earlier pick, a state in the answer's group, a second
 * HI/AK, and a third from one group; stop at three.
 */
function referenceWrong(own: Entity): string[] {
  const origin = own.centroid as [number, number];
  const candidates = entities
    .filter((e) => e.id !== own.id && typeof e.climate_kid === "string" && e.centroid)
    .map((e) => ({ e, d: greatCircleKm(origin, e.centroid as [number, number]) }))
    .sort((a, b) => (a.d !== b.d ? b.d - a.d : a.e.id < b.e.id ? -1 : 1));
  const ownGroup = groupOfId(own.id);
  const picked: Entity[] = [];
  for (const { e } of candidates) {
    if (picked.length === 3) break;
    const text = e.climate_kid as string;
    if (text === own.climate_kid || picked.some((p) => p.climate_kid === text)) continue;
    if (ownGroup !== null && groupOfId(e.id) === ownGroup) continue;
    if (CAP_SET.includes(e.id) && picked.some((p) => CAP_SET.includes(p.id))) continue;
    const g = groupOfId(e.id);
    if (g !== null && picked.filter((p) => groupOfId(p.id) === g).length >= 2) continue;
    picked.push(e);
  }
  return picked.map((p) => p.climate_kid as string).sort();
}

// ---------------------------------------------------------------------------

describe("T-090 criterion 1: at most one wrong answer from HI and AK", () => {
  test("TX with HI and AK the two farthest: only one of them is offered", () => {
    const wrong = wrongFor("TX", [
      s("TX", 0),
      s("HI", 170),
      s("AK", 160),
      s("CO", 150),
      s("NY", 140),
      s("CA", 130),
    ]);
    expect(wrong.filter((w) => w === phrase("HI") || w === phrase("AK"))).toHaveLength(1);
  });

  test("AK's own question may offer HI's phrase", () => {
    expect(
      wrongFor("AK", [s("AK", 0), s("HI", 170), s("CO", 150), s("NY", 140), s("CA", 130)]),
    ).toContain(phrase("HI"));
  });

  test("HI's own question may offer AK's phrase", () => {
    expect(
      wrongFor("HI", [s("HI", 0), s("AK", 170), s("CO", 150), s("NY", 140), s("CA", 130)]),
    ).toContain(phrase("AK"));
  });

  test("every climate question built from the committed entities offers at most one", () => {
    const { drafts } = generate(entities, [CLIMATE]);
    const { questions } = buildChoices(drafts, entities, [CLIMATE]);
    expect(questions).toHaveLength(50);
    const over = questions.filter((q) => capCount(q as Q) > 1).map((q) => q.entityId);
    expect(over).toEqual([]);
  });
});

describe("T-090 criterion 2: boundary of 1, the farther of HI and AK is offered", () => {
  test("HI farther than AK: HI offered, AK not, the next two farthest fill in", () => {
    expect(
      wrongFor("TX", [
        s("TX", 0),
        s("HI", 170),
        s("AK", 160),
        s("CO", 150),
        s("NY", 140),
        s("CA", 130),
      ]),
    ).toEqual(phrases("HI", "CO", "NY"));
  });

  test("AK farther than HI: AK offered, HI not", () => {
    expect(
      wrongFor("TX", [
        s("TX", 0),
        s("AK", 170),
        s("HI", 160),
        s("CO", 150),
        s("NY", 140),
        s("CA", 130),
      ]),
    ).toEqual(phrases("AK", "CO", "NY"));
  });
});

describe("T-090 criterion 3: no group supplies all three wrong answers", () => {
  test("TX with three Great Plains states farthest: not all three are offered", () => {
    const wrong = wrongFor("TX", [
      s("TX", 0),
      s("IA", 170),
      s("NE", 160),
      s("KS", 150),
      s("CA", 140),
      s("NY", 130),
    ]);
    expect(
      wrong.filter((w) => [phrase("IA"), phrase("NE"), phrase("KS")].includes(w)).length,
    ).toBeLessThan(3);
  });

  test("every climate question built from the committed entities draws at most two from one group", () => {
    const { drafts } = generate(entities, [CLIMATE]);
    const { questions } = buildChoices(drafts, entities, [CLIMATE]);
    expect(questions).toHaveLength(50);
    expect(questions.filter((q) => maxFromOneGroup(q as Q) > 2).map((q) => q.entityId)).toEqual([]);
  });
});

describe("T-090 criterion 4: boundary of 2, two from one group still allowed", () => {
  test("three Great Plains farthest: the first two, then the next farthest outside the group", () => {
    expect(
      wrongFor("TX", [
        s("TX", 0),
        s("IA", 170),
        s("NE", 160),
        s("KS", 150),
        s("ND", 145),
        s("CA", 140),
        s("NY", 130),
      ]),
    ).toEqual(phrases("IA", "NE", "CA"));
  });

  test("two from one group and one from another is a full question", () => {
    expect(
      wrongFor("TX", [s("TX", 0), s("OR", 170), s("WA", 160), s("MT", 150), s("NY", 130)]),
    ).toEqual(phrases("OR", "WA", "MT"));
  });
});

describe("T-090 criterion 5: farthest first, apart from the caps", () => {
  test("own-group, same-text and capped candidates are skipped; nothing else is", () => {
    const fixture = [
      st("KS", 0, phrase("KS")),
      st("IA", 179, phrase("IA")), // KS's own group: excluded
      st("TX", 177, phrase("KS")), // same text as the answer
      st("HI", 175, phrase("HI")),
      st("CO", 173, phrase("HI")), // same text as an earlier pick
      st("AK", 171, phrase("AK")), // second from the cap set
      st("OR", 160, phrase("OR")),
      st("WA", 150, phrase("WA")),
      st("ME", 140, phrase("ME")), // fourth: not reached
    ];
    expect(wrongFor("KS", fixture)).toEqual(phrases("HI", "OR", "WA"));
  });

  test("both caps in one walk: IA, NE, skip KS (third Great Plains), AK, stop before HI", () => {
    expect(
      wrongFor("TX", [
        s("TX", 0),
        s("IA", 175),
        s("NE", 172),
        s("KS", 170),
        s("AK", 165),
        s("HI", 160),
        s("CO", 150),
      ]),
    ).toEqual(phrases("IA", "NE", "AK"));
  });

  test("ties at equal distance go to the smaller entity id", () => {
    // CA and NY are both 150 degrees away; only one slot is left for them.
    expect(
      wrongFor("TX", [s("TX", 0), s("CO", 170), s("FL", 160), s("NY", -150), s("CA", 150)]),
    ).toEqual(phrases("CO", "FL", "CA"));
  });

  test("same input, same output, and the input is not mutated", () => {
    const fixture = [
      s("TX", 0),
      s("HI", 175),
      s("AK", 172),
      s("IA", 170),
      s("NE", 165),
      s("KS", 160),
      s("OR", 120),
    ];
    const before = canon(fixture);
    const a = climateFor("TX", fixture);
    const b = climateFor("TX", fixture);
    expect(canon(a)).toBe(canon(b));
    expect(canon(fixture)).toBe(before);
  });

  test("every committed climate question's wrong answers are the reference walk's", () => {
    for (const file of [climateQb, climateCj]) {
      expect(file).toHaveLength(50);
      const mismatches = file
        .map((q) => {
          const own = entityById.get(q.entityId) as Entity;
          return { state: q.entityId, got: [...wrongOf(q)].sort(), want: referenceWrong(own) };
        })
        .filter((m) => canon(m.got) !== canon(m.want));
      expect(mismatches).toEqual([]);
    }
  });
});

describe("T-090 criterion 6: the caps are never relaxed", () => {
  test("only HI, AK and one other eligible: short with found 2, no question", () => {
    const out = climateFor("TX", [s("TX", 0), s("HI", 170), s("AK", 160), s("CO", 150)]);
    expect(out.questions).toEqual([]);
    expect(out.shortPools).toEqual([
      { draftId: `gen:${CLIMATE_TPL}:us-state-tx`, found: 2, reason: "too_few_candidates" },
    ]);
  });

  test("only three Great Plains states eligible: short with found 2", () => {
    const out = climateFor("TX", [s("TX", 0), s("IA", 170), s("NE", 160), s("KS", 150)]);
    expect(out.questions).toEqual([]);
    expect(out.shortPools).toEqual([
      { draftId: `gen:${CLIMATE_TPL}:us-state-tx`, found: 2, reason: "too_few_candidates" },
    ]);
  });
});

describe("T-090 criterion 7: every other strategy gives what it gave at 3279555", () => {
  test("cap-triggering fixture, every non-climate strategy on seven answer fields", () => {
    const probe: Record<string, unknown> = {};
    for (const strategy of STRATEGIES) {
      const tpls = [
        "climate_kid",
        "name",
        "capital",
        "state_animal",
        "landmark",
        "top_crops",
        "top_livestock",
      ].map((f) => ({
        ...CLIMATE,
        id: `tpl-probe-${strategy}-${f}`.replaceAll("_", "-"),
        distractor_strategy: strategy as DistractorStrategy,
        answer_field: f as Template["answer_field"],
        requires: (f === "name" ? ["name"] : ["name", f]) as Template["requires"],
      }));
      const e = strategyProbeEntities() as unknown as Entity[];
      probe[strategy] = buildChoices(generate(e, tpls).drafts, e, tpls);
    }
    // The fixture really reaches the caps' territory: neighbours_first offers HI and AK together.
    const nf = probe["neighbours_first"] as { questions: Q[] };
    expect(
      nf.questions.some(
        (q) => q.choices.includes("hi climate") && q.choices.includes("ak climate"),
      ),
    ).toBe(true);
    expect(sha(canon(probe))).toBe(
      "c63b64056ee69882add298b609be15c60d977d5d41d0f3bff6a4aaa6e8740040",
    );
  });

  test("committed entities, every non-climate template", () => {
    const tpls = TEMPLATES.filter((t) => t.distractor_strategy !== "climates_outside_group");
    expect(tpls.length).toBe(TEMPLATES.length - 1);
    const out = buildChoices(generate(entities, tpls).drafts, entities, tpls);
    // T-092 (approved Test change request, row 19): 3279555's output with
    // `choices`, `correctIndex` and `choiceGeometryIds` stripped from map_click.
    expect(sha(canon(out))).toBe(
      "e7213f8a9137f8faca571a16af99eee27735b54c4e8945873174b39a1cbefb5c",
    );
  });
});

describe("T-090 criterion 8: both committed files are regenerated", () => {
  test("us-states.json is exactly what the pipeline renders from the committed entities", () => {
    expect(readFileSync(join(REPO, "question-bank/data/questions/us-states.json"), "utf8")).toBe(
      renderQuestionFile(entities),
    );
  });

  test("content.json's climate questions carry the regenerated bank's choices", () => {
    const fromQb = new Map(climateQb.map((q) => [q.id, q]));
    for (const q of climateCj) {
      const twin = fromQb.get(q.id) as Q;
      expect({
        id: q.id,
        choices: q.choices,
        correctIndex: q.correctIndex,
        level: q.level,
      }).toEqual({
        id: twin.id,
        choices: twin.choices,
        correctIndex: twin.correctIndex,
        level: twin.level,
      });
    }
  });
});

describe("T-090 criterion 9: no committed climate question offers both", () => {
  test("question file: 0 of 50 offer both HI's and AK's phrase; each offers at most one", () => {
    expect(climateQb).toHaveLength(50);
    expect(climateQb.filter((q) => capCount(q) > 1).map((q) => q.id)).toEqual([]);
  });

  test("content.json: the same", () => {
    expect(climateCj).toHaveLength(50);
    expect(climateCj.filter((q) => capCount(q) > 1).map((q) => q.id)).toEqual([]);
  });
});

describe("T-090 criterion 10: same counts", () => {
  test("50 tpl-climate-of questions in the question file, one per state", () => {
    expect(climateQb).toHaveLength(50);
    expect(new Set(climateQb.map((q) => q.entityId)).size).toBe(50);
    expect(new Set(climateQb.map((q) => q.entityId))).toEqual(new Set(entities.map((e) => e.id)));
  });

  // T-051 serves the 50 map_click questions (approved Test change request row 29).
  test("content.json serves 415 questions, climate 50", () => {
    expect(content.questions).toHaveLength(415);
    expect(content.questions.filter((q) => q.topic === "climate")).toHaveLength(50);
  });

  test("no climate draft is a short pool", () => {
    const { shortPools } = buildQuestionBank(entities);
    expect(shortPools.filter((p) => p.draftId.startsWith(`gen:${CLIMATE_TPL}:`))).toEqual([]);
  });
});

describe("T-090 criterion 11: only the three wrong answers moved", () => {
  test("question file: id, prompt, answer, correctIndex and answer position as at 3279555", () => {
    expect(climateFixedDigest(committedQb.questions)).toBe(
      "50bd10d64084c0531b3d83a259cf19a61d833089b3c3c7a3d5cf696fd67e459a",
    );
  });

  test("content.json: the same", () => {
    expect(climateFixedDigest(content.questions)).toBe(
      "50bd10d64084c0531b3d83a259cf19a61d833089b3c3c7a3d5cf696fd67e459a",
    );
  });

  test("level is the existing formula's output (criterion 8's regeneration covers it)", () => {
    const regenerated = new Map(buildQuestionBank(entities).questions.map((q) => [q.id, q.level]));
    for (const q of climateQb)
      expect([q.id, q.level]).toEqual([q.id, regenerated.get(q.id) as number]);
  });
});

describe("T-090 criterion 12: nothing else in the bank moved", () => {
  test("question file: every non-climate question deep-equal to 3279555", () => {
    // T-092 (approved Test change request, row 20): 3279555's file with
    // `choices`, `correctIndex` and `choiceGeometryIds` stripped from map_click.
    expect(nonClimateDigest(committedQb.questions)).toBe(
      "a7407efb948aeebe863f5e74b6af341666cb57fea0d74122891591f700481c3f",
    );
  });

  // T-051 adds 50 map_click questions that 3279555 did not serve (approved Test
  // change request row 30); every question that was served there is unchanged.
  test("content.json: every non-climate, non-map_click question deep-equal to 3279555", () => {
    expect(
      nonClimateDigest(content.questions.filter((q) => q.templateId !== "tpl-click-the-map")),
    ).toBe("0d32ac5784b0d5241b565963036f1500f558f88dc820838c9991a8630c602501");
  });

  test("every file under question-bank/data/us-states/ is byte-identical to 3279555", () => {
    expect(treeDigest(REPO, "question-bank/data/us-states")).toBe(
      "a67db5024454f4604068fa61b3020489b14f603caa4e4ec81b70af8c973fb8d6",
    );
  });
});

describe("T-090 criterion 13: no weight moved", () => {
  test("LEVEL_SEED_WEIGHTS deep-equal to 3279555, concept_load for climate still 3", () => {
    expect(
      LEVEL_SEED_WEIGHTS.concept_load[CLIMATE_TPL as keyof typeof LEVEL_SEED_WEIGHTS.concept_load],
    ).toBe(3);
    expect(sha(canon(LEVEL_SEED_WEIGHTS))).toBe(
      "5ccdad6e67df3534ef507346e5c4095acad3f21141c0445afb3390d442effde5",
    );
  });
});

// ---------------------------------------------------------------------------

const decisions = readFileSync(join(REPO, "engineering-decisions.md"), "utf8");
const TABLE_D = ["CA", "TX", "FL", "NY", "WA", "CO", "KY", "HI", "AK", "RI"];

describe("T-090 criterion 14: the re-read is a new E-n entry", () => {
  const numbers = [...decisions.matchAll(/^## E-(\d+) /gm)].map((m) => Number(m[1]));
  // Read by number, not as the newest entry: T-089 added E-28 (approved Test change request row 1).
  const entry = sectionOf(decisions, "E-27");

  test("the entry is E-27, the next unused number after E-26, and appears once", () => {
    expect(numbers.filter((n) => n === 27)).toHaveLength(1);
    expect(numbers.indexOf(27)).toBe(numbers.indexOf(26) + 1);
    expect(entry).toMatch(/T-090/);
  });

  test("(a) the ten states' rows match the regenerated bank, with a verdict and a reason", () => {
    const rows = entry
      .split("\n")
      .filter((l) => /^\| [A-Z]{2} \|/.test(l))
      .map((l) =>
        l
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim()),
      );
    expect(rows.map((r) => r[0])).toEqual(TABLE_D);
    for (const [code, prompt, correct, d1, d2, d3, level, verdict, why] of rows as string[][]) {
      const q = climateQb.find(
        (x) => x.entityId === `us-state-${(code as string).toLowerCase()}`,
      ) as Q;
      expect({ code, prompt, correct, wrong: [d1, d2, d3].sort(), level: Number(level) }).toEqual({
        code,
        prompt: q.prompt,
        correct: q.choices[q.correctIndex],
        wrong: [...wrongOf(q)].sort(),
        level: q.level as number,
      });
      expect(["too easy", "about right", "too hard"]).toContain(verdict as string);
      if (verdict !== "about right") expect((why as string).length).toBeGreaterThan(10);
    }
  });

  test("(b) the counts: how many offer at least one of HI's and AK's phrases, and 0 offer both", () => {
    const atLeastOne = climateQb.filter((q) => capCount(q) >= 1).length;
    const both = climateQb.filter((q) => capCount(q) === 2).length;
    expect(both).toBe(0);
    const b = entry.slice(entry.indexOf("### (b)"), entry.indexOf("### (c)"));
    expect(b).toContain(`**${atLeastOne}** offer at least one`);
    expect(b).toContain("**0** offer both");
  });

  test("(c) a judgement on concept_load[tpl-climate-of]", () => {
    const c = entry.slice(entry.indexOf("### (c)"), entry.indexOf("### (d)"));
    expect(c).toMatch(/concept_load/);
    expect(c).toMatch(/\bkeep\b|\bmove (?:it )?to \d/i);
  });

  test("(d) CA unchanged and why, and whether it is still too hard; CA's question is as at 3279555", () => {
    const d = entry.slice(entry.indexOf("### (d)"));
    expect(d).toMatch(/California's question is unchanged/);
    expect(d).toMatch(/two groups/);
    expect(d).toMatch(/too hard/);
    const ca = committedQb.questions.find((q) => q.id === `gen:${CLIMATE_TPL}:us-state-ca`);
    expect(sha(canon(ca))).toBe(
      sha(
        canon({
          id: "gen:tpl-climate-of:us-state-ca",
          entityId: "us-state-ca",
          templateId: "tpl-climate-of",
          format: "multiple_choice",
          prompt: "What kind of climate does California have?",
          answer:
            "sunny dry summers near the coast, hot deserts and snowy mountains further inland",
          choices: [
            "sunny dry summers near the coast, hot deserts and snowy mountains further inland",
            "cold snowy winters and cool breezy summers, especially up near the coast",
            "cold snowy winters and warm humid summers, with strong storms off the coast",
            "cold snowy winters, especially high in the mountains, and warm summers below",
          ],
          correctIndex: 0,
          level: 5,
          scope: "us",
          entityType: "state",
          topic: "climate",
          region: "Pacific West",
          ageBand: 1,
        }),
      ),
    );
  });
});

describe("T-090 criterion 15: E-25 records both caps and points at the new entry", () => {
  test("E-25's climates_outside_group bullet carries a dated amendment naming both caps and E-27", () => {
    const e25 = sectionOf(decisions, "E-25");
    const bullet = e25.slice(
      e25.indexOf("**`climates_outside_group`**"),
      e25.indexOf("**`crops_not_grown_nearby`**"),
    );
    expect(bullet).toMatch(/Amended \d{4}-\d{2}-\d{2} \(T-090\)/);
    expect(bullet).toMatch(/Hawaii or Alaska/);
    expect(bullet).toMatch(/all three/);
    expect(bullet).toMatch(/E-27/);
  });
});

describe("T-090 criterion 16: the source comments describe both caps", () => {
  test("templates.ts climates_outside_group doc comment names both caps", () => {
    const src = readFileSync(join(REPO, "question-bank/src/templates.ts"), "utf8");
    const doc = src.slice(
      src.indexOf("`climates_outside_group`:"),
      src.indexOf("`crops_not_grown_nearby`:"),
    );
    expect(doc).toMatch(/Hawaii or Alaska/);
    expect(doc).toMatch(/at most one/);
    expect(doc).toMatch(/all three/);
  });

  test("distractors.ts climate comments name both caps", () => {
    const src = readFileSync(join(REPO, "question-bank/src/distractors.ts"), "utf8");
    expect(src).toMatch(/at most one wrong answer from this list/);
    expect(src).toMatch(/all three wrong answers from one/);
  });
});

describe("T-090 criterion 17: no new dependency, no lockfile change", () => {
  test("every package.json, pyproject.toml and lockfile is byte-identical to 3279555, none added", () => {
    const MANIFESTS = [
      "question-bank/package.json",
      "question-bank/bun.lock",
      "frontend/package.json",
      "frontend/bun.lock",
      "e2e/package.json",
      "e2e/bun.lock",
      "backend/pyproject.toml",
      "backend/uv.lock",
    ];
    const all = tracked(REPO, ".").filter((p) =>
      /(^|\/)(package\.json|pyproject\.toml|bun\.lock|uv\.lock|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(
        p,
      ),
    );
    expect(all.sort()).toEqual([...MANIFESTS].sort());
    expect(sha(MANIFESTS.map((p) => `${p}\t${sha(readFileSync(join(REPO, p)))}\n`).join(""))).toBe(
      "dd74b9811dd802443fc620e283b070bad1e0580e468abe903fda41544cc3c8b9",
    );
  });
});

describe("T-090 criterion 18: no test reaches the network", () => {
  test("neither T-090 test file names a URL, fetch, a transport or a spawn other than git", () => {
    for (const name of ["climate-far-phrases.test.ts", "climate-far-phrases-verify.test.ts"]) {
      const body = readFileSync(join(REPO, "question-bank/src", name), "utf8")
        .split("\n")
        .filter((l) => !l.includes("this line is the check itself"))
        .join("\n");
      expect(body).not.toMatch(/https?:\/\//); // this line is the check itself
      expect(body).not.toMatch(/\bfetch\(|Transport\b|EntitySink/); // this line is the check itself
      for (const m of body.matchAll(/spawnSync\(\[\s*"([^"]+)"/g)) expect(m[1]).toBe("git");
    }
  });
});

describe("T-090 criterion 19: no climate phrase written or edited", () => {
  test("every wrong answer in every climate question is exactly some committed state's climate_kid", () => {
    for (const file of [climateQb, climateCj]) {
      const invented = file.flatMap((q) => wrongOf(q)).filter((w) => sourcesOf(w).length === 0);
      expect(invented).toEqual([]);
    }
  });

  test("the person-approved lists in distractors.ts are as at 3279555", () => {
    expect(
      sha(
        canon({
          SAME_ANIMAL_PAIRS,
          SAME_LANDMARK_PAIRS,
          LANDMARK_TRAPS,
          SAME_CLIMATE_GROUPS,
          AGRICULTURE_SAME_THING_PAIRS,
        }),
      ),
    ).toBe("5ef571f1c4471553f22217bc8278ec88e3dde2a8ab3e03afd722b027885deb65");
  });
});

describe("T-090 criterion 20: no other surface changes", () => {
  test("backend/scripts/measure_selection.py is byte-identical to 3279555", () => {
    expect(treeDigest(REPO, "backend/scripts/measure_selection.py")).toBe(
      "76adb9da69ff4bd56c785fb857655ad63d8701520ffd9d8c21aeb91b45bd1304",
    );
  });

  test("E-26's text is byte-identical to 3279555", () => {
    expect(sha(sectionOf(decisions, "E-26"))).toBe(
      "8ce8af48f26e3b88ba455d128597d97fc84ab57b61f5ef2b2fbc625ac74b465d",
    );
  });

  test.each([
    ["geoquizdataplan.md", [], "ec848e63548e360dbe100e99d3be8e565a93aa227bece35620859242e130b1d6"],
    ["backend/migrations", [], "de664c4e8f50a93fe186f4795efdf872fdd3eac9642c7f728975e48a80c132cd"],
  ] as const)("%s (except %p) is byte-identical to 3279555", (path, except, digest) => {
    expect(treeDigest(REPO, path, [...except])).toBe(digest);
  });

  // T-051 deleted the `frontend`, `openapi.yaml` and `backend/app` tree pins: T-051
  // edits all three on purpose (approved Test change request row 31).
});
