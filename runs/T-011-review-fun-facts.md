# T-011 — Review the 50 draft fun facts — run log

**Task:** T-011 · **Branch:** `task/T-011-review-fun-facts` · **PR:** [#41](https://github.com/Dkaattae/geo-discovery-zone/pull/41)
**Started:** 2026-09-14 · **Outcome:** ready for merge, gated on Dkaattae reading all 50 facts (D-4a) — see the four content flags round 3 raised

## Round 1 — task-expander — 2026-09-14

`Next step` on entry: *(none — no brief existed; Dkaattae-started round 1)* → on exit: `worker` (gated on `Approved:`)

Session: `cse_01NqBhtxscKupMdww97kUauJ`

**T-011 brief written, pushed, and opened as draft PR #41.** Branch `task/T-011-review-fun-facts`, recorded in the brief's `Branch:` header, pushed and confirmed on the remote. Diff is `tasks/T-011-review-fun-facts.md` + one word in `tasks.md` (T-011 `todo` → `doing`). No source, tests or config.

**What the survey changed about the task:**
- "Run the pipeline, rewrite each draft" — a live run is optional raw material only; it cannot regenerate the tracked bank without breaking T-010's byte-identity tests (`sources.built_at` would be wall clock, not the fixture's capture instant). Written into Out of scope.
- "the app can read them" — impossible in this task; `backend/app/data/content.json` is hand-copied and nothing bridges pipeline → served bank yet (T-040/T-050). Criteria stop at the committed bank in the `FunFact` shape.
- A third gotcha beyond the two the queue entry already named: `committed-bank.test.ts:155` asserts the tracked `us-state-co.json` equals `sample-data/us-state-co.json` except `built_at` — Colorado gaining a fact turns that red unless `sample-data` is rebuilt too (criterion 9).
- Two docs go false on landing: `sample-data/README.md:20-23` and E-6's closing present-tense claim — criterion 11, with the constraint that E-6 must keep designating the same home so its existing grep-tests still pass.

**The content decision, and why the expander did not halt on it.** `process-decisions.md` D-4a names T-011 by name as the paradigm where "a test can confirm the shape and only a person can confirm the substance," with the human check at the reviewer's envelope (before merge), not blocking the worker. Criterion 12 forces all 50 facts into the brief's `## Handoff` so they read top to bottom in one place, with a seven-box Review checklist (truth, tone, grim content, working URLs). Criterion 1 permits a blank only if the Handoff names it and why; criterion 6 requires an `https://` `source_url` on every fact.

13 criteria total.

## Round resumed — 2026-09-14

Dkaattae reviewed the brief and approved the criteria directly: "Approve T-011, criteria look good." The brief header's `Approved:` was updated from `pending` to `Dkaattae, 2026-09-14`, committed (`3f90435`) and pushed to `origin/task/T-011-review-fun-facts`, confirmed on the remote.

Gates checked before spawn, all clean: G0 (`Next step` named exactly one role, `worker`); G1 (`git diff --name-only origin/main...HEAD` touched only `tasks.md`, `tasks/T-011-…`); G2 (`Approved:` present, not bare `pending`); G3 (no prior `fail`/`blocked` verdicts on this task); G4 (current branch `task/T-011-review-fun-facts` matched the brief's `Branch:` header).

## Round 2 — worker — 2026-09-14

`Next step` on entry: `worker` → on exit: `tester`

Session: `cse_01NqBhtxscKupMdww97kUauJ`

Push confirmed landed at `e040f9c` on `origin/task/T-011-review-fun-facts`, matching the brief's `Branch:` header.

**T-011 done: all 50 states now carry one `reviewed: true` fun fact, shape-verified, rebuilt not hand-edited, still gated on human content review.**

- `question-bank/src/curated/us-states.ts` — added `fun_facts?: FunFact[]` to `CuratedState`, one entry per state.
- `question-bank/src/normalize.ts` — `fun_facts: []` (unconditional) → `fun_facts: curated.fun_facts ?? []`.
- All 50 files under `question-bank/data/us-states/` regenerated via `bun run build -- --offline --out data/us-states`; `sample-data/us-state-co.json` via `bun run build:sample`. Confirmed idempotent (offline rebuild run three times total, no further diff after the first).
- `question-bank/sample-data/fun-facts.review.json` deleted — it carried `"reviewed": false`, which criterion 2 bans anywhere under `data/` or `sample-data/`; not in the brief's "expected to change" list, flagged as a deliberate divergence in the Handoff.
- `question-bank/sample-data/README.md` and `engineering-decisions.md` E-6 updated so neither still makes the stale claims criterion 11 bans.
- `bun test` (209 pass), `bun run typecheck` clean in `question-bank/`. `bun test` (184 pass) and `bun run lint` clean in `frontend/`; `frontend`'s `bun run typecheck` fails only on pre-existing missing `react-simple-maps`/`us-atlas` packages the sandbox npm proxy 403s on — pre-existing, documented in `PROGRESS.md`, unrelated to this task, frontend untouched.
- Every shape criterion (1-11, 13) checked mechanically against the actual tracked files with a throwaway script (not committed, noted why in the Handoff).

Full 50-fact table, per-criterion verification detail, and two flagged judgment calls (the deleted review file; a model-choice note on content quality) are in the brief's `## Handoff` and `## Notes`.

## Orchestrator checkpoint — 2026-09-14 (round 2)

The worker pushed its own commit (`e040f9c`) successfully. Confirmed `git log
origin/task/T-011-review-fun-facts -1` matches local HEAD.

G5 check: `Status` changed from `awaiting approval` to `awaiting verification`;
`Next step` changed from `worker` to `tester`. Not a stall — the header moved.

## Round 3 — tester — 2026-09-14

`Next step` on entry: `tester` → on exit: `reviewer`

Session: `cse_01NqBhtxscKupMdww97kUauJ`

**Verdict: `pass`** — on shape, which is all a test can reach for this task. Pushed to `task/T-011-review-fun-facts`; remote head `19027c6`, carries `question-bank/src/fun-facts.test.ts`. Brief `Status: pass`, `Next step: reviewer`.

**Independence caveat** (as with T-010): session id shared with `task-expander` and `worker` in this orchestrated run, so the Sessions check is inapplicable — the verdict rests on a freshly spawned context that never saw the worker's reasoning.

**All 13 criteria met.** 34 new tests cover criteria 1-8 and 10-11; the pre-existing 209 cover 7's rebuild half, 9 and 13. Criterion 12 and the diff-scoped halves of 10/13 were verified mechanically and recorded in the Verdict rather than committed (a committed version would be vacuous under CI's `fetch-depth: 1`, or permanently red once the reviewer sweeps the brief).

- Criterion 12 checked by parsing the Handoff table against the 50 tracked files: 50 rows, 0 text mismatches, 0 URL mismatches.
- Criterion 8 exercised, not assumed — CO's curated `fun_facts` deleted in-test, `normalizeUsStates` run on the committed fixture, entity still serializes `"fun_facts": []`; restored in `finally`.
- Twelve mutations, each reverted: blanked arrays, `reviewed: false`, `reviewed: "true"`, an extra key, a 15-char text, a 26-word sentence, the Wikipedia lead-sentence opener, `Köppen`/`per capita`, a text that never names its state, a duplicated text, four bad `source_url`s, both `normalize.ts` fold-in variants (unconditional `[]` reddened 102 tests), a force-added `fun-facts.review.json`, both docs reverted to pre-T-011 wording. Each reddened the matching test and nothing else; tree clean.

**Suites:** question-bank 243 pass + typecheck clean; frontend 184 pass + lint exit 0; backend 233 passed, 9 skipped.

**Three things for the reviewer:**
- `bun run lint` does not exist in `question-bank/`, which criterion 13's wording asks for — deliberate, recorded in `ci.yml`. Not blocked: the criterion's substance is fully verified; the wording defect belongs in the queue.
- `frontend` typecheck cannot run in this sandbox (npm mirror 403s on `us-atlas`/`topojson-client`/three `d3-*` packages) — not a regression, `git diff main...HEAD -- frontend/` is empty.
- The worker's deleted `question-bank/sample-data/fun-facts.review.json` — forced by criterion 2, but the call is the reviewer's.

**What this verdict does not say, stated plainly.** No test checks whether a fact is true, whether its `source_url` supports it, or whether it reads well to a nine-year-old. All seven Review-checklist boxes are open, and the drafting model was Sonnet rather than Opus (recorded in the Handoff). **Four facts flagged as likely overstated rather than wrong**, for whoever reads the Handoff next: Nevada (endorheic drainage is a Great Basin fact, not whole-state), Maine (first US sunrise holds for the contiguous 48, and only part of the year), Rhode Island (coastline is usually cited 384-400 miles, check the figure used), Louisiana (delta land-building versus the state's current net coastal *loss*). Merging this PR without a named human reading all 50 ships unreviewed text to children.

## Orchestrator checkpoint — 2026-09-14 (round 3)

The tester pushed its own commit (`19027c6`) successfully. Confirmed `git log
origin/task/T-011-review-fun-facts -1` matches local HEAD.

G5 check: `Status` changed from `awaiting verification` to `pass`; `Next step`
changed from `tester` to `reviewer`. Not a stall — the header moved.

## Round 4 — reviewer — 2026-09-14

`Next step` on entry: `reviewer` → on exit: *(none — approved and escalated; the brief is deleted)*

Session: `cse_01NqBhtxscKupMdww97kUauJ`

**Approved and escalated. PR #41 is ready for review, swept, and waiting on Dkaattae — it must not merge until a person reads the 50 facts.** No blocking findings; the escalation is D-4a's category, not a defect. Pushed `9cce42f` to `task/T-011-review-fun-facts`, all six CI jobs green on that commit. Draft flag now `false`. The reviewer holds no merge tool and did not merge.

**Checks run:** every role's work is in the PR, no stranded commits (expander touched only `tasks/`+`tasks.md`; worker touched source/bank/docs; tester touched only its test file and the Verdict — no source). `fun_facts: curated.fun_facts ?? []` sits beside the existing curated fold-ins and always emits the key (what makes criterion 8 hold for a future blank state). Suite re-run: 243 pass in question-bank, typecheck clean.

**The five open flags from the tester, disposed of** (full text on the [PR review comment](https://github.com/Dkaattae/geo-discovery-zone/pull/41#issuecomment-5671048577)):
1. Deleting `sample-data/fun-facts.review.json` — confirmed forced by criterion 2, not optional.
2. `bun run lint` not existing in `question-bank/` — criterion 13 named a check that never existed. New **T-066**, which also carries the eslint dependency decision to Dkaattae.
3. `source_url` is each state's general Wikipedia article, not a per-claim citation — accepted, called out in the checklist as real work for the content read.
4. Sonnet drafted the facts, not Opus — not re-run; D-4a's human gate is the answer either way, stated at the top of the PR body.
5. Shared session id across roles — expected under an orchestrated run (D-3), tester handled it correctly. No action.

**The reviewer's own findings:** the live Wikipedia pass in `build.ts` drafts for every entity with a `wikipedia_title` regardless of whether a curated fact already exists, so a scheduled refresh would now dump 50 already-answered drafts on a human — amended into **T-063**. Non-queued notes for the content read: 14/50 facts open "`<State>` is home to …", 47/50 open with the state's name, 6 carry a four-digit year, two are about the Wright brothers, and the Handoff's "shortest fact, Hawaii at 59" is actually Kansas at 56.

**Sweep, pushed as `9cce42f`:** brief deleted; `tasks.md` T-011 entry deleted; `PROGRESS.md` logged under Completed tasks with where reality differed; T-050 no longer depends on T-011; T-064 shrank by the deleted review file; T-065 records the fourth and fifth hand-correction of a suite count (209 → 243); T-066 added (question-bank lint).

## Orchestrator checkpoint — 2026-09-14 (round 4, closing)

The reviewer pushed its own commit (`9cce42f`) successfully. Confirmed `git
log origin/task/T-011-review-fun-facts -1` matches local HEAD.

Per `.claude/agents/orchestrator.md` "The loop you run" — the reviewer marked
the PR ready (with an escalation) — this is where the orchestrator stops. No
brief remains to read a header from. PR #41 is Dkaattae's from here: read the
50 facts (the Review checklist and the four content flags round 3 raised),
then merge (D-4 — no role in this loop merges).
