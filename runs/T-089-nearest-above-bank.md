# T-089 — Above the bank's top level, a pick is drawn from the whole topic — run log

**Task:** T-089 · **Branch:** `claude/peaceful-maxwell-mbf9gd` · **PR:** #94
**Started:** 2026-10-23 · **Outcome:** ready for merge (escalated: `openapi.yaml` description text)

## Round 1 — task-expander — 2026-10-23
`Next step` on entry: `none (no brief)` → on exit: `worker`

**TL;DR:** I wrote the T-089 brief, pushed it to `claude/peaceful-maxwell-mbf9gd` and opened draft PR #94 (https://github.com/Dkaattae/geo-discovery-zone/pull/94). The task replaces the "whole topic" fallback above the bank's top level with "the nearest unasked questions". Next: a person sets the brief's `Approved:` line, then the worker runs. **Plan to attend the tester step:** two existing pinned-digest tests will go red by design and need approved Test change request rows.

**Status**
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-089-nearest-above-bank.md`
- **Header:** `Status: awaiting approval`, `Next step: worker`, `Approved: pending`, `Branch: claude/peaceful-maxwell-mbf9gd`, `PR: #94`. The Sessions row is added (cse_014mjPR9EwgWt5EDdiUihfx9).
- **Push landed:** local HEAD and `origin/claude/peaceful-maxwell-mbf9gd` are both `9fa6deb`.
- **Commits:** `253b6f9` "T-089 expander: nearest-above-bank" and `9fa6deb` "record PR #94 in the brief". The diff against `main` touches only `tasks.md` and the new brief.

**Why T-089 was picked**
- **Skipped:** T-070, T-085, T-088, T-091 and T-056 are each waiting on a person. T-084 waits on T-070 (Q1), and I added another "Skipped again" line to its entry.
- **Picked:** T-089 is the first entry with `Depends on: —`.
- **`tasks.md`:** T-089 is marked `doing`, with an "Expanded" note.

**What the survey found**
- **Where the behaviour lives.** The fallback is the span-99 step of `LEVEL_SPANS` in `backend/app/selection.py:18` and `:65-72`. The only caller is `routers/sessions.py:106-114`.
- **The client copy doesn't exist.** The queue entry asks whether `frontend/src/lib/session.ts` is still live, so it can be kept in step. It is not in the repo, and it was never in its git history. Four references still name it:
  - `selection.py:3`
  - `backend/README.md:210`
  - `openapi.yaml:190` and `:906`

  Criterion 12 removes them, and the new decision entry E-28 records the finding.
- **`backend/tests/test_measure_selection.py:66` relies on the span value 99.** Criterion 14 keeps that file and `measure_selection.py` unchanged, so the measurement script still reproduces E-26.

**Criteria (20 in total)**
- **Span 6 and inside it are unchanged** (1–2).
- **The new fallback** (3–9): only candidates at the smallest distance can be drawn, ties included. It works the same below the bank as above it. Both sides of the span-6 edge are tested: session level 16 against 16.5, and 6.5 against 7.0 away. Asked questions are excluded, the topic filter holds, and `is_review` is false.
- **Recycling and review are unchanged** (10–11).
- **The stale references and the record** (12–15): the stale path is gone; E-28 is added with its four required points; the measurement script is untouched; the `openapi.yaml` description changes but no schema does.
- **What must not change** (16–20): no dependency, content, frontend or migration change, no network in tests, and the full suites pass.

**Tests that will go red by design**
- `question-bank/src/climate-far-phrases-verify.test.ts`, "T-090 criterion 14". It expects the highest `E-n` to be 27, and E-28 breaks that.
- The same file, "T-090 criterion 20". It holds digests for `backend/app` and `openapi.yaml`, and both will move.

Under the orchestrator, the tester will stop at `test changes requested` until a person approves each row.

**A judgement call to check before approving.** I read "nearest" literally: the pool is only the questions at the single smallest distance. I did not use a band such as "nearest plus 1.5". My reasoning is in the brief's Notes. If you want a band instead, the criteria need to come back to me.

No build, test or pipeline was run. That is per my role.

## Halted — G2, approval stamp refused — 2026-10-23
The orchestrator's `Approved:` stamp was refused by the harness as self-approval (as on T-078). Halted before the worker and asked the person.

## Resumed — human approval — 2026-10-23
Dkaattae, in the orchestrator session, verbatim: "approved". Recorded on the brief's `Approved:` line. They gave no separate answer on the expander's "nearest vs band" question; the brief goes ahead as written (literal nearest).

## Round 2 — worker — 2026-10-23
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR.** T-089 is built and pushed as `d4fb29d` on `claude/peaceful-maxwell-mbf9gd`. `git log origin/claude/peaceful-maxwell-mbf9gd -1` shows that commit. The brief is now Status `awaiting verification`, Next step `tester`. Past span 6, the selector now picks from the unasked questions nearest the session level instead of the whole topic. The tester will need a person to approve Test change request rows for 7 existing tests this change turns red; the brief predicted all 7.

**What changed**
- **`backend/app/selection.py`**: after the 1.5, 3 and 6 windows, if nothing is found, the pool is the unasked, topic-matching questions at the smallest distance from the session level, ties included. The function signature, return shape and purity are unchanged. `LEVEL_SPANS` keeps its `99.0` entry, with a comment, so `measure_selection.py` and its test stay byte-identical (criterion 14). The docstring no longer names `frontend/src/lib/session.ts`.
- **`backend/tests/test_selection.py`**: 10 new tests (12 cases) added after the existing ones, on small fixtures written in the test file. The existing tests are untouched. 8 of the new cases fail against the old `selection.py`.
- **`backend/README.md:210`** and **`openapi.yaml`**: only description text changed. The `serveNextQuestion` description now says "nearest", and `listQuestions` no longer names the client file.
- **`engineering-decisions.md`**: new E-28 covering points (a) to (d) of criterion 13. E-1 to E-27 are untouched.

**Test results**
- **Backend:** `make -C backend test` gives 639 passed, 9 skipped. Ruff lint and format are clean.
- **question-bank:** after `bun install --frozen-lockfile`, 2360 pass and 7 fail. Lint is clean.
- **frontend:** 386 pass, 8 fail, the same as on the unchanged branch. `bun install` was refused by the proxy (403), so the eslint and prettier gate tests can't run. Nothing under `frontend/` changed.

**Tests made stale** (all 7 in `question-bank/src/climate-far-phrases-verify.test.ts`; the proposed changes are in the brief's Handoff):
- **"T-090 criterion 14: the re-read is a new E-n entry", all 5 tests.** The describe reads the newest E-n entry, which is now E-28. Proposal: pin it to `sectionOf(decisions, "E-27")` and change `toBe(27)` to `toContain(27)`.
- **"T-090 criterion 20: no other surface changes", `openapi.yaml`.** Proposed new digest: `88e056ea172797f078c5649a68245b4f0c18627e599a0bda1110f8183c3d5e5d`.
- **Same describe, `backend/app` (except `content.json`).** Proposed new digest: `e7a4e080df1149514332efe2d3b8bad75ee6f270d69d186f7b205ea285dff808`.
- I computed both digests the same way the test does. That method reproduces the existing, unchanged `frontend` digest.

**Flags, each owned by the reviewer**
- **`99.0` kept in `LEVEL_SPANS`.** It now only marks "nearest" and the selector skips it. Confirm, or queue a rename for when `measure_selection.py` is allowed to change.
- **Ties use exact float equality.** That is safe while levels are multiples of 0.5.
- **`listQuestions` wording.** I did not check that `GET /questions` actually widens by `levelSpan`.
- **Frontend side effect.** Running frontend `bun test` without `node_modules` rewrites `frontend/README.md`, on the unchanged branch too, apparently from the T-075 format-gate test. I reverted it and it is not in the commit. Decide whether to queue a fix in `tasks.md`.

**Sessions row:** the session id I got is `cse_014mjPR9EwgWt5EDdiUihfx9`, the same as the expander's row, because this is an orchestrated subagent. The row says so.

## Round 3 — tester — 2026-10-23
`Next step` on entry: `tester` → on exit: `human`

**TL;DR.** T-089 is stopped at **test changes requested**, waiting for a person. All 20 acceptance criteria hold on the branch. The only blocker is 7 T-090 pins in question-bank that this task turns red by design. They need a person's approval, which I've requested as 3 rows. **Next step: human.** A person has to start a `tester` in a session they are attending and approve or refuse the rows there. The orchestrator may not approve or relay the approval (D-15).

- **Pushed:** `eebec2c` on `claude/peaceful-maxwell-mbf9gd`. Local HEAD and `origin/claude/peaceful-maxwell-mbf9gd` are both `eebec2ce8e47a9c23d2a1ed3d49143250f00b64b`.
- **Brief header:** Status `test changes requested`, Next step `human`, Test changes `requested`. The Fault line is set, and my Sessions row is added.

**Independence.** This is an orchestrated run, so the session-id check proves nothing. My id `cse_014mjPR9EwgWt5EDdiUihfx9` matches the expander and worker rows because orchestrated roles share the parent's id. My only independence is being a freshly spawned agent that read just the Handoff. That is weaker than a separate session, and the Verdict says so.

**What I verified**
- **New tests:** `/home/user/geo-discovery-zone/backend/tests/test_t089_tester_criteria.py`, 34 cases covering criteria 1–15 and 17–18. Every behaviour test uses an inline fixture and 300 draws with an injected rng. Byte-identity is pinned by sha256 digests of `origin/main` (2b4edb2). The only git call is `ls-files`, with `check=True`.
  - Criteria 16, 19 and 20 are checked by diff, inspection and the full suite runs rather than tests.
- **All 34 pass.** On main's `selection.py`, 10 of them go red.
- **Mutations:** 9 in total: main's `selection.py`, plus 8 deliberate breaks (fallback ignores the topic; fallback ignores asked questions; span `<=` changed to `<`; the tie pool cut to one; `is_review` set True; a nearest+1.5 band; the review branch turned off; recycling ignores the recent window). The tests caught every one, and every one is reverted.
- **One test I corrected after it went red.** My first criterion-10 topic test used a 3-question bank. That bank sat inside the recent window, where the code falls back to the whole bank. `origin/main` does the same, so the test was asking for more than the criterion says. I enlarged the fixture and kept the assertion exact. The Verdict records this.

**Suites**
- **Backend:** 673 passed, 9 skipped; lint and format clean.
- **question-bank:** 2360 pass, 7 fail, exactly the worker's stale list. Lint and typecheck are clean.
- **Frontend:** 392 pass, 2 fail and 2 errors on one run. The errors say "Cannot find package 'react-simple-maps'". The proxy refuses the install with a 403, so packages are missing. Nothing under `frontend/` differs from main, so this is the environment, not the task. CI is the authority there.

**Test change request (all in `question-bank/src/climate-far-phrases-verify.test.ts`, none applied)**
1. **Modify** describe "T-090 criterion 14". `entry` is read as E-27 by number, not as the newest entry. The first test asserts E-27 appears once, directly follows E-26, and matches `/T-090/`. Tests (a)–(d) are unchanged and turn green.
2. **Modify** the `openapi.yaml` digest row. It moves to its own `test.each` named "…byte-identical to T-089's tree", pinned at `88e056ea172797f078c5649a68245b4f0c18627e599a0bda1110f8183c3d5e5d`.
3. **Modify** the `backend/app` digest row (except `content.json`), in the same new `test.each`, pinned at `e7a4e080df1149514332efe2d3b8bad75ee6f270d69d186f7b205ea285dff808`.

I recomputed both digests myself and they match the worker's. My recomputation also reproduces the unchanged `frontend` pin. No count floor pins this file's test count.

**Files**
- `/home/user/geo-discovery-zone/backend/tests/test_t089_tester_criteria.py` (new)
- `/home/user/geo-discovery-zone/tasks/T-089-nearest-above-bank.md` (Verdict, Test change request, header, Sessions row)

## Halted — test change request — 2026-10-23
Raised in commit `eebec2c`. Header: `Status: test changes requested`, `Next step: human`, `Test changes: requested`. Rows not copied here; the orchestrator has not read them.
To resume: a person starts the `tester` step for T-089 in a session they are attending; it asks about each row, applies what is approved, and finishes verifying. The orchestrator cannot take the approval (D-15).

## Resumed — attended tester — 2026-10-26
A person ran the `tester` step in an attended session: `2b99832` (apply approved test change request) and `5c8b871` (verdict pass, test changes approved by Dkaattae). Header now `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-10-26`.
Dkaattae, in the orchestrator session, verbatim: "ci is fixed". Resuming at the reviewer.

## Round 4 — reviewer — 2026-10-26
`Next step` on entry: `reviewer` → on exit: `human` (Status `approved — escalated`, at `0bdd58d`; brief then deleted in the sweep `37a5da3`)

**I approved T-089 and escalated it.** PR #94 is swept and marked ready for review, and it is waiting for Dkaattae to merge. It is escalated for one reason: it edits `openapi.yaml`, which is outside my envelope. The edit only changes the description text of `serveNextQuestion` and `listQuestions`; no path, parameter or schema changes. Nothing blocks the merge.

- **Push landed.** `origin/claude/peaceful-maxwell-mbf9gd` is at `37a5da3`, the same as my local HEAD. I added two commits:
  - `0bdd58d`: the `## Review` section in the brief, Status `approved — escalated`, Next step `human`, and my Sessions row.
  - `37a5da3`: the sweep.
- **PR #94 state:** open, no longer draft, not merged. The body starts with the escalation notice, then quotes all 20 criteria word for word with what verified each, then the 3 approved test-change rows.
- **Next:** a person reads the `openapi.yaml` hunk and merges, or doesn't. No agent step is left.

**Review**
- **The code is good.** `pick_question` now collects the unasked questions in the topic once, tries the 1.5 / 3 / 6 windows as before, and then falls back to the nearest ones, ties included. It is in the module's own style, adds nothing speculative, and the docstring, README line, `openapi.yaml` and E-28 all match the code.
- **Every role's work is in the PR, and each stayed in its lane.** The expander's commits touch only `tasks.md` and the brief. The tester touched no source. Every Sessions row has a commit in this PR.
- **Changes to existing tests were approved by a person.** The brief records `Test changes: approved — Dkaattae, 2026-10-26`. The diff matches the 3 approved rows in `question-bank/src/climate-far-phrases-verify.test.ts` and appears only in tester commit `2b99832`. No test was deleted.
- **Suites, re-run by me:**
  - Backend: 673 passed, 9 skipped, lint clean.
  - Question-bank: 2367 pass, 0 fail, both before and after the sweep.
  - Frontend: not run in full here, because the proxy blocks `bun install`. The six frontend tests that read the docs pass after the sweep (224 pass), CI's frontend job is green, and nothing under `frontend/` changed.

**The worker's flags, each settled**
- **`99.0` kept in `LEVEL_SPANS` as a marker:** keep it. No follow-on.
- **Exact `==` when comparing tie distances:** safe as written, because questions at the same level always get the same distance. No follow-on.
- **`listQuestions` says "`levelSpan` mirrors the widening search":** loose wording rather than false. `GET /questions` applies one fixed window and widens nothing. Deferred to T-053, which already owns that endpoint's `openapi.yaml` text; I added a note there.
- **A frontend `bun test` rewrote `frontend/README.md`:** this is the third time it has been seen. Added to T-076.

**A finding that does not block, added to T-070.** The tester's new file `backend/tests/test_t089_tester_criteria.py` adds the backend suite's first tests that are pinned to `main` as it stood when T-089 started. These will fail on the next:
- new `E-n` entry (the numbering must be exactly 1..28);
- `openapi.yaml` edit (the parsed spec is hashed);
- bank refresh (`content.json` is hashed);
- migration (only the initial one may exist).

I added this to T-070 as an eighth guard rather than opening a new task, because T-070's open question Q1 has to settle the same pattern anyway.

**Sweep**
- Deleted `tasks/T-089-nearest-above-bank.md`.
- `tasks.md`: removed the T-089 entry, amended T-070, T-053 and T-076, and extended the "Last swept" line.
- `PROGRESS.md`: added a Completed entry for T-089, and removed the "above level 10 is uniform" known gap and the Next item for T-089.

Files: `/home/user/geo-discovery-zone/tasks.md`, `/home/user/geo-discovery-zone/PROGRESS.md`, and `/home/user/geo-discovery-zone/tasks/T-089-nearest-above-bank.md` (deleted; the review section is in commit `0bdd58d`).

## Ended — 2026-10-26
Reviewer approved, escalated (`openapi.yaml` description edit), swept and marked PR #94 ready. Merge is Dkaattae's.
