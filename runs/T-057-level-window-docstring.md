# T-057 — `levels.py` claims to mirror a `levelWindow()` the client does not have — run log

**Task:** T-057 · **Branch:** `claude/loving-franklin-su4qzl` · **PR:** #53
**Started:** 2026-09-21 · **Outcome:** in progress

## Round 2 — worker — 2026-09-21
`Next step` on entry: `worker` → on exit: `tester`

T-057 worker done. Branch `claude/loving-franklin-su4qzl` pushed at commit `7fad9e3` (confirmed via `git log origin/claude/loving-franklin-su4qzl -1`). Status set to `awaiting verification`, Next step `tester`.

**What changed:**
- `backend/app/levels.py` — rewrote `level_window`'s false docstring (no longer claims to mirror a client `levelWindow()`; names `suggestedLevels`, `serializers.py`, and `screens.tsx`'s `Setup` instead) and fixed the top-of-scale bug: `level_window(18.0)` returned 2 choices before, now extends the window downward whenever clamping collapses it, verified across all 37 half-integer levels 0.0–18.0.
- `backend/tests/test_levels.py` — added parametrized tests for criteria 4 and 5 (3-or-4 choices, well-formedness, at every scale value), plus a docstring/exports cross-check test for criteria 2 and 7. I hand-verified criterion 7 by temporarily reinserting the deleted sentence, confirming the test goes red, then restoring the file.
- `engineering-decisions.md` — new `E-10` entry (criterion 8), no existing entry touched.
- `frontend/src/components/screens.criteria.test.tsx` (new) — criterion 3, rendering `Setup` via `react-dom/server`'s `renderToStaticMarkup` (no new dependency) and reading the "How tricky?" option buttons out of the static markup.

**All 9 acceptance criteria addressed** — full criterion → evidence table is in the brief's Handoff section.

**Test results:** backend `uv run pytest -q` → 324 passed, 9 skipped. Frontend `bun test` → 203 passed, `bun run lint` clean.

**One flagged environment gap, not caused by this task:** `bun run typecheck` fails on 4 pre-existing errors in `UsMap.tsx` (`react-simple-maps`/`us-atlas` unresolvable) because this sandbox's `bun install` gets 403s from the npm registry mirror for those packages and their `d3-*` transitive deps. Confirmed via `git stash` that this is byte-identical on the pre-worker tree — not something I introduced. To actually exercise my new frontend test file (which transitively imports `screens.tsx` → `UsMap.tsx`), I temporarily stubbed those two packages under `node_modules/` for local verification only, then deleted the stub before finishing (`node_modules/` is gitignored; `git status` shows only the 5 intended files committed). Flagged in the brief's Handoff and Notes for the tester to confirm whether their environment has full registry access — if not, they'll need the same stub-and-delete workaround, or should judge criterion 9 against `bun test`/`bun run lint` alone and treat the `UsMap.tsx` typecheck errors as a pre-existing, out-of-scope gap.

**One judgment call flagged for reviewer** (named in brief Notes): criterion 3's test renders a real component via `react-dom/server` rather than doing a source-level regex check (the style `lint-gate.test.ts` uses for non-pure-function behaviour). I judged the render more faithful to what the criterion actually claims; reviewer should confirm this fits house style or push back — it's a style question, not a criterion-3-met-or-not question.

Full details, file-by-file diff description, and the exact verification commands are in `tasks/T-057-level-window-docstring.md` under `## Handoff` and `## Notes`.

## Round 1 — task-expander — 2026-09-21
`Next step` on entry: `(no brief)` → on exit: `worker`

**T-057 expanded, pushed, draft PR #53 open — waiting on a human approval before the worker can start.**

- **Picked T-057** (`levels.py` claims to mirror a `levelWindow()` the client does not have), the first §A entry whose dependencies are done. T-066 and T-060 were skipped — both already carry "Skipped by the expander, 2026-09-19" notes because each is wholly a decision reserved for Dkaattae (a dependency call, and whether to turn a bot loose).
- **`tasks/` was empty** (only `README.md` and `TEMPLATE.md`) — last cycle's sweep was done, nothing to clean up.
- **Status:** `awaiting approval` · **Next step:** `worker` · **Approved:** `pending`.

## What was produced

| Item | Where |
|---|---|
| Brief | `/home/user/geo-discovery-zone/tasks/T-057-level-window-docstring.md` |
| Queue marker | `/home/user/geo-discovery-zone/tasks.md` — T-057 now `doing`, with the survey findings recorded |
| Branch | `claude/loving-franklin-su4qzl` (session-assigned; recorded in the brief's `Branch:` header) |
| PR | https://github.com/Dkaattae/geo-discovery-zone/pull/53 — draft, base `main` |
| Commits | `cf47ad7` brief, `12febc0` PR number — both confirmed on `origin/claude/loving-franklin-su4qzl` |

Diff against `main` touches **only** `tasks.md` and `tasks/` (229 insertions, 1 deletion) — no source, tests or config, per `process.md`'s expander envelope. I ran no build, test suite or pipeline.

## Two findings from the survey that shaped the criteria

- **The queue entry's either/or was wrong.** It assumed "the client lost a level picker" or "the docstring describes a function that never existed". Neither: the client **has** a picker — `frontend/src/components/screens.tsx:366-425` renders one button per entry of `progress.suggestedLevels`, falling back to `[profile.lastSessionEndLevel]` at 383-385 — it just never computes the window. `backend/app/serializers.py:143` serves it. So the docstring is false, nothing needs growing in the client, and no product decision is required. That is why the task was expandable at all.
- **The same function breaks a second, live promise.** `level_window(18.0)` returns `[17.0, 18.0]` — **two** choices — because `raw = [17, 18, 19, 20]` all clamp into `{17, 18}`. Both the docstring and `openapi.yaml:1943` ("the three or four choices to show in the level picker") say three or four. Only `level_window(6.0)` is asserted today (`backend/tests/test_levels.py:93`), so nothing caught it. Criterion 4 closes it by moving the **code** to the contract, and the brief forbids editing `openapi.yaml` — if the worker concludes the contract is what is wrong, it must stop with `Status: blocked` / `Next step: human`, since a contract change is a human gate under `CLAUDE.md`.

## Criteria shape

Nine criteria. 1–2 correct the false claim and say where the window really goes; 3 is a negative guard (no window arithmetic in the client — already true at `screens.tsx:383-385`, untested, so it needs a test); 4–6 bound the behaviour (3–4 choices at every `L` in 0.0–18.0 step 0.5, naming 17.5 and 18.0 explicitly; well-formedness; the middle of the scale pinned unchanged); 7 is anti-rot, stated as a mutation the tester performs; 8 answers the entry's "say whether `level.ts` keeps existing" as an `E-10` entry in `engineering-decisions.md` (it does keep existing — `suggestedLevels` carries bare numbers, so the picker must label them locally); 9 is the suite/no-network/no-dependency floor. A two-item Review checklist covers the prose quality no test can judge.

## What a human has to do

1. Approve on PR #53, replacing `Approved: pending` in the brief with a name and date. The worker refuses to start while it says `pending`.
2. Then run the `worker` on branch `claude/loving-franklin-su4qzl`.

Note for an unattended run: the orchestrator stamps `Approved: orchestrator — <date>, unattended run` instead, per `process.md`.
