# T-057 — `levels.py` claims to mirror a `levelWindow()` the client does not have

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-09-21, unattended run. See `runs/T-057-level-window-docstring.md`.
**From:** [`tasks.md`](../tasks.md) T-057
**Branch:** `claude/loving-franklin-su4qzl` — assigned to the expander's session by
its harness, so this is the task branch (`process.md`, "When the environment names
the branch for you"). Every later role pushes here, whatever branch it starts on;
`CLAUDE.md` "Branches" is the standing permission.
**PR:** #53 — draft, opened at expand time from the branch above, stays draft
until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-21 | 5992b640-9ccf-5259-8734-1034957823e2 |

## Goal

`backend/app/levels.py:60` documents `level_window()` as mirroring a
`levelWindow()` in the client, and no such function has ever existed. Settle what
is actually true about where the level window is computed, say it where the next
reader will find it, and — since the survey found the same "three or four
choices" promise is false at the top of the scale — make the promise true.

### What the survey already found (do not rebuild these)

Read this before writing code; three of the criteria below are already satisfied
and are stated only so they stay satisfied.

- **The client already has a level picker.** `frontend/src/components/screens.tsx`
  `Setup` (from line 366) renders the "How tricky?" buttons at 412–425, one per
  entry of `progress.suggestedLevels`, falling back to
  `[profile.lastSessionEndLevel]` at 383–385. So the queue entry's first branch —
  "the client lost a level picker" — is wrong: the picker is there, and it is the
  *arithmetic* that is server-only.
- **The window is server-computed and served.** `backend/app/serializers.py:143`
  puts `level_window(profile.last_session_end_level)` into `suggestedLevels` on
  `GET /profiles/{profileId}/progress`, and `openapi.yaml:1943` describes that
  field as "the three or four choices to show in the level picker". Nothing in
  `frontend/src` computes a window. `grep -rn levelWindow` over the tree matches
  only `backend/app/levels.py:63`, `tasks.md` and `PROGRESS.md`.
- **So the docstring is simply false**, and correcting it — not growing the client
  a picker — is this task.
- **`frontend/src/lib/level.ts` is still needed.** `suggestedLevels` is an array
  of bare numbers; the server's `LevelLabel` object comes only from the session
  endpoints. The Setup picker labels candidate levels the server never labelled
  (`screens.tsx:423`), as does the profile line at `screens.tsx:361` and
  `screens.tsx:195`. Criterion 8 records that; T-004's larger question about
  moving label formatting to the server stays open and out of scope.
- **`level_window` breaks its own documented rule at the top of the scale.**
  `level_window(18.0)` returns `[17.0, 18.0]` — **two** choices, not three or
  four — because `raw = [17, 18, 19, 20]` all clamp into `{17, 18}`.
  `level_window(17.5)` returns three (`[16.5, 17.5, 18.0]`). Both `levels.py`'s
  docstring and the contract promise three or four; only `level_window(6.0)` is
  under test today (`backend/tests/test_levels.py:93`), so nothing caught it.
  Criterion 4 closes that, by moving the code to the contract rather than the
  contract to the code.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

1. **The false name is gone everywhere it could mislead.** The string
   `levelWindow` (case-sensitive) appears in no tracked file under `backend/`,
   `frontend/`, `e2e/`, `question-bank/` or `fixtures/`, nor in `openapi.yaml`,
   `conventions.md` or `test-guidelines.md` — comments, docstrings and test names
   included. `PROGRESS.md`, `tasks.md`, `tasks/` and `runs/` are historical
   records and are exempt. Today the only match outside those exempt files is
   `backend/app/levels.py:63`.

2. **`level_window`'s docstring says where its result actually goes.** The
   docstring of `level_window` in `backend/app/levels.py` names the
   `suggestedLevels` field, and states that the client renders that list rather
   than computing a window of its own. No docstring or comment anywhere in
   `backend/app/levels.py` attributes a function to the client that
   `frontend/src/lib/level.ts` does not export.

3. **No window arithmetic appears in the client** (negative — already true, keep
   it true). No module under `frontend/src` derives a set of candidate levels
   from a level. The Setup screen's "How tricky?" options are exactly
   `progress.suggestedLevels` when that array is non-empty, and exactly the
   one-element list `[profile.lastSessionEndLevel]` when it is absent or empty.
   Already satisfied by `frontend/src/components/screens.tsx:383-385`; no test
   covers it today, so this criterion needs one.

4. **Three or four choices, at every level on the scale.** For every `L` in
   `{0.0, 0.5, 1.0, …, 17.5, 18.0}`, `level_window(L)` returns either 3 or 4
   values. The two boundaries this criterion exists for are `L = 17.5`, which
   returns 3 today and must stay ≥ 3, and `L = 18.0`, which returns 2 today and
   must not. This is the rule `openapi.yaml`'s `suggestedLevels` description
   already states — the code moves to the contract, and the contract is not
   edited (see Constraints).

5. **What it returns is well formed.** For every `L` in that same set, the list
   `level_window(L)` is sorted strictly ascending (so no duplicates), every value
   is ≥ `0.0` and ≤ `18.0`, every value is a multiple of `0.5`, and the list
   contains `clamp_level(L)` itself — the child is always offered the level they
   are on.

6. **Nothing moves in the middle of the scale.** `level_window(6.0)` is exactly
   `[5.0, 6.0, 7.0, 8.0]`, `max(level_window(2.0))` is `4.0`,
   `min(level_window(0.0))` is `0.0`, and `GET /profiles/{profileId}/progress`
   returns `suggestedLevels == [5.0, 6.0, 7.0, 8.0]` for a profile whose
   `lastSessionEndLevel` is `6.0`. The existing assertions at
   `backend/tests/test_levels.py:93-105` and
   `backend/tests/test_profiles_api.py:228` still pass, unedited.

7. **The claim cannot rot back.** Putting the sentence ``Mirrors `levelWindow()`
   in the client:`` back into `level_window`'s docstring turns at least one test
   in the repo red. That test reaches no network and spawns no server; it may
   read `frontend/src/lib/level.ts` from disk. (The tester checks this by
   mutation and reverts it.)

8. **The `level.ts` question is answered in writing.**
   `engineering-decisions.md` gains a new entry `E-10` — no existing `E-n` entry
   is modified — recording that the level window is computed on the server only,
   that `frontend/src/lib/level.ts` keeps existing, and why. It names
   `suggestedLevels`, `frontend/src/lib/level.ts`, and at least one call site
   that needs client-side label formatting (`frontend/src/components/screens.tsx`
   line 361, 423 or 195).

9. **The whole suite is green, not just the new tests** — the backend suite and
   the frontend suite both pass, along with `bun run typecheck` and
   `bun run lint` in `frontend/`. No test reaches the network, and no new
   dependency is added to any package.

## Out of scope

- **Giving the client its own window arithmetic, or any new UI.** The picker
  exists and is server-driven; that is the answer, not a gap.
- **Deleting or rewriting `frontend/src/lib/level.ts`**, and moving label
  formatting to the server. T-004 left that question open on purpose; if this
  task's survey changes the answer, write a new `tasks.md` entry rather than a
  commit here.
- **Editing `openapi.yaml`.** See Constraints — it is a human gate, not a
  judgement call.
- **`fixtures/level-labels.json`'s rows**, and the grade/band label functions on
  either side. Only the fixture's `_fixture` prose may be touched, and only if a
  sentence in it becomes false.
- **The arithmetic that *moves* a level** (`backend/app/grading.py`) and the
  session endpoints' `levelLabel` object.
- **The stale suite-size counts (T-065)**, `question-bank` lint (T-066) and the
  prettier drift (T-071). None of them ride along.

## Constraints

- **Files expected to change:** `backend/app/levels.py`,
  `backend/tests/test_levels.py` (or a new file alongside it),
  `engineering-decisions.md`, and one frontend test file for criterion 3. Nothing
  else. `backend/app/serializers.py:143` keeps calling `level_window` — the field
  stays server-computed.
- **`openapi.yaml` must not change.** The contract already documents the three-
  or-four rule, so this task moves the code to match it. If the worker concludes
  the *contract* is the thing that is wrong, that is a deliberate contract change
  (`CLAUDE.md`) and not a call the loop makes unattended: stop, write the
  reasoning into this brief, set `Status: blocked` and `Next step: human`, push,
  and do not edit the file.
- **`level_window`'s public behaviour may change only where clamping collapses
  the window** — the top of the scale. Criterion 6 pins the middle.
- **No new dependency** in any package without asking (`CLAUDE.md` "Packages").
- **No network in tests, and no test spawns a server to exercise a pure
  function** (`test-guidelines.md`, "Start below the transport"). Endpoint-level
  checks use the existing `httpx.ASGITransport` client fixture.
- **A bug fix gets a test that fails without the fix** (`CLAUDE.md` "Tests") —
  criterion 4's test must go red against today's `level_window`.
- Commands are in `conventions.md`; run the whole suite, not only what you
  touched.

## Context

**Required reading for the worker and the tester.**

- `backend/app/levels.py:60-68` — `level_window`, and the false docstring at
  line 63.
- `backend/app/serializers.py:143` — where the window becomes `suggestedLevels`.
- `openapi.yaml:1943` — `ProfileProgress.suggestedLevels`, the contract's
  statement of the three-or-four rule. **Read before judging criterion 4.**
- `frontend/src/components/screens.tsx:361`, `366-425` — the profile line and the
  `Setup` picker, including the fallback at 383-385 and `levelLabel(option)` at
  423.
- `frontend/src/lib/level.ts` — display-only formatting, and its header comment
  about where the arithmetic lives.
- `backend/tests/test_levels.py:93-105` and `backend/tests/test_profiles_api.py:228`
  — the assertions criterion 6 protects.
- `fixtures/level-labels.json`, `_fixture` block — why the two sides are pinned
  together, and what that pin deliberately does not cover.
- `engineering-decisions.md` — `E-9` is the last entry; criterion 8 adds `E-10`
  in the same shape.
- `tasks.md` T-057 (the queue entry) and `PROGRESS.md`'s T-004 entry, where the
  finding came from.
- `test-guidelines.md` and `conventions.md` — how tests are written here and how
  the suites are run.

## Review checklist — non-testable parts only

Criteria 1–9 are testable. These are the two judgements a human should make on
the PR, because no test can:

- [ ] The rewritten `level_window` docstring is true of the code that ships, and
      a reader who has never seen this task would not have to grep to find where
      the window is used.
- [ ] `E-10` explains the decision rather than restating it, and would still make
      sense to someone reading it in six months.

## Handoff

Written by `worker` before the tester runs.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes
