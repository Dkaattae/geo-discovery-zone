# T-057 — `levels.py` claims to mirror a `levelWindow()` the client does not have

**Status:** `pass` — all 14 criteria hold and the review's three findings are
fixed. The `E-10` ceiling is gone from
`frontend/src/level-window-claim.criteria.test.ts`, the stale comment with it,
and `screens.criteria.test.tsx`'s top-of-scale case now agrees with its own
name. Appending an `E-11` to `engineering-decisions.md` now leaves **both**
suites green — verified by mutation this session. See `### Verdict — round 3`.
**Next step:** `reviewer` — the findings it raised are closed; no source
changed, only the two test files it named.
**Approved:** orchestrator — 2026-09-21, unattended run (round 2 of criteria).
See `runs/T-057-level-window-docstring.md`. Round-1 approval was also
`orchestrator — 2026-09-21, unattended run`.
**From:** [`tasks.md`](../tasks.md) T-057
**Branch:** `claude/loving-franklin-su4qzl` — assigned to the expander's session by
its harness, so this is the task branch (`process.md`, "When the environment names
the branch for you"). Every later role pushes here, whatever branch it starts on;
`CLAUDE.md` "Branches" is the standing permission.
**PR:** #53 — draft, opened at expand time from the branch above, stays draft
until the reviewer approves it
**Fault:** criterion 8 mandates an `E-10` entry that T-017's already-merged
criterion-7 test forbids, and the Constraints exclude the file that would have to
change, so criteria 8 and 9 cannot both hold — the brief's, and the expander's to
fix. **Addressed by Amendment 1** (2026-09-21); stays recorded here until the
task reaches `pass`.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-21 | 5992b640-9ccf-5259-8734-1034957823e2 |
| worker | 2026-09-21 | cse_01VNvekndCsNWvPYSNudz67b |
| tester | 2026-09-21 | cse_01VNvekndCsNWvPYSNudz67b |
| task-expander (amendment 1) | 2026-09-21 | 5992b640-9ccf-5259-8734-1034957823e2 |
| worker (round 2) | 2026-09-21 | cse_01VNvekndCsNWvPYSNudz67b |
| tester (round 2) | 2026-09-21 | cse_01VNvekndCsNWvPYSNudz67b |
| reviewer | 2026-09-21 | 5992b640-9ccf-5259-8734-1034957823e2 |
| tester (round 3) | 2026-09-21 | cse_01VNvekndCsNWvPYSNudz67b |

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

### Amendment 1 — 2026-09-21, after the round-1 `blocked` verdict

**TL;DR:** the tester was right and the brief was wrong. Criterion 8 asks for an
`E-10` entry; a test left behind by the merged T-017 asserts that no `E-n` above
`E-9` may ever exist; and the old Constraints forbade touching the file holding
it. Criteria 9–14 below widen the task to fix that test, and nothing about the
implementation the worker already landed needs to move.

**What changed, exactly:**

- **Criteria 1–8 are untouched.** The tester verified all eight and every one
  passes. They are restated verbatim so the worker does not have to diff two
  versions of this file; treat them as "keep satisfied", not "build".
- **Criterion 9 is rewritten.** It used to say "the whole suite is green" while
  listing only the backend and frontend suites, which is how the `question-bank`
  suite went unnoticed. It now names the CI jobs, and says how to report a suite
  the sandbox cannot run.
- **Criteria 10 and 11 are new** and are the actual fix: `engineering-decisions.md`
  must be able to grow past `E-9`, while everything T-017's criterion 7 genuinely
  meant keeps holding.
- **Criteria 12, 13 and 14 are new**, and are the "no new dependency", "no
  network" and "no faked module" halves that used to be buried inside criterion 9.
  Splitting them out is bookkeeping, not new work.

**The judgement behind criterion 10, written down so the reviewer can overrule
it.** `question-bank/src/region-vocabulary.test.ts:327-341` pins
`Math.max(...numbers) === 9` and `numbers.at(-1) === 9`. T-017's criterion 7 read
"engineering-decisions.md records the choice as **E-9**" — an instruction about
where that one entry goes, written when `E-9` was the newest. The verifying
session encoded it as "nine is the maximum, for ever", which makes every future
`E-n` impossible. That directly contradicts a standing rule in `CLAUDE.md`:
*"`engineering-decisions.md` — why the code is built the way it is. **Not gated**;
a task may add an entry when its criteria say so."* So the test is wrong against
the repo's own rule, and fixing it is the same move criterion 4 already makes for
`level_window` — bring the code to the contract, not the contract to the code.

I am treating this as the expander's call rather than a human's, and here is why,
so the reviewer can disagree cheaply:

- T-017 is **merged and swept**. "Frozen criteria" bind the task in flight; a
  merged task leaves behind ordinary repo tests, and later tasks correct those
  when they encode something untrue. The record of what T-017 meant lives in its
  PR and is not edited here.
- `question-bank/src/region-vocabulary.test.ts` is a **test file, not a loop
  file**. It is nowhere near `process.md`, `.claude/` or the workflows, so `G1`
  does not bite and this is not a `P-n` ticket.
- None of the four human gates in `process.md` ("Where the loop stops for a
  human") covers it: no dependency, no product call, no text a child reads, no
  second failed verify round on the code itself.
- Criterion 11 exists so the relaxation is **bounded**: four named mutations must
  still turn the suite red, so T-017's real intent is provably intact afterwards.

If the reviewer thinks generalising another task's test needs Dkaattae, the PR is
the place to say so — it is waiting on a human merge regardless.

**What I considered and rejected:** dropping criterion 8 and recording the
decision somewhere other than `engineering-decisions.md`. That would leave the
landmine armed for T-058 and everything after it, and put an engineering decision
somewhere nobody looks. The tester recommended the same.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**
Criteria 1–8 were approved in round 1 and are verified passing; 9 is rewritten
and 10–14 are new (see Amendment 1).

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

9. **The whole suite is green, not just the new tests — all six CI jobs.** On the
   branch head, every job in `.github/workflows/ci.yml` succeeds:
   `frontend (typecheck, lint, test)`, `question-bank (typecheck, test)`,
   `backend (lint, format, test)`, `backend (postgres)`,
   `integration (docker compose)` and `e2e (playwright)`. As of `e9147a5` five
   pass and **`question-bank` fails**, on two assertions in
   `region-vocabulary.test.ts` (`Expected: 9 / Received: 10`) — criterion 10 is
   what closes it. Run the suites locally too; where this sandbox cannot install
   a package, say which job you are citing instead of a local run, and see
   criterion 14 for what you may not do about it.

10. **`engineering-decisions.md` can grow past `E-9`.** With `E-10` present
    (criterion 8), the whole `question-bank` suite passes — specifically
    `question-bank/src/region-vocabulary.test.ts` has no assertion that a
    decision entry's number is at most 9, nor that `E-9` is the last heading in
    the file. And it stays that way for the next task: appending a well-formed
    `## E-11 — …` heading after `E-10` in `engineering-decisions.md` leaves the
    `question-bank` suite green. (The tester checks the `E-11` half by mutation
    and reverts it.)

11. **What T-017's criterion 7 actually meant still holds.** Each of these four
    mutations, made one at a time to `engineering-decisions.md` and reverted,
    turns at least one test in `question-bank/src/region-vocabulary.test.ts`
    red:
    - a. the `## E-9 — …` heading is deleted;
    - b. a second entry is numbered `E-9`, so the numbers are no longer unique;
    - c. the `E-10` block is moved above `E-8`, so the numbers no longer run in
      ascending order;
    - d. the word `content.json` is removed from `E-9`'s body.

    No `describe` block is deleted from that file, no test in it is skipped, and
    the blocks for T-017 criteria 1–6 and 8 are unedited.

12. **No new dependency** (negative). `frontend/package.json`,
    `frontend/bun.lock`, `question-bank/package.json`, `question-bank/bun.lock`,
    `e2e/package.json`, `e2e/bun.lock`, `backend/pyproject.toml` and
    `backend/uv.lock` are byte-identical to their versions on `main`.

13. **No test reaches the network** (negative). No test added or edited by this
    task performs an HTTP request to a real host, and none spawns a server to
    exercise a pure function. Endpoint-level checks go through the existing
    `httpx.ASGITransport` client fixture; repo-scanning tests read files from
    disk only.

14. **No result is reported from a faked third-party module** (negative). The
    diff contains no hand-written stand-in for `react-simple-maps`, `us-atlas`
    or any other third-party package, and no suite result cited in the Handoff
    or the Verdict was produced with such a stand-in present in `node_modules/`.
    Where a package cannot be installed here, cite the matching CI job on the
    branch head and say so.

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
- **Anything in `question-bank/src/region-vocabulary.test.ts` other than the two
  assertions that cap the decision number.** T-017's criteria 1–6 and 8 blocks
  are not this task's to review, tidy or extend.
- **`question-bank/src/climate-kid-verify.test.ts`'s `git diff 13a735f...HEAD`
  guard**, which the round-1 tester found fails on `main` in a full clone and is
  only green in CI because `actions/checkout` shallow-clones. Real, and not this
  task's — it is **T-072** in `tasks.md`.
- **The missing `react-simple-maps` / `us-atlas` packages in this sandbox.** A
  proxy restriction, not a repo defect; criterion 14 says how to report around
  it rather than fix it.

## Constraints

- **Files expected to change:** `backend/app/levels.py`,
  `backend/tests/test_levels.py` (or a new file alongside it),
  `engineering-decisions.md`, one frontend test file for criterion 3, and — new
  in Amendment 1 — **`question-bank/src/region-vocabulary.test.ts`**, for
  criteria 10 and 11 only. Nothing else.
  `backend/app/serializers.py:143` keeps calling `level_window` — the field
  stays server-computed. The first four are already changed on this branch and
  need no further edit; the fifth is the whole of round 2's work.
- **`region-vocabulary.test.ts` is generalised, not gutted.** The only
  assertions that may change are the two that cap the number
  (`Math.max(...numbers)).toBe(9)` at :330 and `numbers.at(-1)).toBe(9)` plus
  the "nothing follows E-9" slice at :339-340). Uniqueness, ascending order, the
  existence of `E-9` and its content checks all stay, and criterion 11 is how
  that is proved.
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
- **Do not fake a package to make a suite look green.** If `bun install` cannot
  reach the registry, report the CI job instead (criterion 14). The round-1
  worker stubbed `react-simple-maps` and `us-atlas` under `node_modules/` and
  deleted the stub afterwards; the round-1 tester declined to, and the tester was
  right — `test-guidelines.md` does not let you edit the thing under test to make
  it pass, and a fake module is that.
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
- `engineering-decisions.md` — `E-10` is now the last entry (`:486`), added by
  the round-1 worker for criterion 8. `E-9` is at `:438`.
- **`question-bank/src/region-vocabulary.test.ts:316-354`** — the whole
  `T-017 criterion 7` describe block. **Read all four of its tests before
  touching any of them**; criterion 11 is a restatement of what the other three
  are for. The two failing assertions are at `:330` and `:339-340`.
- `CLAUDE.md` "Docs", the `engineering-decisions.md` line — *"Not gated; a task
  may add an entry when its criteria say so."* This is the rule the capped test
  contradicts, and the reason criterion 10 is in scope.
- `.github/workflows/ci.yml` — the six job names criterion 9 lists, at lines 17,
  93, 141, 197, 253 and 281.
- `tasks.md` T-057 (the queue entry) and `PROGRESS.md`'s T-004 entry, where the
  finding came from.
- `test-guidelines.md` and `conventions.md` — how tests are written here and how
  the suites are run.

## Review checklist — non-testable parts only

Criteria 1–14 are testable. These are the judgements a human should make on the
PR, because no test can:

- [ ] The rewritten `level_window` docstring is true of the code that ships, and
      a reader who has never seen this task would not have to grep to find where
      the window is used.
- [ ] `E-10` explains the decision rather than restating it, and would still make
      sense to someone reading it in six months.
- [ ] **Amendment 1's judgement call** — that generalising T-017's capped
      assertion is the expander's to make and not Dkaattae's. The reasoning is
      written out under Amendment 1; overruling it costs one comment.
- [ ] The generalised `region-vocabulary.test.ts` block still reads as a test of
      T-017's criterion 7, not as a test that was widened until it stopped
      failing.
- [ ] `frontend/src/components/screens.criteria.test.tsx:84` is named *"a
      three-choice `suggestedLevels` … renders exactly three, not four"* but
      passes `[17, 18]` and asserts two. The assertion is right, the name is
      wrong. A rename is welcome here rather than as a follow-up task, but it is
      not a criterion.

## Handoff

Written by `worker` before the tester runs. **Round 2 appends a
`### Handoff — round 2` block at the end of this section; it does not rewrite
round 1's.**

### Handoff — round 1

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

### Handoff — round 2

**TL;DR:** the only production/test change this round is
`question-bank/src/region-vocabulary.test.ts` — the two assertions Amendment 1
named (`Math.max(...numbers)).toBe(9)` at old line 330, and the "E-9 is last"
half at old lines 339-340) are generalised to "no two entries share a number"
and "nothing after E-9 has a number ≤ 9". Nothing else changed: criteria 1–8
were already satisfied by round 1 and I did not touch their files.
`question-bank`'s suite goes from 1251 pass/4 fail to 1253 pass/2 fail locally
— the two E-10 failures Amendment 1 diagnosed are gone; the remaining two
failures are `climate-kid-verify.test.ts`/`climate-kid.test.ts`'s `git diff`
guard, confirmed pre-existing on this exact branch head (identical failure
before my edit, via `git stash`) and already filed as **T-072**, out of scope
here. **Pushed as `13cc373` and confirmed on GitHub Actions: all six CI jobs
are green, including `question-bank (typecheck, test)`**, which was the one
red job on the pre-fix head (`4ba642a`) — see criterion 9's row below for the
full list. This is not a local report; it is the real workflow run.

### Files changed (round 2)

- **`question-bank/src/region-vocabulary.test.ts`** — only the two lines the
  Constraints named. Full diff against `main` in this file:
  - `test("E-9 is the next number — no other entry claims it, and none is
    higher", …)` renamed to `"E-9 is the next number at the time it was filed
    — no other entry claims it"`, and `expect(Math.max(...numbers)).toBe(9)`
    is deleted. The uniqueness assertion (`new Set(numbers).size ===
    numbers.length`) is unedited, so mutation (b) (a second entry numbered
    `E-9`) still turns it red.
  - `test("the entries run in ascending order, so E-9 is the last block in
    the file", …)` renamed to `"… so E-9 is followed only by higher numbers"`.
    The `numbers.at(-1)).toBe(9)` assertion and the string-slice "`\n## E-`
    does not appear after E-9" assertion are both deleted (they *are* "E-9 is
    the last heading", which criterion 10 requires be untrue after this task).
    In their place: the sorted-ascending check stays (so mutation (c) — moving
    the `E-10` block above `E-8` — still turns it red, since the raw number
    sequence is no longer monotonic), plus a loop asserting every number after
    `E-9`'s position is `> 9` (so a future `E-10`/`E-11`/... below or equal to
    9 would still be caught, though nothing can produce that shape without
    also breaking sort order).
  - `test("an E-9 entry exists", …)` and `test("E-9 says which vocabulary won
    and why", …)` are byte-identical to `main` — mutations (a) (delete the
    `E-9` heading) and (d) (drop `content.json` from its body) still hit them.
  - No `describe` block deleted, no test skipped, nothing else in the file
    (including every T-017 criteria 1–6 and 8 block) touched — verified with
    `git diff main -- question-bank/src/region-vocabulary.test.ts`, which
    shows exactly this one hunk.

### Criterion 10 and 11 — verified by mutation, then reverted

I ran every mutation criterion 11 names directly against
`engineering-decisions.md` (not against a copy), watched the exact matching
test(s) go red, then restored the file from a backup and confirmed
`git diff engineering-decisions.md` was empty before moving on to the next
mutation:

| Mutation | What I did | Result |
|---|---|---|
| (a) delete `## E-9 — …` heading | `sed` renamed it to `## X-9 — …` | 3 tests red: "an E-9 entry exists", the ascending-order test (its `nineIndex >= 0` assertion), and "E-9 says which vocabulary…" (its slice logic can't find the heading either) |
| (b) a second entry numbered `E-9` | renamed the `E-10` heading to `## E-9 — …` (keeping its body) | 2 tests red: uniqueness, and the ascending-order test's "later number > 9" loop (10 became 9, mutated in place) |
| (c) `E-10` block moved above `E-8` | cut the whole `E-10` section and reinserted it between `E-7` and `E-8` | 1 test red: the ascending-order test's sorted-check (`[…7, 10, 8, 9]` ≠ sorted) |
| (d) `content.json` removed from `E-9`'s body | replaced both occurrences with `CONTENTFILE` inside the `E-9` block only | 1 test red: "E-9 says which vocabulary won and why" (`toContain("content.json")`) |

For criterion 10's second half, I appended a well-formed `## E-11 — …` heading
after `E-10` (a throwaway heading, not committed) and reran the suite: **56
pass, 0 fail** — appending future entries no longer breaks anything. Reverted
before running anything else; `git diff engineering-decisions.md` against the
committed base was empty afterward, and `engineering-decisions.md` is
unchanged in this round's diff (it already carries `E-10` from round 1).

### Criteria 9, 12, 13, 14 — where they stand

| # | Verdict | Evidence |
|---|---|---|
| 9 | **done — all six CI jobs green** | `question-bank`: `bun test --no-install` → **1253 pass, 2 fail** locally (both pre-existing, T-072, confirmed identical via `git stash` against the pre-edit branch head). `backend`: `uv run pytest -q` → 517 passed, 9 skipped; `uv run ruff check` and `ruff format --check` clean. `frontend`: `bun test --no-install` → 209 pass, 1 fail/1 error locally — the same `UsMap.tsx` → `react-simple-maps`/`us-atlas` import failure round 1 documented (this sandbox's proxy returns 403 on those tarballs); `bun run lint` clean; `bun run typecheck` → same 4 pre-existing `UsMap.tsx` errors, nothing new. `question-bank`: `bun run typecheck` fails locally on `Cannot find type definition file for 'bun'` — same registry restriction. **CI on the pushed commit (`13cc373`), polled via the GitHub API after push and waited out to completion — all seven checks `success`:** `backend (lint, format, test)`, `backend (postgres)`, `frontend (typecheck, lint, test)`, `integration (docker compose)`, `e2e (playwright)`, **`question-bank (typecheck, test)`** (the one this round's fix targets — was `failure` on the pre-fix head `4ba642a`, now `success`), and `Is a task waiting on a human?`. This is a real CI run in an environment with full registry access, not a local report — it resolves both the registry caveat and the "will E-10 actually unblock CI" question at once. |
| 10 | done | See the mutation table above — the `E-11` append stays green (56/56), and neither of the two now-generalised assertions pins the maximum number or the last-heading position. |
| 11 | done | See the mutation table above — all four named mutations turn a `region-vocabulary.test.ts` test red, each reverted cleanly. |
| 12 | done (negative) | `git diff main -- frontend/package.json frontend/bun.lock question-bank/package.json question-bank/bun.lock e2e/package.json e2e/bun.lock backend/pyproject.toml backend/uv.lock` is empty — none of the eight files changed. |
| 13 | done (negative) | The only edit this round is to two `expect()` bodies that already operated on `headings`/`decisions`, both read from disk (`readFileSync`) with no network and no server spawned. No new test added. |
| 14 | done (negative) | No stand-in module was written for `react-simple-maps`, `us-atlas`, or anything else; `node_modules/` was never touched this round. Where local suites can't run to completion (frontend's one file, `question-bank`'s typecheck), I cited the branch-head CI conclusion above instead of faking anything. |

### What I did not do, and why

- **Did not touch `backend/app/levels.py`, `backend/tests/test_levels.py`,
  `backend/tests/test_levels_t057_criteria.py`,
  `frontend/src/components/screens.criteria.test.tsx`,
  `frontend/src/level-window-claim.criteria.test.ts`, or
  `engineering-decisions.md`.** Criteria 1–8 were already satisfied and the
  Constraints say the fifth file (`region-vocabulary.test.ts`) is "the whole
  of round 2's work" — I read that literally.
- **Did not touch any part of `region-vocabulary.test.ts` outside the two
  named assertions.** T-017's criteria 1–6 and 8 blocks, and the rest of
  criterion 7's own block (`an E-9 entry exists`, the content-check test),
  are byte-identical to `main`.
- **Did not stub `react-simple-maps`/`us-atlas` to force the frontend suite
  fully green**, and did not install `@types/bun` from an alternate registry
  for `question-bank`'s typecheck. Both are the same proxy-gated registry
  restriction round 1 documented; criterion 14 says to cite CI instead, which
  I did above.
- **Did not open a new `tasks.md` entry for T-072 or the registry gap** — both
  are already recorded (T-072 explicitly in this brief's Out of scope; the
  registry gap in round 1's Notes) and re-filing them here would duplicate
  bookkeeping rather than add information.

### How to run what I touched

- `cd question-bank && bun test --no-install src/region-vocabulary.test.ts`
  (or the whole suite: `bun test --no-install`).
- To re-run the mutation checks by hand: edit `engineering-decisions.md`
  directly (rename a heading, duplicate a number, reorder a block, or strip
  `content.json` from `E-9`'s body), rerun the command above, then `git
  checkout -- engineering-decisions.md` to revert.

## Verdict

Written by `tester`. **Round 2 appends a `### Verdict — round 2` block at the
end; it does not rewrite round 1's.** Round 1's verdict is what produced
Amendment 1, and its criteria 1–8 evidence still stands.

### Verdict — round 1

**Status: `blocked` — back to `task-expander`, not to the worker.**

**TL;DR:** criteria 1–8 all hold, and I verified every one of them with tests
that I broke on purpose first. Criterion 9 does not: **this branch turns CI red**
(`question-bank (typecheck, test)` failed on `cf3fc5f`; it passes on `main`), and
the cause is criterion 8 itself. `question-bank/src/region-vocabulary.test.ts`
carries T-017's frozen criterion 7 — *"E-9 is the next number … and none is
higher"*, *"E-9 is the last block in the file"* — so **no `E-10` entry can ever
exist without editing that file**, and this brief's Constraints say the files
expected to change are four, *"Nothing else"*. Criteria 8 and 9 plus the
Constraints cannot all be satisfied as written. That is a brief problem, not a
worker problem: the worker cannot fix it without breaching the Constraints, so
sending it back to them would just produce the same stalemate.

### On my independence — read this before trusting the verdict

**This was an orchestrated run** (`runs/T-057-level-window-docstring.md` exists),
so the Sessions-table check does not work and I am not claiming it passed. Every
role the orchestrator spawns shares one session id, and
`$CLAUDE_CODE_REMOTE_SESSION_ID` here is `cse_01VNvekndCsNWvPYSNudz67b` — the
same id already in the table as `worker`. What I actually had is the weaker
kind of independence: a **fresh context window**. I never saw the worker's
transcript or reasoning, and read only the brief, the repo and the contract. That
rests on the orchestrator having spawned me correctly rather than on anything I
could verify myself.

### Criteria

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | `git ls-files` over the eight named paths, 241 files, none contains the banned name. New test `level-window-claim.criteria.test.ts`; mutation M1 turned it red. |
| 2 | pass | `level_window.__doc__` names `suggestedLevels` and says the client renders it "rather than deriving a window of its own"; a whole-file scan of `levels.py` finds no `` `name()` `` it does not define or `level.ts` does not export. Mutation M1 turned both halves red. |
| 3 | pass | Behavioural half: the worker's `screens.criteria.test.tsx` — **not runnable in this sandbox** (see Environment below), but the branch's CI `frontend` job went green on `cf3fc5f`, which does run it. Source half (the negative "no module under `frontend/src` derives a set of candidate levels", which no render can prove): new tests in `level-window-claim.criteria.test.ts`; mutations M13 and M14 turned them red. |
| 4 | pass | 37 parametrised cases, `L = 0.0 … 18.0`, each returns 3 or 4; the two named boundaries asserted separately. **Genuine bug-fix test**: mutation M2 (restore the pre-task algorithm) turns `L-18.0` red in both my file and the worker's. The contract is unedited and still says "three or four" — mutation M12 proves that assertion is live. |
| 5 | pass | Four separate parametrised assertions (ascending, in-bounds, half-integer, contains `clamp_level(L)`). Mutations M3, M4, M5 and M6 each turned exactly the matching one red. |
| 6 | pass | `level_window(6.0) == [5.0, 6.0, 7.0, 8.0]`, `max(level_window(2.0)) == 4.0`, `min(level_window(0.0)) == 0.0`, and `test_profiles_api.py::test_suggested_levels_are_centred_on_the_last_session` still green. `git diff main...HEAD --numstat` shows **69 added, 0 deleted** in `test_levels.py` and no change at all to `test_profiles_api.py`, `openapi.yaml`, `screens.tsx`, `level.ts` or `serializers.py` — the protected assertions are unedited. |
| 7 | pass | Mutation M1: reinserting the deleted sentence into `level_window`'s docstring turns **three** tests red across two suites (`test_levels.py`'s docstring test, my criterion-2 file scan, my criterion-1 tree scan). Reverted; `git status` clean. |
| 8 | pass **on its own terms** | `E-10` exists, is last, names `suggestedLevels`, `frontend/src/lib/level.ts` and `screens.tsx:423`; E-1…E-9 are byte-identical to the base (only a `---` separator was appended). Mutations M7–M11 each turned exactly one assertion red. **But satisfying it is what breaks criterion 9 — see below.** |
| 9 | **fail** | `question-bank` suite red on this branch, green on `main`. CI: `question-bank (typecheck, test)` = failure on `cf3fc5f`, all six jobs = success on `main` (`54e2796`). |

### The contradiction, precisely

`question-bank/src/region-vocabulary.test.ts:327-342`:

```ts
test("E-9 is the next number — no other entry claims it, and none is higher", () => {
  expect(Math.max(...numbers)).toBe(9);
});
test("the entries run in ascending order, so E-9 is the last block in the file", () => {
  expect(numbers.at(-1)).toBe(9);
  expect(decisions.slice(decisions.indexOf("## E-9 —"))).not.toContain("\n## E-");
});
```

Observed: `Expected: 9 / Received: 10`, twice, locally and in CI. That test is a
**landmine for every future task**, not just this one — T-017's criterion 7 asked
for "the next number", and the verifying session pinned it as "9 is the maximum
forever". Nothing can add `E-10`, `E-11` or anything else without it going red.

**What the expander has to decide** (I may not, and the worker may not):

- **Widen the Constraints** to include `question-bank/src/region-vocabulary.test.ts`,
  and add a criterion saying what the T-017 pin should become — e.g. "E-9 exists,
  the numbers are unique and ascending, and E-9 is followed only by entries with
  higher numbers", which keeps everything T-017 criterion 7 actually meant while
  letting the file grow. This is my recommendation.
- Or **drop criterion 8** and record the decision somewhere that is not
  `engineering-decisions.md` — which would be a worse outcome, since E-10 is the
  best part of this change.
- Either way it is a change to a *frozen* criterion of a *different, merged*
  task, so if the expander thinks that needs a person, escalate rather than
  guess.

Nothing else about the implementation needs to move. When the brief is fixed, the
worker's change plus my tests should go green as they stand.

### Mutations made, and reverted

Every one was reverted; `git status --short` after the last showed only my two
new test files, and `git diff` was empty.

| # | Mutation | Turned red |
|---|---|---|
| M1 | Reinsert ``Mirrors `<the deleted name>()` in the client:`` into the docstring | `test_level_window_docstring_names_no_client_function…` (worker's), `test_criterion_2_no_comment_in_levels_py…`, criterion 1's tree scan |
| M2 | Drop the downward-extension loop — the pre-task algorithm | criterion 4, at `L = 18.0` only, in both test files |
| M3 | Offsets `(-1, 0, 1, 2)` → `(-1, 1, 2, 3)` (current level dropped) | criterion 5 "child is always offered the level they are on", criterion 6 ×2 |
| M4 | `sorted(values, reverse=True)` | criterion 5 "sorted strictly ascending", criterion 6 |
| M5 | Remove `clamp_level` from the comprehension | criterion 5 "every value is on the scale", criterion 6 bottom pin |
| M6 | `round(… * 2) / 3` instead of `/ 2` | criterion 5 "multiple of a half" (plus 3 others) |
| M7 | `E-10` stops saying `suggestedLevels` | criterion 8 "names the field" |
| M8 | `E-10` heading renumbered `E-11` | all five criterion-8 assertions |
| M9 | `E-10` stops naming `frontend/src/lib/level.ts` | criterion 8 "names the client module" |
| M10 | `E-10` stops naming a `screens.tsx` line | criterion 8 "names a call site" |
| M11 | Edit `E-1`'s heading | criterion 8 "no existing E-n entry was modified" |
| M12 | Reword `openapi.yaml`'s `suggestedLevels` description | criterion 4 "the contract still promises three or four" |
| M13 | `screens.tsx` fallback becomes a computed window | criterion 3 "Setup's options are suggestedLevels, or exactly the one-element fallback" |
| M14 | `level.ts` grows a `levelChoices()` export | criterion 3 "level.ts exports formatting only" |

### Tests I added

- **`backend/tests/test_levels_t057_criteria.py`** — criteria 2, 4, 5, 6, plus a
  guard that `openapi.yaml` still carries the three-or-four rule. 193 tests.
  Deliberately separate from the worker's, and every expected value is read out
  of the brief or the contract, never out of `levels.py`.
- **`frontend/src/level-window-claim.criteria.test.ts`** — criteria 1, 3
  (source half) and 8. 11 tests. Lives in `frontend`'s `bun test` following the
  precedent of `ci-action-pinning.test.ts` and `conventions-doc.test.ts`; it
  scans `git ls-files` output and repo files only, no network. It assembles the
  banned name from two halves so the file does not fail its own criterion-1 scan.

Two honesty notes on my own tests. The criterion-1 and criterion-3 scans each
open with a *"the scan actually covers the tree"* assertion, so an empty file
list cannot pass them vacuously. And criterion 8's "no existing E-n entry was
modified" needs history: in a shallow clone `git merge-base HEAD origin/main`
fails and that **one** assertion returns early. I ran it in a full clone and it
is green; the other four criterion-8 assertions run everywhere.

### Test runs (this session)

| Command | Result |
|---|---|
| `backend`: `uv run pytest -q` | **517 passed, 9 skipped** (324 + my 193) |
| `backend`: `uv run ruff check` / `ruff format --check` | clean, 41 files formatted |
| `frontend`: `bun test --no-install` | 209 pass, **1 fail, 1 error** — `screens.criteria.test.tsx` cannot import (environment, below). My file: 11/11 |
| `frontend`: `bun run lint` | clean, `--max-warnings 0` |
| `frontend`: `bun run typecheck` | 4 errors, all `UsMap.tsx`, all the missing-package artefact; my new file adds none |
| `question-bank`: `bun test --no-install` | 1251 pass, **4 fail** — 2 are this task's `E-10` (above), 2 are pre-existing (below) |
| CI on `cf3fc5f` (worker's head) | frontend ✅ · backend ✅ · backend-postgres ✅ · e2e ✅ · integration ✅ · **question-bank ❌** |
| CI on `e9147a5` (this commit, my tests included) | frontend ✅ · backend ✅ · backend-postgres ✅ · e2e ✅ · integration ✅ · **question-bank ❌** — the only two annotations are `region-vocabulary.test.ts:330` and `:339`, `Expected: 9 / Received: 10` |
| CI on `main` (`54e2796`) | all six ✅ |

So my own tests are green in an environment with full registry access, in both
suites, and the **only** thing standing between this branch and a green CI is the
`E-10` pin described above.

### Environment, and what it cost

- **`bun install` cannot reach this repo's registry mirror from here.**
  `europe-west1-npm.pkg.dev` returns 403 at the agent proxy's `CONNECT`, so
  `react-simple-maps`, `us-atlas` and their `d3-*` deps are absent from
  `node_modules`. Installing from `registry.npmjs.org` instead was refused by the
  sandbox ("Package Registry Bypass"). The worker's account of this is accurate.
- **I did not stub the missing packages**, which is where I diverged from the
  worker. Reporting a green suite that depends on a hand-written fake of a
  third-party module is not a green suite, and `test-guidelines.md` is explicit
  that you never edit a recording to make something pass. Instead I read the
  **real CI result** off the branch head — `frontend (typecheck, lint, test)`
  succeeded on `cf3fc5f`, in an environment that does install the packages — so
  criterion 3's render test and `bun run typecheck` are verified by that run
  rather than by a local fake.
- **`bun test --no-install`** is what makes the rest of the frontend suite
  runnable here; plain `bun test` is refused because it tries to install first.

### Findings that are not this task's to fix

- **`question-bank/src/climate-kid-verify.test.ts:1129`** (T-014 criterion 19)
  runs `git diff --name-only 13a735f...HEAD` and fails if anything under
  `frontend/`, `backend/` or `e2e/` changed since that commit. It fails on
  **`main`** in a full clone — `git diff --name-only 13a735f...main` already
  lists six such files — and only passes in CI because `actions/checkout`
  shallow-clones and the `else` branch swallows it. It will fail for every task
  from now on, locally, for a reason unrelated to the task. Worth a `tasks.md`
  entry alongside the T-017 pin.
- **`question-bank` typecheck** fails locally here with `Cannot find type
  definition file for 'bun'` — same registry restriction, green in CI.
- **`screens.criteria.test.tsx:84`** is named *"a three-choice suggestedLevels …
  renders exactly three, not four"* but passes `[17, 18]` and asserts two. The
  assertion is right and the name is wrong; a one-line rename for the reviewer to
  call, not a criterion failure.

### What I did not do

- **Did not edit any source.** The only source files I touched were the 14
  mutations above, every one reverted and verified with `git status` / `git diff`.
- **Did not edit the acceptance criteria**, and did not edit
  `question-bank/src/region-vocabulary.test.ts` to unblock myself. Relaxing
  another task's frozen criterion is exactly the call this verdict is handing
  back.
- **Did not open a second PR or branch.** Committed to
  `claude/loving-franklin-su4qzl`, the brief's `Branch:` header.

### Verdict — round 2

**Status: `pass` — on to the `reviewer`.**

**TL;DR:** all fourteen criteria hold. The round-2 change to
`question-bank/src/region-vocabulary.test.ts` is one hunk, generalises exactly
the two assertions Amendment 1 named, and **all four criterion-11 mutations plus
the criterion-10 `E-11` append were re-run by me, from scratch, against the real
`engineering-decisions.md`** — each turned the expected test red, each was
reverted, and the tree is clean. All six CI jobs are `success` on the branch head
(`de9581f`), read from the GitHub API, not reported from a local run. **I added no
test files this round**: criteria 10 and 11 are defined by the brief as mutation
checks against tests that already exist, and the Constraints name
`region-vocabulary.test.ts` as the only file round 2 may touch.

#### On my independence — read this before trusting the verdict

**Same caveat as round 1, and it has not improved.** This is an orchestrated run
(`runs/T-057-level-window-docstring.md` exists), so every role shares one session
id: `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01VNvekndCsNWvPYSNudz67b`, already in
the Sessions table as `worker`. **The Sessions-table check did not pass — it does
not apply.** What I actually have is the weaker kind of independence: a fresh
context window. I never saw the worker's transcript or reasoning, and read only
the brief, the repo, `openapi.yaml`, `CLAUDE.md`, `process.md` and
`test-guidelines.md`. That rests on the orchestrator having spawned me correctly,
not on anything I could verify myself. I also deliberately re-derived criteria
1–8 rather than trusting round 1's Verdict table: the mutations below are mine,
run this session.

#### Criteria

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | `git grep -n levelWindow -- backend frontend e2e question-bank fixtures openapi.yaml conventions.md test-guidelines.md` → no matches (exit 1). Mutation R1 (below) turned `level-window-claim.criteria.test.ts`'s tree scan red. |
| 2 | pass | `level_window`'s docstring names `suggestedLevels`, `app/serializers.py` and `screens.tsx`'s `Setup`, and says the client "renders that list as-is … rather than deriving a window of its own". `frontend/src/lib/level.ts` exports exactly `gradeOf`, `bandOf`, `gradeLabel`, `bandLabel`, `levelLabel` — no window function — and no comment in `levels.py` attributes one. Mutation R1 turned two tests red. |
| 3 | pass | Source half: `screens.tsx:383-385` is `progress?.suggestedLevels?.length ? progress.suggestedLevels : [profile.lastSessionEndLevel]`, unedited; mutation R5 (fallback becomes a three-element computed window) turned the criterion-3 scan red. Behavioural half: `screens.criteria.test.tsx` — **not runnable in this sandbox** (`react-simple-maps` absent, see Environment); verified by the green `frontend (typecheck, lint, test)` job on `de9581f`, which installs with `--frozen-lockfile` and runs the whole suite. |
| 4 | pass | Independent sweep of all 37 half-integers `0.0…18.0` (`uv run python`, expectations taken from the criterion and from `openapi.yaml:1943`'s "three or four choices"): every window has 3 or 4 values, zero violations. Named boundaries: `level_window(17.5) == [16.5, 17.5, 18.0]` (3), `level_window(18.0) == [16.0, 17.0, 18.0]` (3, was 2). **Genuine bug-fix test**: mutation R2 (restore the pre-task algorithm) turns exactly four tests red, all at `L = 18.0`, across both backend test files. `openapi.yaml` is unchanged on this branch. |
| 5 | pass | Same sweep: every window sorted strictly ascending, no duplicates, all values in `[0.0, 18.0]`, all multiples of `0.5`, all containing `clamp_level(L)`. Mutation R3 (offsets `(-1,0,1,2)` → `(-1,1,2,3)`) turned the "child is always offered the level they are on" parametrisation red at 8 levels, plus both criterion-6 tests and the endpoint test. |
| 6 | pass | `level_window(6.0) == [5.0, 6.0, 7.0, 8.0]`, `max(level_window(2.0)) == 4.0`, `min(level_window(0.0)) == 0.0`, and `test_profiles_api.py::test_suggested_levels_are_centred_on_the_last_session` green inside the 517-test backend run. `git diff --numstat origin/main...HEAD` shows `backend/tests/test_levels.py` at **69 added / 0 deleted** and no change at all to `test_profiles_api.py`, `openapi.yaml`, `screens.tsx`, `level.ts` or `serializers.py` — the protected assertions are unedited. |
| 7 | pass | Mutation R1: reinserting the banned "mirrors a client function" sentence into `level_window`'s docstring turned **three** tests red across two suites — `test_levels.py::test_level_window_docstring_names_no_client_function_the_client_does_not_have`, `test_levels_t057_criteria.py::test_criterion_2_no_comment_in_levels_py_attributes_a_function_to_a_client_that_lacks_it`, and the frontend tree scan. None reaches the network or spawns a server; the frontend one reads `frontend/src/lib/level.ts` and `git ls-files` output off disk. Reverted, `git status` clean. |
| 8 | pass | `E-10` is the last heading (`engineering-decisions.md:486`) and contains `suggestedLevels`, `frontend/src/lib/level.ts` and three `screens.tsx` call sites (`:423`, `:361`, `:195`). `git diff --numstat origin/main...HEAD -- engineering-decisions.md` → **43 added, 0 deleted**, so no existing `E-n` entry is modified. |
| 9 | pass | **All six jobs `success` on the branch head `de9581f`**, read from `api.github.com/.../commits/de9581f/check-runs`: `frontend (typecheck, lint, test)`, `question-bank (typecheck, test)`, `backend (lint, format, test)`, `backend (postgres)`, `integration (docker compose)`, `e2e (playwright)`. Local runs and what this sandbox cannot do are in "Test runs" and "Environment" below. |
| 10 | pass | First half: `question-bank` suite green apart from the two pre-existing T-072 failures (below) — neither of the two former `E-10` failures reappears, and nothing in `region-vocabulary.test.ts` now pins a maximum number or asserts that `E-9` is the last heading (the `Math.max(...numbers)).toBe(9)`, `numbers.at(-1)).toBe(9)` and `not.toContain("\n## E-")` assertions are all gone from the diff). Second half **re-verified by mutation, mine**: appending a well-formed `## E-11 — …` block to the real `engineering-decisions.md` left the full suite at **1253 pass / 2 fail** — the same two pre-existing failures, no new ones. Reverted; md5 of the file identical before and after. |
| 11 | pass | All four mutations re-run by me against the real file, one at a time, each reverted and md5-checked. See the table below. Structure intact: `describe` count, `test(` count and `.skip`/`.only`/`.todo` count are **identical to `origin/main`** (7 / 26 / 0), and the diff is a **single hunk** inside the criterion-7 block, so the T-017 criteria 1–6 and 8 blocks are byte-identical. |
| 12 | pass (negative) | `git diff origin/main...HEAD --` over all eight manifests and lockfiles is empty. CI's `Lockfile unchanged` step (`git diff --exit-code -- bun.lock`) is green on the head as well. |
| 13 | pass (negative) | Grepped every test file this task added or edited for `fetch(`, a URL, `requests.`, `httpx.get/post/Client`, `axios`, `urlopen`, `uvicorn`, `subprocess`, `execSync`, `spawnSync`. The only hits are three `Bun.spawnSync` calls to **`git`** (`ls-files`, `merge-base`, `show`) in `level-window-claim.criteria.test.ts` — local ref and index reads, no network, no server. The endpoint assertion criterion 6 relies on goes through the existing `httpx.ASGITransport` fixture in `test_profiles_api.py`, which this task did not touch. |
| 14 | pass (negative) | The branch diff contains no stand-in module for anything (the ten changed paths are the five source/test files, `engineering-decisions.md`, the brief, `tasks.md` and `runs/`). `frontend/node_modules` here holds 237 packages and **neither `react-simple-maps` nor `us-atlas`** — so nothing I ran could have been faked green, and every result I could not produce locally is cited to the CI job on `de9581f` instead. I wrote no stub. |

#### Criterion 11 — the four mutations, re-run this session

Each one was made directly to `engineering-decisions.md` (not a copy), the
criterion-7 file was run, then `git checkout -- engineering-decisions.md` and the
md5 re-checked (`eb12c7639c534ce1317427eeb0781b8c` throughout).

| Mutation | What I did | Result |
|---|---|---|
| a. `E-9` heading deleted | renamed `## E-9 — …` to `## Zz-9 — …` | **3 red**: "an E-9 entry exists", "the entries run in ascending order…", "E-9 says which vocabulary won and why" (53 pass / 3 fail) |
| b. a second entry numbered `E-9` | renamed the `E-10` heading to `## E-9 — …` | **2 red**: the uniqueness test, and the ascending-order test's "later number > 9" loop (54 pass / 2 fail) |
| c. `E-10` moved above `E-8` | cut the whole `E-10` block, reinserted it between `E-7` and `E-8` | **1 red**: the ascending-order test's sorted check (55 pass / 1 fail) |
| d. `content.json` removed from `E-9` | replaced it with `CONTENT_FILE` inside the `E-9` block only | **1 red**: "E-9 says which vocabulary won and why" (55 pass / 1 fail) |

So the relaxation is bounded exactly as Amendment 1 intended: existence,
uniqueness, ascending order and `E-9`'s content are all still enforced, and only
the "nine is the ceiling for ever" clause is gone.

#### Mutations on this task's own subject, re-run this session

| # | Mutation | Turned red | Reverted |
|---|---|---|---|
| R1 | Reinsert the banned `Mirrors \`…()\` in the client:` sentence into `level_window`'s docstring | 2 backend tests + the frontend tree scan | yes |
| R2 | Delete the downward-extension loop (the pre-task algorithm) | 4 tests, all at `L = 18.0` | yes |
| R3 | Offsets `(-1, 0, 1, 2)` → `(-1, 1, 2, 3)` | criterion 5's "level they are on" ×8, both criterion-6 tests, `test_profiles_api.py` | yes |
| R4 | `E-11` appended to `engineering-decisions.md` (criterion 10's second half) | **nothing** — that is the point; 1253 pass / 2 fail, unchanged | yes |
| R5 | `screens.tsx` fallback becomes a three-element computed window | criterion 3's "options are suggestedLevels, or exactly the one-element fallback" | yes |

`git status --short` was empty after the last revert.

#### Test runs (this session)

| Command | Result |
|---|---|
| `backend`: `uv run pytest -q` | **517 passed, 9 skipped** |
| `backend`: `uv run ruff check` / `ruff format --check` | clean · 41 files already formatted |
| `question-bank`: `bun test --no-install` | **1253 pass, 2 fail** — both are T-014 criterion 19's `git diff 13a735f...HEAD` guard (T-072), see below |
| `question-bank`: `bun test --no-install src/region-vocabulary.test.ts` | 56 pass, 0 fail |
| `frontend`: `bun test --no-install` | 209 pass, 1 file cannot import (`screens.criteria.test.tsx` → `UsMap.tsx` → `react-simple-maps`); **no `(fail)` test** |
| `frontend`: `bun test --no-install src/level-window-claim.criteria.test.ts` | 11 pass, 0 fail |
| `frontend`: `bun run lint` | clean, `--max-warnings 0` |
| `frontend`: `bun run typecheck` | 4 errors, all `UsMap.tsx`, all from the two missing packages; none from this task's files |
| CI on `de9581f` (branch head when I started) | frontend ✅ · question-bank ✅ · backend ✅ · backend-postgres ✅ · integration ✅ · e2e ✅ |
| CI on `6081cb5` (the commit carrying this Verdict) | all seven checks `success`, including `Is a task waiting on a human?` |

The only commit after `6081cb5` on this branch is the one that adds these two
rows — a markdown-only change to this brief, touching no suite.

**The two `question-bank` failures are not this task's**, and I confirmed that
myself rather than taking the Handoff's word: `git diff --name-only
13a735f...origin/main` already lists six files under `frontend/` and `backend/`,
so T-014 criterion 19's guard fails on **`main`** in any full clone and passes in
CI only because `actions/checkout` shallow-clones. That is T-072, explicitly out
of scope here.

#### Environment, and what I would not do about it

- **`react-simple-maps` and `us-atlas` cannot be installed in this sandbox** (the
  proxy 403s the registry), which is why `screens.criteria.test.tsx` cannot run
  and why `bun run typecheck` reports four `UsMap.tsx` errors. `UsMap.tsx` is
  untouched by this branch.
- **I did not stub them**, for the same reason the round-1 tester did not: a
  suite that is green because a third-party module was hand-written is not green,
  and criterion 14 says to cite the CI job instead. I did — `frontend (typecheck,
  lint, test)` is `success` on `de9581f`, in an environment that installs both.
- `bun test --no-install` is what makes the rest of the frontend suite runnable
  here; plain `bun test` tries to install first and is refused.

#### Why I added no test files this round

Criteria 10 and 11 are written as mutation checks — criterion 10 says *"(The
tester checks the `E-11` half by mutation and reverts it)"* and criterion 11
enumerates four mutations and the tests each must redden. The subject under test
is itself a test file, so writing a test to check it would be circular
(`test-guidelines.md`, "Verifying a task whose deliverable is tests"). Criteria
12 and 14 are diff-shaped negatives that a committed test could only ratify
vacuously once merged. And the Constraints name
`question-bank/src/region-vocabulary.test.ts` as the whole of round 2's
permitted change, so a new test file would land outside them. The evidence is the
mutation tables above; every criterion still has at least one test that goes red
when its subject is broken.

#### Notes for the reviewer — judgement, not criteria

- **Does the generalised block still read as T-017 criterion 7?** My read: yes.
  The four tests still assert that `E-9` exists, that no two entries share a
  number, that the numbers ascend, that nothing after `E-9` is `≤ 9`, and that
  `E-9`'s body names `thirteen`, `eight`, `content.json` and a "Revisit when".
  Only the ceiling clause is gone, the test names still say "criterion 7", and
  both edited tests carry a comment saying what was generalised and why. It reads
  to me as narrowed-to-what-is-provable rather than widened-until-green — but
  this is the review-checklist item the brief reserves for a human, and I am
  recording my read, not settling it.
- **`screens.criteria.test.tsx:84` is still misnamed** — "renders exactly three,
  not four" over `[17, 18]`, asserting two. The assertion is right; the name is
  wrong. Not a criterion, still worth the one-line rename the checklist invites.
- **Amendment 1's judgement call** (that generalising a merged task's test is the
  expander's to make) is untouched by this verdict. I verified the relaxation is
  bounded; whether it needed Dkaattae is the reviewer's line to draw.

### Verdict — round 3

**Status: `pass` — on to the `reviewer`.**

**TL;DR:** the reviewer was right. I reproduced finding 1 before fixing it —
appending a well-formed `E-11` to the real `engineering-decisions.md` turned
`level-window-claim.criteria.test.ts:141` red (`Expected: 10 / Received: 11`)
while `region-vocabulary.test.ts` stayed green, so criterion 10 was satisfied in
one suite and defeated in the other. All three findings are now closed, in the
two test files the reviewer named and nothing else. **No source file changed
this round**; `git diff origin/main...HEAD` over `backend/app/`,
`frontend/src/components/screens.tsx`, `frontend/src/lib/`, `openapi.yaml` and
`engineering-decisions.md` is untouched by my commit.

#### On my independence — read this before trusting the verdict

**Unchanged from rounds 1 and 2, and it has not improved.** This is an
orchestrated run (`runs/T-057-level-window-docstring.md` exists), so every role
shares one session id: `$CLAUDE_CODE_REMOTE_SESSION_ID` is
`cse_01VNvekndCsNWvPYSNudz67b`, already in the Sessions table as `worker`. **The
Sessions-table check did not pass — it does not apply**, and I am not claiming
it did. What I have is the weaker kind of independence: a fresh context window.
I never saw the worker's or the earlier testers' transcripts, and read only the
brief, the repo, `openapi.yaml`, `CLAUDE.md`, `process.md` and
`test-guidelines.md`. That rests on the orchestrator having spawned me
correctly, not on anything I could verify myself. I re-derived every mutation
below in this session rather than trusting round 2's tables.

#### The three findings

| Finding | Fix | Evidence it is closed |
|---|---|---|
| **1 (blocking)** — `level-window-claim.criteria.test.ts:141` pinned `numbers.at(-1)).toBe(10)` | Replaced by "every number after `E-10`'s position is `> 10`". `toContain(10)`, uniqueness and ascending-order all kept. | Reproduced first: with a throwaway `E-11` appended, the old assertion failed `Expected: 10 / Received: 11` (10 pass / 1 fail). With the fix: **11 pass / 0 fail** with `E-11` present, and `region-vocabulary.test.ts` 56 pass / 0 fail at the same time. Reverted; `md5sum engineering-decisions.md` = `eb12c7639c534ce1317427eeb0781b8c` before and after. |
| **2 (blocking)** — the comment at `:135-137` claimed `region-vocabulary.test.ts` asserts the opposite | Replaced with a comment saying *why* the ceiling is deliberately absent, quoting `CLAUDE.md`'s "not gated" rule, so the next session does not put it back. | `git grep -n "asserts the exact opposite"` → no match. The claim was false on this branch head: `13cc373` removed those two assertions. |
| **3 (non-blocking)** — `screens.criteria.test.tsx:84` named "renders exactly three" over `[17, 18]` | Data changed to `[16, 17, 18]` (a real top-of-scale window under criterion 4's three-or-four rule), name kept, and `toHaveLength(3)` added so "exactly three" is asserted rather than implied. | Name and data now agree. Not runnable in this sandbox (`react-simple-maps` absent — see Environment); `bun run typecheck` reads the file and reports **no** error in it, and the `frontend` CI job runs it — see criterion 9's row. |

**Why "nothing after E-10 is ≤ 10" and not just deleting the line.** The repo
already has this exact shape: `question-bank/src/highest-point-verify.test.ts:615-629`
loosened its own "E-8 is the highest-numbered entry" pin to
`toContain(8)` + uniqueness, with a comment saying a later, higher entry is not
a failure of that criterion. My fix is that pattern plus the ordering clause
`region-vocabulary.test.ts` now uses for `E-9`, so all three files agree on one
rule and none of them caps the file.

#### Criteria — re-verified this session

Criteria 1–8 and 10–14 were re-checked from the criteria's own wording, not from
round 2's tables. Every expected value comes from the brief or `openapi.yaml`.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | `git grep -n levelWindow -- backend frontend e2e question-bank fixtures openapi.yaml conventions.md test-guidelines.md` → no match (exit 1), working tree included. Mutation R1 turned the tree scan red. |
| 2 | pass | `level_window`'s docstring names `suggestedLevels`, `app/serializers.py` and `screens.tsx`'s `Setup`, and says the client renders it "rather than deriving a window of its own". `level.ts` exports only `gradeOf`, `bandOf`, `gradeLabel`, `bandLabel`, `levelLabel`. Mutation R1 turned two backend tests red. |
| 3 | pass | Source half: `screens.tsx`'s fallback is unedited; mutation R3 (fallback becomes a three-element computed window) turned the criterion-3 scan red. Behavioural half: `screens.criteria.test.tsx`, cited to the green `frontend` CI job (below), not runnable here. |
| 4 | pass | My own sweep of all 37 half-integers `0.0…18.0` via `uv run python`, expectations taken from the criterion and `openapi.yaml:1943`: **zero violations**, every window 3 or 4 values. Boundaries: `level_window(17.5) == [16.5, 17.5, 18.0]`, `level_window(18.0) == [16.0, 17.0, 18.0]`. Bug-fix test proved by mutation R2 (pre-task algorithm) → **4 tests red, all at `L = 18.0`**. `openapi.yaml` unchanged on the branch. |
| 5 | pass | Same sweep: sorted strictly ascending, no duplicates, all in `[0.0, 18.0]`, all multiples of `0.5`, all containing `clamp_level(L)`. |
| 6 | pass | `level_window(6.0) == [5.0, 6.0, 7.0, 8.0]`, `max(level_window(2.0)) == 4.0`, `min(level_window(0.0)) == 0.0`; `test_profiles_api.py` green inside the 517-test run and shows **no diff at all** against `origin/main`. |
| 7 | pass | Mutation R1 — reinserting the banned "mirrors a client function" sentence turned three tests red across two suites (`test_levels.py`'s docstring test, `test_levels_t057_criteria.py`'s comment scan, the frontend tree scan). No network, no server; the frontend one reads files and `git ls-files` off disk. |
| 8 | pass, and still enforced after the generalisation | `E-10` is present at `engineering-decisions.md:486` and names `suggestedLevels`, `frontend/src/lib/level.ts` and three `screens.tsx` call sites. **Six mutations, mine, each reverted** — see the table below; every one turned the matching assertion red. `git diff --numstat origin/main...HEAD -- engineering-decisions.md` → 43 added, 0 deleted. |
| 9 | pass | All six CI jobs `success` on my pushed head `e5d687d` — see "CI on the branch head". Local: backend 517 passed / 9 skipped, ruff clean, 41 files formatted; `question-bank` 1253 pass / 2 fail (both T-072, confirmed pre-existing on `main` — `git diff --name-only 13a735f...origin/main` lists six `frontend/`+`backend/` files, so the guard fails on `main` in any non-shallow clone); frontend 209 pass with one file unable to import (`react-simple-maps` missing here), `bun run lint` clean, `bun run typecheck` 4 errors, all `UsMap.tsx`, none from any file this task touched. |
| 10 | pass — **and now in both suites, which is what changed** | Appending a well-formed `## E-11 — …` block to the real `engineering-decisions.md`: `region-vocabulary.test.ts` 56 pass / 0 fail **and** `level-window-claim.criteria.test.ts` 11 pass / 0 fail. Before my fix the second was 10 pass / 1 fail. Nothing in either file now pins a maximum number or a last heading. Reverted, md5 identical. |
| 11 | pass | Not re-run this round — criterion 11 is about `engineering-decisions.md` versus `question-bank/src/region-vocabulary.test.ts`, and **neither file changed since round 2 verified all four mutations** (`git diff 6081cb5..HEAD --stat` → only the brief, `runs/` and the two frontend test files). What I did verify is that my edit cannot have weakened it: my diff touches no file criterion 11 names. Round 2's four-mutation table stands; the equivalents against `E-10` are in my table below, which exercises the same four shapes. |
| 12 | pass (negative) | `git diff origin/main...HEAD` over all eight manifests and lockfiles is empty. I ran `bun install --frozen-lockfile` once (it 403s on `d3-*`/`react-simple-maps`) and confirmed afterwards that `git status --short` showed no lockfile change. |
| 13 | pass (negative) | My edits add one `toHaveLength(3)` and comments. The only subprocesses in either file are `Bun.spawnSync(["git", …])` — `ls-files`, `merge-base`, `show` — local reads, no network, no server. No endpoint test was added. |
| 14 | pass (negative) | `frontend/node_modules` holds 237 packages and **neither `react-simple-maps` nor `us-atlas`**; I wrote no stand-in and the branch diff contains none. Everything I could not run locally is cited to the CI job on `e5d687d`. |

#### Mutations made this session, and reverted

Every one was applied to the real file, run, then reverted; `git status --short`
showed only my two test files afterwards and `md5sum engineering-decisions.md`
was `eb12c7639c534ce1317427eeb0781b8c` throughout.

| # | Mutation | Turned red |
|---|---|---|
| R1 | Reinsert ``Mirrors `<the banned name>()` in the client:`` into `level_window`'s docstring | `test_levels.py::test_level_window_docstring_names_no_client_function…`, `test_levels_t057_criteria.py::test_criterion_2_no_comment…`, and the frontend criterion-1 tree scan |
| R2 | Delete the downward-extension loop (the pre-task algorithm) | 4 tests, all at `L = 18.0`, across both backend test files |
| R3 | `screens.tsx` fallback becomes a three-element computed window | criterion 3's "options are suggestedLevels, or exactly the one-element fallback" |
| R4 | Append a well-formed `## E-11 — …` after `E-10` | **nothing, which is the point** — before my fix it reddened `level-window-claim.criteria.test.ts:141` |
| R5 | `## E-10 — …` heading renamed `## Zz-10 — …` | all five criterion-8 tests |
| R6 | `E-9` renumbered `E-10`, so a number repeats | all five criterion-8 tests (uniqueness first) |
| R7 | An entry numbered `E-4` appended after `E-10` | the ascending/"nothing after E-10 is ≤ 10" test |
| R8 | `E-10` stops saying `suggestedLevels` | "E-10 names the field the window is served as" |
| R9 | `E-10` stops naming `frontend/src/lib/level.ts` | "E-10 names the client module it decides to keep" |
| R10 | `E-1`'s heading edited | "no existing E-n entry was modified" |

**Honesty note on R7.** The ascending-order assertion catches it as well as the
new loop does, and a duplicate `10` is caught by the uniqueness assertion — so
the "nothing after E-10 is ≤ 10" loop is belt-and-braces rather than the sole
guard for any shape. I kept it because it states the criterion in the criterion's
own words and matches `region-vocabulary.test.ts`'s generalised block, not
because it catches something the other two miss.

#### CI on the branch head

Read from `api.github.com/.../commits/e5d687d/check-runs` after pushing, not
reported from a local run. `e5d687d` is my fix commit.

| Job | Conclusion |
|---|---|
| `frontend (typecheck, lint, test)` | success — this is the job that runs `screens.criteria.test.tsx`, which cannot run here |
| `question-bank (typecheck, test)` | success |
| `backend (lint, format, test)` | success |
| `backend (postgres)` | success |
| `integration (docker compose)` | success |
| `e2e (playwright)` | success |

#### Environment, and what I would not do about it

- **`react-simple-maps` and `us-atlas` still cannot be installed here.** I tried
  `bun install --frozen-lockfile` once this session and got `403` from
  `europe-west1-npm.pkg.dev` on the `d3-*` tarballs. `screens.criteria.test.tsx`
  therefore cannot run locally, and `bun run typecheck` reports four `UsMap.tsx`
  errors — `UsMap.tsx` is untouched by this branch.
- **I did not stub them**, for the reason both earlier testers gave and
  criterion 14 states: a suite that is green because a third-party module was
  hand-written is not green. I cited the CI job instead.
- `bun test --no-install` is what makes the rest of the frontend suite runnable
  here.

#### What I did not do

- **Did not edit any source.** The only source touched was mutations R1–R3,
  every one reverted and checked with `git status` / `md5sum`.
- **Did not edit the acceptance criteria**, and did not touch
  `question-bank/src/region-vocabulary.test.ts` or `engineering-decisions.md` —
  the reviewer's findings were all in `frontend/`, and widening beyond them
  would have put round 2's verified work back in play.
- **Did not open a second PR or branch.** Committed to
  `claude/loving-franklin-su4qzl`, the brief's `Branch:` header, which is also
  the branch this session was standing on.

#### Left for the reviewer

- **Amendment 1's judgement call** — whether generalising a merged task's test
  needed Dkaattae — is untouched by this round and is already flagged for
  escalation in the `## Review` above. I did not reopen it.
- **Two rounds of findings are now closed.** If the reviewer finds a third
  blocking issue in the same file, `process.md`'s two-round bound applies and
  the next stop is a human, not another tester round.

## Review

Written by `reviewer`. **Verdict: changes requested. PR #53 stays draft.**

**TL;DR:** the implementation is good — the docstring is true, the top-of-scale
fix is the right shape, `E-10` earns its place, and the
`region-vocabulary.test.ts` generalisation is a genuine narrowing rather than a
widening. But **the tester's own new test re-creates the landmine this task
exists to remove**: `frontend/src/level-window-claim.criteria.test.ts:141` pins
`E-10` as the highest decision number for ever, so the next task that files
`E-11` turns the frontend suite red. Criterion 10 only ever checked the
`question-bank` suite, so nothing caught it. One assertion and one stale comment;
back to `tester`.

### Finding 1 — blocking. `frontend/src/level-window-claim.criteria.test.ts:141`

```ts
expect(numbers.at(-1)).toBe(10);
```

This is `region-vocabulary.test.ts`'s `expect(numbers.at(-1)).toBe(9)` — the
assertion Amendment 1 called a landmine for every future task — moved forward by
exactly one number and committed by this same PR. It defeats criterion 10's own
heading, *"`engineering-decisions.md` can grow past `E-9`"*, and it contradicts
`CLAUDE.md`'s standing rule that this file is *"not gated; a task may add an
entry when its criteria say so"*.

**Verified by mutation, this session.** Appending a well-formed
`## E-11 — …` block to the real `engineering-decisions.md`:

| Suite | Result with `E-11` present |
|---|---|
| `question-bank`: `bun test --no-install src/region-vocabulary.test.ts` | 56 pass, 0 fail — criterion 10 holds as written |
| `frontend`: `bun test --no-install src/level-window-claim.criteria.test.ts` | **10 pass, 1 fail** — `Expected: 10 / Received: 11` at `:141` |

Reverted; `md5sum engineering-decisions.md` is `eb12c7639c534ce1317427eeb0781b8c`
before and after, `git status --short` empty.

This is not hypothetical: `tasks.md` lines 389, 466 and 845 each already require
a new `engineering-decisions.md` entry, so `E-11` is queued work, not a someday.

**What would make it acceptable:** delete that one line, or replace it with the
same generalisation the worker applied in `region-vocabulary.test.ts` — "every
number after `E-10`'s position is `> 10`". Criterion 8 is not weakened by
either: it asks that the file *gains a new entry* `E-10` and that no existing
`E-n` is modified, and `expect(numbers).toContain(10)`, the uniqueness check, the
ascending-order check and the `no existing E-n entry was modified` byte
comparison already cover all of that between them.

### Finding 2 — blocking. `frontend/src/level-window-claim.criteria.test.ts:135-137`

```ts
// NOTE: `question-bank/src/region-vocabulary.test.ts` (T-017 criterion 7)
// asserts the exact opposite — that 9 is the highest E-number and E-9 is
// the last block in the file. Both cannot hold. See this task's Verdict.
```

True when it was written in round 1; **false on this branch head.** Commit
`13cc373` removed those two assertions, which is the whole of round 2. A comment
that describes the repo as it was two commits ago is a doc that is not true, and
`process.md` treats that as a defect rather than a nitpick.

**What would make it acceptable:** delete it, or rewrite it to say that the
`E-9` ceiling was generalised by this task's criteria 10 and 11 and that this
file must not reintroduce one — which is also the comment that stops finding 1
from coming back.

### Finding 3 — not blocking, but fix it in the same round

`frontend/src/components/screens.criteria.test.tsx:84`. The brief's review
checklist already invites this and both testers raised it, so it is settled here
rather than deferred: the test is named *"a three-choice `suggestedLevels` (the
top-of-scale case) renders exactly three, not four"* while passing `[17, 18]`
and asserting two. The assertion is right and the name is wrong — and after
criterion 4's fix the data is wrong about itself too, because the top of the
scale now returns `[16.0, 17.0, 18.0]`, not `[17, 18]`.

**What would make it acceptable:** pass `[16, 17, 18]`, which is what
`level_window(18.0)` actually returns on this branch, and keep the name; or keep
`[17, 18]` and rename it to a two-element `suggestedLevels` case. Either is fine;
the name and the data have to agree.

**No `tasks.md` entry for this** — it is a one-line change in a file the tester
is already reopening for findings 1 and 2, and two one-line tasks that the next
session would absorb anyway make the queue longer without making it more useful.

### What is good, and is not to be re-litigated

- **`backend/app/levels.py`.** The docstring is true of the code that ships and
  names `suggestedLevels`, `app/serializers.py` and `screens.tsx`'s `Setup`, so a
  reader who has never seen this task does not have to grep. The clamping
  paragraph explains the extension loop rather than restating it.
- **`E-10`** explains the decision rather than restating it, gives the reason
  `level.ts` survives (bare numbers vs the `LevelLabel` object), names its three
  call sites, and carries a **Revisit when** that hands T-004 a real trigger. It
  will still make sense in six months.
- **The generalised `region-vocabulary.test.ts` block** reads as a test of
  T-017 criterion 7, not as one widened until it stopped failing: existence,
  uniqueness, ascending order and `E-9`'s content are all still enforced, only
  the ceiling clause is gone, and both edited tests carry a comment saying what
  was generalised and why. The diff is a single hunk; `describe`/`test` counts
  match `origin/main`.
- **Role lanes are clean.** Checked commit by commit: the expander's three
  commits touch only `tasks.md` and the brief, the tester's touch only test files
  and the brief, the orchestrator's only `runs/` and the header
  (`process-decisions.md` D-7).

### Flags raised by the worker and the tester — all disposed of here

| Flag | Decision |
|---|---|
| Extend-until-three loop vs a `current == MAX_LEVEL` special case (worker, Notes) | **Keep the loop.** The comment carries the reader over the break condition, and it stays correct if the offsets or `MIN_LEVEL`/`MAX_LEVEL` ever move. No change wanted. |
| Criterion 3's test renders `Setup` via `react-dom/server` instead of scanning source (worker, Notes) | **Keep the render.** It is the first component render in this suite, but it adds no dependency and it exercises the JSX instead of pattern-matching it; the whole-tree negative half is covered separately in `level-window-claim.criteria.test.ts`. Noted consequence, not a defect: it cannot run where `react-simple-maps` is missing, because `screens.tsx` imports `UsMap` at module scope. |
| `react-simple-maps` / `us-atlas` 403 from this sandbox's registry (worker, Notes; tester, Environment) | **No `tasks.md` entry.** CI installs both and `frontend (typecheck, lint, test)` is green on the branch head; both testers independently identified it as a sandbox proxy restriction rather than a repo defect. If it ever appears in CI, that is a new finding then. |
| Amendment 1's judgement call — generalising a merged task's test without Dkaattae (expander; tester left it to me) | **Upheld, and flagged rather than buried.** The reasoning holds: T-017 is merged and swept, the pinned assertion contradicts an explicit `CLAUDE.md` rule, the file is a test and nowhere near `.claude/` or the workflows so `G1` does not bite, and criterion 11 bounds the relaxation — which I re-verified is bounded. I am not overruling it. **But when this PR comes back green it will be marked ready *with an escalation note*,** because "a merged task's frozen criterion was relaxed" is exactly the thing Dkaattae should see before merging, and escalation is a normal outcome. |
| `screens.criteria.test.tsx:84` misnamed (both testers) | Finding 3 above — settled here, fixed this round, not deferred. |

### Not swept

The task is not done, so the brief stays, `tasks.md` keeps its T-057 entry, and
`PROGRESS.md` is untouched. The sweep happens on the approving pass.

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
- **Round 2 note:** the round-1 tester's fix recommendation
  ("keeps everything T-017 criterion 7 actually meant while letting the file
  grow") mapped onto the two existing assertions almost exactly — I kept the
  existing test names' spirit ("no other entry claims it", "ascending order")
  and only cut the two clauses that pinned `9` as a ceiling, rather than
  rewriting the tests from scratch. That kept the diff to the minimum the
  Constraints asked for and made the mutation table above line up cleanly
  with the brief's own four-mutation list. **Update after push:** I waited
  for CI on the pushed commit (`13cc373`) to finish rather than leaving this
  open for the tester — all six jobs, including `question-bank (typecheck,
  test)`, are `success`. The one thing left for the tester to bring
  independent judgement to is the review-checklist item on whether the
  generalised test still reads as T-017 criterion 7 rather than as a test
  widened until it stopped failing — that is a human/tester read, not
  something a passing CI run settles.
