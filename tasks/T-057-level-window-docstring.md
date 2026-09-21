# T-057 — `levels.py` claims to mirror a `levelWindow()` the client does not have

**Status:** `awaiting verification`
**Next step:** `tester`
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
| worker | 2026-09-21 | cse_01VNvekndCsNWvPYSNudz67b |

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

**TL;DR:** `level_window`'s false docstring is rewritten, the top-of-scale
collapse (2 choices at `L=18.0`) is fixed by extending the window downward
when clamping eats the top, `E-10` is written, and a new frontend test covers
criterion 3's already-true behaviour. Backend suite: 324 passed, 9 skipped.
Frontend suite: 203 passed (198 pre-existing + 5 new), lint clean. `bun run
typecheck` fails on `UsMap.tsx` for a reason unrelated to this task — see
"What I did not do" below; confirmed identical on the pre-worker tree.

### Files changed

- **`backend/app/levels.py`** — `level_window`'s body and docstring.
  - Docstring rewritten: names `suggestedLevels`, `app/serializers.py`, and
    `Setup` in `screens.tsx` as where the result goes and who renders it
    as-is; states `level.ts` only formats a level the server already sent and
    has never computed one. No function name in the module is attributed to
    the client that `level.ts` does not export (criterion 2).
  - Algorithm changed only where clamping collapses the window. The old
    version built the four raw offsets `{-1, 0, +1, +2}`, rounded and clamped
    each to `[0, 18]`, and deduped via a set — at `current = 18.0` three of
    the four offsets clamp to `18.0` itself, leaving only `{17.0, 18.0}`, two
    values. The fix keeps the same four offsets, then — only if the deduped
    set still has fewer than three members — extends downward one half-step
    at a time (`-2`, `-3`, …) until it reaches three, or until extending
    further stops changing the set (the bottom of the scale, not reachable
    today since `MAX_LEVEL - MIN_LEVEL = 18` is far bigger than the window).
    Verified by hand that `level_window(L)` for every `L` in
    `{0.0, 0.5, …, 18.0}` now returns 3 or 4 well-formed values; the middle of
    the scale (`6.0`, `2.0`, `0.0`) is untouched — see the criterion-6 pins
    below.
- **`backend/tests/test_levels.py`** — new tests, nothing removed or edited
  in the existing ones.
  - `test_level_window_offers_three_or_four_choices_at_every_level_on_the_scale`
    (criterion 4, parametrised over all 37 half-integers 0.0–18.0). This is
    the bug-fix test `CLAUDE.md` "Tests" requires: it fails against
    today's (pre-fix) code at `L=18.0`, where the old implementation
    returned exactly 2.
  - `test_level_window_stays_at_least_three_choices_at_the_boundaries_criterion_4_names`
    — the two boundaries the brief names explicitly, `17.5` (already 3, must
    not regress) and `18.0` (was 2, must not stay 2).
  - `test_level_window_is_well_formed_at_every_level_on_the_scale` (criterion
    5, same 37-value parametrisation): sorted ascending with no duplicates,
    bounds, half-integer steps, and `clamp_level(L)` is always a member.
  - `test_level_window_docstring_names_no_client_function_the_client_does_not_have`
    (criteria 2 and 7): reads `level_window.__doc__`, extracts every
    `` `name()` `` mention, reads `frontend/src/lib/level.ts`'s exports off
    disk (no network, no server), and asserts every mentioned name is one of
    them. I hand-verified criterion 7 directly: temporarily reinserting the
    deleted sentence (worded here without repeating the banned string, to
    keep criterion 1 satisfied inside this very file's comments) turned this
    test red with `AssertionError: level_window's docstring names
    ['<the deleted name>'] as a client function, but ... exports only
    [...]`, then restored the file and reran green. Net diff after the
    restore was exactly my intended change (verified with `git diff --stat`).
- **`engineering-decisions.md`** — new `E-10` entry appended at the end, after
  `E-9`; no existing entry touched. States the window is server-only, that
  `level.ts` stays and why (formats `suggestedLevels` for `Setup`'s "How
  tricky?" buttons at `screens.tsx:423`, the profile line at `:361`, and the
  profile picker at `:195`), and leaves T-004's label-formatting question
  explicitly open for later.
- **`frontend/src/components/screens.criteria.test.tsx`** (new file) —
  criterion 3. Renders `Setup` with `react-dom/server`'s
  `renderToStaticMarkup` (already a dependency; no jsdom, no
  `@testing-library/react`, no new package) and reads the "How tricky?"
  option buttons back out of the static HTML. Five cases: a 4-element
  `suggestedLevels` renders exactly those four in order; a 2-element one (the
  top-of-scale shape) renders exactly two; an empty array and an `undefined`
  `progress` both fall back to exactly `[profile.lastSessionEndLevel]`; and
  the fallback is always length 1, never a computed set.

### Criteria — where each lives now

| # | Verdict | Evidence |
|---|---|---|
| 1 | done | `grep -rn levelWindow backend frontend/src e2e question-bank fixtures openapi.yaml conventions.md test-guidelines.md` returns nothing (checked after every edit, including inside my own new test's comments). |
| 2 | done | `level_window`'s docstring in `backend/app/levels.py`; enforced by the new test above. |
| 3 | done (already true) | `screens.tsx:383-385`, unedited; new coverage in `screens.criteria.test.tsx`. |
| 4 | done | New algorithm in `level_window`; parametrised test over all 37 scale values, plus the two named boundaries. |
| 5 | done | Same parametrised test (`test_level_window_is_well_formed_at_every_level_on_the_scale`). |
| 6 | done (unedited) | `backend/tests/test_levels.py:108-116` (old line numbers; content unchanged) and `backend/tests/test_profiles_api.py:228` both still pass verbatim — reran both explicitly. |
| 7 | done | Mutation hand-verified as described above; not left for the tester to discover blind. |
| 8 | done | `engineering-decisions.md` `E-10`. |
| 9 | done, with one caveat below | See "Test runs" below. |

### What I did not do, and why

- **Did not touch `openapi.yaml`, `screens.tsx`, `level.ts`, `serializers.py`,
  or `fixtures/level-labels.json`** — all out of scope or already correct per
  the brief's survey.
- **Did not add `@testing-library/react` or jsdom.** No DOM testing library is
  in `package.json`, and adding one is a dependency decision `CLAUDE.md`
  reserves for a human. `react-dom/server`'s `renderToStaticMarkup` — already
  a transitive dependency of every screen component — was enough to cover
  criterion 3's actual claim (which options render, in which order) without
  a DOM at all.
- **A caveat on criterion 9, not a gap I created:** `bun run typecheck` fails
  in this sandbox with four pre-existing errors, all in `UsMap.tsx`
  (`Cannot find module 'react-simple-maps'`, `Cannot find module
  'us-atlas/states-10m.json'`, plus two `implicit any` errors that follow from
  those). This sandbox's `bun install` cannot reach the npm registry mirror
  for those two packages (`403` on every `d3-*`/`react-simple-maps`/`us-atlas`
  tarball — an outbound network restriction of this environment, not a
  dependency I touched). I confirmed the failure is identical on the
  pre-worker tree: `git stash -u`, ran `bun run typecheck`, got byte-identical
  output, then `git stash pop`. `UsMap.tsx` is untouched by this task and
  `Setup` (which my new test renders) does not import it directly — `screens.tsx`
  does, at module scope, so any test importing anything from that file pulls
  `UsMap` in transitively. To actually run my new test file and the frontend
  suite end-to-end, I stubbed `react-simple-maps` and `us-atlas` locally under
  `node_modules/` (a two-function fake module and an empty topology JSON),
  confirmed 203/203 tests pass and `bun run lint` is clean, then **deleted the
  stub before finishing** — `node_modules/` is gitignored, nothing here is
  committed, and `git status` shows only the four files above. The tester
  will hit the same missing-package wall if this sandbox is the same one; if
  CI or the tester's environment has full registry access, `bun run typecheck`
  should be clean of everything except (if unfixed elsewhere) this same
  pre-existing pair. Flagging this for the **tester to confirm** whether their
  environment has registry access — if it does, this caveat evaporates; if it
  doesn't, the tester needs the same stub-and-delete workaround to exercise
  the new test file, or should judge criterion 9 against `bun test` and
  `bun run lint` alone and treat the `UsMap.tsx` typecheck errors as a
  pre-existing, out-of-scope environment gap (worth its own `tasks.md` entry
  if it recurs, not a T-057 fix).

### Test runs (this session)

- `cd backend && uv run pytest -q` — 324 passed, 9 skipped (up from 248
  passed, 9 skipped before my changes; the delta is exactly the new tests).
- `cd frontend && bun test` — 203 passed (198 before, 5 new), with the
  `react-simple-maps`/`us-atlas` stub in place as described above; without
  it, exactly one file errors on import (`screens.criteria.test.tsx`, via
  `screens.tsx` → `UsMap.tsx`) and the other 198 still pass.
- `cd frontend && bun run lint` — clean, `--max-warnings 0`.
- `cd frontend && bun run typecheck` — fails only on the pre-existing
  `UsMap.tsx` errors described above; identical to the pre-worker tree.

### How to run what I touched

- Backend: `cd backend && uv run pytest tests/test_levels.py -v` (or the whole
  suite with `uv run pytest -q`).
- Frontend: `cd frontend && bun test src/components/screens.criteria.test.tsx`
  — needs the registry-access caveat above if `node_modules/react-simple-maps`
  or `node_modules/us-atlas` are missing in this sandbox.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

- **Surprise:** the top-of-scale collapse the brief flagged was the *only*
  failure across all 37 half-integer levels — I checked every one by hand
  (`uv run python -c ...` sweep) before writing the parametrised tests, and
  `L=18.0` was the sole offender under the old algorithm. The fix (extend
  downward when the top collapses) is a small, local change; nothing in the
  middle of the scale needed to move, matching the brief's constraint.
- **Decision:** rather than special-casing `current == MAX_LEVEL`, I wrote a
  general "extend until 3 distinct values or no further progress" loop. It's
  a few more lines than a special case, but it can't silently stop working if
  `MAX_LEVEL`/`MIN_LEVEL` or the window shape ever change — reviewer may
  prefer the special case for readability; either is fine, tester's call
  whether to flag it, reviewer decides if it comes up.
- **Environment gap found, not caused:** this sandbox's `bun install` cannot
  reach the npm registry for `react-simple-maps`, `us-atlas`, and their `d3-*`
  transitive deps (403 from the proxy-gated mirror), which pre-existing breaks
  `bun run typecheck` on `UsMap.tsx` regardless of this task. I did not file a
  new `tasks.md` entry for it since it may be specific to this sandbox
  instance rather than the repo's CI (which likely has full registry access);
  flagging it here for whoever verifies next to confirm one way or the other,
  and to open a `tasks.md` entry only if it turns out to be a persistent CI
  problem rather than a one-off sandbox restriction.
- **Judgment call, needs a named owner:** criterion 3's test renders a real
  React component via `react-dom/server` rather than doing a purely
  source-level/regex check (the style used by `lint-gate.test.ts` and
  similar files for behaviour that isn't a pure function). I chose the render
  because it actually exercises the JSX logic instead of pattern-matching the
  source text, and it needed no new dependency. Reviewer to confirm this
  matches the repo's testing conventions closely enough, or push back if a
  source-level check was intended instead — either way it's a call about
  house style, not about whether criterion 3 is met.
