# T-111 — Two `us-states.ts` comments still say "the 15 states shipping today"

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-111
**Branch:** `claude/amazing-franklin-j3x3l1`
**PR:** opened draft at expand time (number recorded in the Sessions row below)
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-13 | cse_011oDiJfSMW5AuCAW3Bk9Ste |

> **Light brief** (`process.md`, "The light path, for S-sized tasks"): an `S`
> task, comments only, one file, no text a child reads, nothing in
> `openapi.yaml`, a migration or the plan. Goal, Out of scope, Constraints and
> Context are dropped; the **Notes** below carry the two things a worker and
> tester would otherwise trip on.

## Acceptance criteria

"The region paragraph" means the doc-comment paragraph in
`question-bank/src/curated/us-states.ts` that begins `**\`region\` vocabulary
(T-017, 2026-09-18).**` and runs to the end of that `/** … */` block (on `main`
at `2634fc8`, lines 67–91).

1. **No present-tense "15 states" claim is left in the file.** In
   `question-bank/src/curated/us-states.ts`, no line contains the phrase
   `shipping today`, and no line contains `already served` (case-insensitive,
   either phrase). These are the two claims on `main`'s lines 69 and 80. The
   region paragraph also contains no occurrence of the word `today`.
2. **T-017's decision is still recorded, in the same paragraph.** The region
   paragraph still contains: the strings `T-017`, `2026-09-18` and `E-9`; the
   word `15` or `fifteen` at least once, in a sentence that places it in the
   past (for example "the 15 states served at the time"; a reviewer judges the
   tense, a test checks the number is present); each of the 13 region values
   (`Great Basin`, `Great Lakes`, `Great Plains`, `Mountain West`,
   `New England`, `Northeast`, `Pacific`, `Pacific Northwest`, `Pacific West`,
   `South Central`, `Southeast`, `Southwest`, `Upper Midwest`) in backticks;
   and each of the 15 state names (`Colorado`, `Florida`, `Texas`, `Alaska`,
   `Hawaii`, `Maine`, `Michigan`, `Louisiana`, `California`, `New York`,
   `Arizona`, `Kansas`, `Washington`, `Minnesota`, `Nevada`) in backticks.
3. **Comments only: no behaviour moves.** With every comment removed (`//` line
   comments and `/* … */` blocks), `question-bank/src/curated/us-states.ts` is
   identical to `main`'s at `2634fc8` apart from whitespace. Every value the
   module exports deep-equals `main`'s, and `question-bank/data/` and
   `backend/app/data/content.json` are byte-identical to `main`'s.
4. **Nothing else changes.** The PR's diff against `main` touches no file
   other than `question-bank/src/curated/us-states.ts`, this brief, and test
   files changed only through an approved Test change request or CI fix plan
   row (D-14, D-18, D-20). No dependency, lockfile or `package.json` changes.

Criteria 1 to 3 are checked against the task branch's tree. Criterion 4 is a
no-change check on this PR. **Verify it at hand-off** (the diff command and its
output in the Verdict), and do not add a committed sha256 pin for it. A pin
like that stays in the suite after merge and goes red on the next task that
touches the tree (P-17).

## Notes

- **Expect whole-file pins to go red.** At least
  `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`
  "criterion 20: curated/us-states.ts is byte-identical to main's" hashes this
  file whole (`MAIN_FILE_SHA`, pinned at `a42b71b`). Other tests may hash
  `question-bank/src/` or the tracked tree too (P-17). The worker leaves them red
  and lists them under **Tests made stale**. They reach a person through the
  tester's Test change request, or under the orchestrator through the `ci-fix`'s
  plan (D-20). They are stale by design, so a red pin does not mean criterion 3
  failed.
- **What is already true (survey, 2026-11-13):** no test reads the two stale
  phrases. `grep` finds `shipping today` and `already served` only in
  `us-states.ts` lines 69 and 80, and in
  `backend/tests/test_region_vocabulary.py` line 10. The served bank has been
  the pipeline's 50 states since T-040 (PR #88, E-24).
- **Not this task:** `backend/tests/test_region_vocabulary.py` line 10's
  docstring ("the 15 states already served keep exactly the region…") describes
  T-017's criterion 3 as it stood, inside a test file, and is left alone. If a
  reviewer thinks it should change, that is a new `tasks.md` entry. The other
  present-tense wording in the paragraph ("`content.json` already ships for
  them", line 82) is still true: those 15 states keep those regions in today's
  50-state `content.json`. The worker may reword it for flow, but criterion 1
  does not require it.
- **Context, if wanted:** `engineering-decisions.md` E-9 (the region decision
  this paragraph records), E-24 (the bank the app serves now), and
  `PROGRESS.md`'s T-017 line.

## Handoff

## Verdict
