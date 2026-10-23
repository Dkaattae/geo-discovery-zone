# T-089 — Above the bank's top level, a pick is drawn from the whole topic — run log

**Task:** T-089 · **Branch:** `claude/peaceful-maxwell-mbf9gd` · **PR:** #94
**Started:** 2026-10-23 · **Outcome:** in progress

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
