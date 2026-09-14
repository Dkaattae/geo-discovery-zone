# T-011 — Review the 50 draft fun facts — run log

**Task:** T-011 · **Branch:** `task/T-011-review-fun-facts` · **PR:** [#41](https://github.com/Dkaattae/geo-discovery-zone/pull/41)
**Started:** 2026-09-14 · **Outcome:** in progress

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
