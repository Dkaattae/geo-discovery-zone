# T-040 — Loader: pipeline JSON → the served bank — run log

**Task:** T-040 · **Branch:** `claude/festive-edison-nuwc27` · **PR:** #88
**Started:** 2026-10-16 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-10-16
`Next step` on entry: (no brief) → on exit: `human`
Status on exit: `blocked` · Approved: `pending` (not stamped — run halted before any build step) · Push: `9ae4331`

**I expanded T-040 (the loader that turns pipeline JSON into the bank the app serves), then halted. It needs three product decisions from a person.** The brief is committed and pushed, and draft PR #88 is open. The run should stop here.

- **Status:** `blocked`. **Next step:** `human`. **Approved:** `pending`.
- **Branch:** `claude/festive-edison-nuwc27`, recorded in the brief's `Branch:` header.
- **Push confirmed:** `origin/claude/festive-edison-nuwc27` is at `9ae4331`. Against `origin/main` it changes only `tasks.md` and `tasks/T-040-pipeline-loader.md`, which are within the expander's allowed files.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/88 (draft, number recorded in the brief header).

**Why T-040 and not T-026.** T-026 is the first queue entry whose `Depends on:` is met. But its Done-when needs a generated question to be "loaded", and nothing loads one until T-040 lands. I added a skip note to T-026's entry in `tasks.md` and a halt note to T-040's.

**The questions a person must answer (in the brief and in the PR body):**
- **Q1 — the 26 hand-written questions and 15 `funFactDetail` texts.** These are reviewed explanations for children, and generated questions have none. The choice is between:
  - (a) replace them with generated questions only;
  - (b) serve both, which gives 15 states duplicate questions;
  - (c) keep the hand-written question where one exists and fill the other 35 states with generated ones.
- **Q2 — commit the generated question output or not.** `CLAUDE.md` reserves this call for a person. The choice is between:
  - (a) commit it, with a test that a fresh regeneration matches, like E-6 has for the entity bank;
  - (b) generate it in the Docker build's Node stage.
- **Q3 — serve `map_click` before T-051.** The client cannot render it yet. I recommend excluding it and leaving `choiceGeometryIds` to T-051.
- **Proposed default the person can overrule:** Louisiana's id changes from `us-state-lo` (in `content.json`) to `us-state-la`. Any stored mastery under the old id is orphaned, not migrated.
- **Proposed split:** a `question-bank` writer for the generated questions, and separately the Python loader.

**What the survey found already in place:**
- `store.ensure_content_loaded` (`backend/app/store.py:88`) already loads idempotently, keyed on a content version.
- The four pipeline stages already produce 150 questions, but nothing writes them anywhere.
- The pipeline is snake_case, while `grading.build_reveal` reads camelCase payload keys.

**What the brief still lacks.** It has 13 draft criteria that hold whichever way Q1–Q3 go. The criteria that depend on the answers (counts, which questions are served, file location, how explanations are handled) are left for the expander's next pass.

**For whoever runs the tester step later.** Three existing tests will need a Test change request, so the tester step must be attended:
- the 15/26 counts in `backend/tests/test_content_api.py`;
- `backend/tests/test_region_vocabulary.py:106`;
- `question-bank/src/hand-check-levels-verify.test.ts` criterion 14.

**To resume:** answer Q1–Q3 in the brief, set `Next step: task-expander`, commit, and start a run.

The brief file changed on disk after my last commit, and I did not re-read it, so the pushed `9ae4331` is the version I wrote.

## Halted — 2026-10-16
Header reads `Status: blocked`, `Next step: human`. The expander asks a person to answer Q1–Q3 (quoted above) in the brief, then set `Next step: task-expander`. Checkpoint: working tree clean after the expander returned; branch head `9ae4331` matched origin.
