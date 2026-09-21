# T-057 — `levels.py` claims to mirror a `levelWindow()` the client does not have — run log

**Task:** T-057 · **Branch:** `claude/loving-franklin-su4qzl` · **PR:** #53
**Started:** 2026-09-21 · **Outcome:** in progress

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
