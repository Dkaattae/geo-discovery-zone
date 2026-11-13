# T-111 — Two `us-states.ts` comments still say "the 15 states shipping today" — run log

**Task:** T-111 · **Branch:** `claude/amazing-franklin-j3x3l1` · **PR:** #136
**Started:** 2026-11-13 · **Outcome:** in progress

Orchestrated run of 2 tasks, started by Dkaattae ("start the next two tasks as an orchestrator").

## Round 1 — task-expander — 2026-11-13 15:00Z
`Next step` on entry: `(no brief)` → on exit: `worker`

I expanded T-111 into a light brief and opened draft PR #136 on `claude/amazing-franklin-j3x3l1`. The push landed: `origin/claude/amazing-franklin-j3x3l1` is at `486ee0a`.

- **Status:** awaiting approval
- **Next step:** worker
- **Approved:** pending (the orchestrator stamps it in an unattended run)

**Why T-111.** The queue entries ahead of it all need a person first, and there were no open T-task PRs (the only open PR is #38, P-4):
- **T-085b:** blocked until a person picks a Census source.
- **T-056:** needs a design decision.
- **T-095:** waiting on a person's call between options (a), (b) and (c).
- **T-110:** needs a product wording call from Dkaattae.

**The task.** Two doc comments in `question-bank/src/curated/us-states.ts`, at lines 69 and 80, still say 15 states are what the app serves. The served bank has been 50 states since T-040. The brief asks for those two claims in the past tense, with T-017's region decision still recorded in the same paragraph.

**Acceptance criteria** (light brief, four of them):

| # | What must be true |
|---|---|
| 1 | No line in the file contains `shipping today` or `already served`, and the word `today` does not appear in the region paragraph. |
| 2 | The region paragraph still has `T-017`, `2026-09-18`, `E-9`, a past-tense `15`, all 13 region values and all 15 state names. |
| 3 | Comments only: with comments stripped the file matches `main` at `2634fc8`, the exports are unchanged, and `data/` and `content.json` are byte-identical. |
| 4 | No other file changes beyond the brief and approved test-change rows, and no dependency. This is checked at hand-off rather than by a new committed sha pin (P-17). |

**What to expect downstream**
- **Some existing tests will fail by design.** At least `agriculture-true-wrong-answers-verify.test.ts` "criterion 20" checks a hash of the whole file, so any comment edit breaks it. Others may do the same. The brief's Notes say so; the worker should list them under Tests made stale, and in this run they go to the `ci-fix` (D-20).
- **One stale line is left out of scope.** The docstring at `backend/tests/test_region_vocabulary.py:10` makes the same "already served" claim, but it sits inside a test file.

**What the commits touched:** the brief (new), and `tasks.md`, where T-111 is now marked `doing`. Nothing else.

Files:
- /home/user/geo-discovery-zone/tasks/T-111-us-states-15-states-comments.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/136

Orchestrator: stamped `Approved:` (unattended run).
