# T-021 — Generator: entities × templates → question drafts — run log

**Task:** T-021 · **Branch:** `claude/amazing-carson-zrp4qz` · **PR:** #80
**Started:** 2026-10-15 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-15
`Next step` on entry: no brief (`tasks/` empty) → on exit: `worker` (`Status: awaiting approval`, `Approved: pending`)

**I wrote the T-021 brief, pushed it, and opened draft PR #80.** Status is `awaiting approval`, Next step is `worker`, and Approved is still `pending`. Next, a person (or the orchestrator, under D-3) fills in the `Approved:` line, and then the worker runs. I recommend Opus for the worker.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-021-generator.md
- **Branch:** `claude/amazing-carson-zrp4qz`. It is recorded in the brief's `Branch:` header, and the PR number (#80) is in the header too.
- **Push landed:** `origin/claude/amazing-carson-zrp4qz` is at `bd06b04`, two commits on top of `main` (`0048c71 T-021 expander: generator` and `bd06b04`, which records the PR number).
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/80, draft. Its body holds the acceptance criteria.
- **Diff scope:** `tasks/T-021-generator.md` (new) and `tasks.md` only, which is within what the expander may write.

**Why T-021:** the start of the run was clean. `tasks/` held only README and TEMPLATE, and T-020 had already been swept on `main`. T-064 waits on T-040, T-070 waits on Q1, and T-084 waits on T-070 (a). T-021 is the first entry whose dependency (T-020) is done.

**What the brief asks for (29 criteria):**
- A pure function in `question-bank/src/` that turns entities × `TEMPLATES` into question drafts.
- Over the committed bank it must return exactly 150 drafts with an empty skip report. I checked the data files: all 50 states have `name`, `capital` and `geometry_id`.
- Exact values for Colorado and Alaska.
- The missing-data edge stated on both sides, reusing the emptiness rule already in `templates-verify.test.ts:362-366`.
- `applies_to` is respected and not reported as a gap.
- Non-string values are skipped rather than turned into text.
- Invalid or duplicate input makes the generator throw.
- Ids are stable and don't clash with the ids in `content.json`.
- Purity, no fun-fact text in any draft, no network, no new dependency, and no edits to `backend/`, `frontend/`, `openapi.yaml` or `data/`.

**Calls the brief makes that the approver should check:**
- **Drafts, not full `Question`s.** Choices and `correctIndex` stay with T-022, `level` with T-023, and tags with T-024. That keeps T-021 free of distractors, but it means the queue entry's "decides what goes in `choices` for `map_click`" is only settled as far as the correct answer goes.
- **How a `map_click` answer is represented.** The answer a child could see is the state's `name`. The FIPS code is carried separately as `answerGeometryId`, so a code is never a label and nothing joins on names. Criterion 29 requires the worker to write this down as the next unused `E-n`.
- **No output is written anywhere.** Whether generated questions get committed is a product decision, and the brief leaves it open for whichever task first needs them on disk.

**`tasks.md` edits:**
- T-021 is marked `doing`.
- T-070's "the next decision entry is E-20" now says to take the next unused number, because T-021 also asks for an `E-n`.
- T-084 has a one-line "skipped again" note.

**Nothing was run:** no build, tests or pipeline. I read the committed data files to confirm which fields are present.
