# T-021 — Generator: entities × templates → question drafts — run log

**Task:** T-021 · **Branch:** `claude/amazing-carson-zrp4qz` · **PR:** #80
**Started:** 2026-10-15 · **Outcome:** ready for merge

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

## Round 2 — worker — 2026-10-15
`Next step` on entry: `worker` (`Status: awaiting approval`) → on exit: `tester` (`Status: awaiting verification`)

**TL;DR.** I built the T-021 generator. Over the committed bank it produces 150 drafts and skips none. In `question-bank/` the full suite passes (1949 tests, 0 fail), and typecheck, lint and format:check are all clean. No existing tests are stale. The brief is now at Status `awaiting verification`, Next step `tester`. It is pushed to `claude/amazing-carson-zrp4qz`: `git log origin/claude/amazing-carson-zrp4qz -1` shows `b0102e1 T-021 worker: generator, entities x templates -> question drafts`.

**Action needed:** the tester must be started in a session with a different id. The worker session id and the task-expander's are the same (`cse_01FsXqnpENQjfQBQc9Pmhmfj`), and both rows in the brief's Sessions table say so.

**Files**
- `/home/user/geo-discovery-zone/question-bank/src/generate.ts` (new):
  - The main function is `generate(entities: readonly Entity[], templates: readonly Template[] = TEMPLATES)`. It returns `{ drafts: QuestionDraft[]; skipped: SkippedPair[] }`.
  - A skip entry is `SkippedPair { templateId, entityId, missing, notText }`. `missing` lists the empty required fields; `notText` lists fields that would have to become text but are not strings.
  - Draft ids come from `draftId`, which returns `gen:<templateId>:<entityId>`.
- `/home/user/geo-discovery-zone/question-bank/src/generate.test.ts` (new): 20 worker tests.
- `/home/user/geo-discovery-zone/engineering-decisions.md`: new entry E-20 (criterion 29).
  - **Draft shape:** a draft is not yet an API `Question`.
  - **`map_click`:** `answer` is the entity's name, and the click target goes in `answerGeometryId`. T-022 should build `choices` as names, plus a parallel list of codes that T-051 can use to match a click.
  - **Option not taken:** using the code itself as the answer, and why it lost.
- `/home/user/geo-discovery-zone/tasks/T-021-generator.md`: Handoff (API, a criterion-to-location table, flagged decisions with owners, how to run), Notes, Status and the Sessions row.

**Decisions I made, each with an owner in the Handoff**
- **Hidden required fields:** a `map_identify` draft also needs `geometry_id`, and a draft whose answer is a code also needs `name`, even if the template's `requires` leaves them out. Otherwise criteria 8 and 11 could not hold. Tester to confirm, or T-024 could move this into `validateTemplate`.
- **Entity with no usable `id`:** the generator throws, as an extension of criterion 19. Tester to confirm, reviewer may overturn.
- **Braces in values:** prompt values are filled in exactly as stored. A value containing `{` is not guarded against, because no entity has one. Reviewer to decide whether to add a guard, which would go with T-026.

**Problems found**
- **Formatter run reformatted an unrelated test:** running `bun run format` before `bun install` used a global prettier, which changed an existing test (`highest-point-metres-verify.test.ts`). I reverted it and none of that change is committed. Run `bun install --frozen-lockfile` first so the pinned 3.9.6 is used.
- **`tasks.md` still says E-20 for T-070:** T-070's "Done when" still names `E-20`, which this task has now taken. The sweep should change it to E-21. I left `tasks.md` alone because it is outside this task's scope.

## Round 3 — tester — 2026-10-15
`Next step` on entry: `tester` (`Status: awaiting verification`) → on exit: `reviewer` (`Status: pass`)

**T-021 tester: pass.** All 29 acceptance criteria hold. In `question-bank/` the full suite passes (2012 pass, 0 fail, with every proxy variable pointed at `127.0.0.1:1`), and typecheck, lint and format:check are clean. The brief now reads Status `pass`, Next step `reviewer`. My commit `a6ed390` is on `claude/amazing-carson-zrp4qz`, and the remote head matches it.

**Independence is the weaker kind.** This is an orchestrated run (`runs/T-021-generator.md` exists). My session id, `cse_01FsXqnpENQjfQBQc9Pmhmfj`, is the same one listed for task-expander and worker. Under the orchestrator that match is expected and proves nothing. My independence rests only on being a freshly spawned subagent that did not see the work or the worker's reasoning, which depends on the orchestrator having spawned me correctly. The Verdict says this. The worker's Handoff asked for a tester with a different id, which this run could not supply, so a human should decide whether that matters.

**What I did**
- **New file `/home/user/geo-discovery-zone/question-bank/src/generate-verify.test.ts`**: 63 tests, one `describe` per criterion. Expected values come from the criteria; I read `generate.ts` only for its signature. Skip-report checks only require the field to be named, so they don't depend on the worker's `missing` / `notText` split.
- **Brief `/home/user/geo-discovery-zone/tasks/T-021-generator.md`**: Verdict written with a criterion → verdict → evidence table, my Sessions row added, Status and Next step updated.
- **Mutation check on `generate.ts`**: 14 real mutations, every one turned at least one test red. All were reverted; `generate.ts` is byte-identical to its backup and `git status` was clean after the commit.
  - Two other mutations stayed green, but neither changed what the code does, so there was nothing for a test to catch.
  - One mutation (the generator writing to `TEMPLATES`) first went unnoticed: earlier tests had already changed the shared export before criterion 20's test took its "before" copy. I fixed criteria 20 and 25 to compare against a copy taken at module load and against the full three T-020 template records; that mutation now fails 2 tests.
- **Criteria 23 and 26 checked against the diff**: `git diff origin/main...HEAD` touches nothing under data, sample-data, backend or frontend, and leaves `openapi.yaml`, `templates.ts`, `package.json` and `bun.lock` alone.
- **Tests made stale: none.** No existing test was modified or deleted.

**Not done**
- **`bun run build` was not run**, because it reaches the network. For criterion 24 I checked instead that nothing `build.ts`, `refresh.ts` or `normalize.ts` imports, directly or through other files, leads to `generate.ts` or `templates.ts`. That is how the criterion itself says byte-identical output is guaranteed.

**For the reviewer:** two of the worker's judgment calls are not covered by any criterion. I left both untested and flagged them in the Verdict.
- **An entity with no usable id makes the generator throw.**
- **No guard against a `{` inside a filled-in value.** Criterion 7 asks for values filled in verbatim and for no brace in any prompt, and a value containing a brace would break one or the other. No committed value has one today.

## Round 4 — reviewer — 2026-10-15
`Next step` on entry: `reviewer` (`Status: pass`) → on exit: `human — apply ### Sweep to apply under ## Review, then mark PR #80 ready. Approved inside the envelope.` (`Status: sweep refused`)

**T-021 is approved and inside the envelope, but the harness refused the sweep.** PR #80 stays draft. A person needs to apply the written-out sweep and then mark the PR ready. Nothing blocks the work, and there is no escalation.

**Status: sweep refused. Next step: human** (D-16)
- **Refused action:** the classifier blocked deleting the brief and editing `tasks.md` / `PROGRESS.md` ("Irreversible Local Destruction"). None of it was applied, and I did not try another route.
- **Where the sweep is:** written out under `## Review` → `### Sweep to apply` in `/home/user/geo-discovery-zone/tasks/T-021-generator.md`. It is mechanical: exact text to replace or insert in `tasks.md` and `PROGRESS.md`, plus `git rm` of the brief. A person applies it, or the orchestrator does after about an hour.
- **Push landed:** commit `c65a221` is on `origin/claude/amazing-carson-zrp4qz` and matches local HEAD. The `Next step: human…` header matches the `human*` check in `blocked-run-notice.yml`, so the PR should get the `waiting on a human` label.
- **PR body:** updated to the verdict, with all 29 criteria and what verified each, how the worker's flags were disposed of, and the queue changes the sweep makes. Draft flag not changed.

**Checks**
- **PR #80:** open, draft, not merged.
- **Every role's work is in the PR:** expander `0048c71`/`bd06b04`, worker `b0102e1`, tester `a6ed390`, plus the orchestrator's run-log commits.
- **Each role stayed in its lane:**
  - the expander touched only `tasks.md` and the brief;
  - the tester touched only `generate-verify.test.ts` and the brief.
- **Constraints held:** nothing under `data/`, `sample-data/`, `backend/` or `frontend/` changed, and `openapi.yaml`, `templates.ts`, `package.json` and `bun.lock` are untouched.
- **Tests (I re-ran them):** in `question-bank/`, 2012 pass / 0 fail, and typecheck, lint and format:check are clean.
- **CI:** `question-bank` and `backend (lint, format, test)` are green. The e2e, integration, frontend and Postgres jobs were still running when I checked, and this diff touches none of their inputs.

**Why it is inside the envelope**
- No dependency was added.
- No `openapi.yaml`, migration or plan change.
- `Test changes: none`.
- No new child-facing text: prompts come only from the templates Dkaattae already approved, and nothing is written or served.
- E-20 is an engineering decision about the data shape, not a product decision.

**Worth a glance, not an escalation** (both noted in the PR body)
- **The brief was approved by the orchestrator without being read.** E-20 sets the shape that six later tasks build on.
- **All roles shared one session id** (P-14).

**Worker's flags, disposed of**
- **Implicit `geometry_id` / `name` requirements:** kept. Deferred to T-024 to move them into `validateTemplate`.
- **An entity with no id throws:** kept, decided here.
- **A non-string `geometry_id` is reported:** kept, decided here.
- **No brace guard on token values:** deferred to T-026.

**Queue changes in the pending sweep**
- **Deleted:** T-021.
- **T-070:** no longer names E-20 (two places).
- **Amended:** T-022 (build on `generate()`, plus E-20's parallel code list), T-024, T-026 and T-051.
- **Added:** nothing. Every finding fit an existing task.

## Halted — sweep refused — 2026-10-15
Halted at 2026-10-15T15:35Z on `Next step: human`, `Status: sweep refused`.
Branch head at the halt: `c65a221`. Per D-16 the orchestrator waits about an
hour for a person; if none has answered by the check-in, it applies exactly
`### Sweep to apply` and leaves the PR draft for a person to mark ready.

## Resumed — sweep applied on instruction — 2026-10-15
Dkaattae, in the orchestrator session, about 15 minutes after the halt: "apply
the sweep now". The orchestrator re-read the header (`Status: sweep refused`),
read only `### Sweep to apply`, and applied exactly that list: `git rm` of the
brief, the `tasks.md` edits (T-021 deleted; T-070, T-022, T-024, T-026, T-051
amended) and the two `PROGRESS.md` edits. Checks in `question-bank/` after the
sweep: format:check, typecheck and lint clean; `bun test` 2012 pass, 0 fail
(proxy variables pointed at `127.0.0.1:1`). PR #80 is left draft: the
orchestrator holds no PR tool. A person marks it ready and merges.

## PR marked ready — 2026-10-15
On Dkaattae's instruction in the orchestrator session ("mark the PR ready"), PR
#80 was taken out of draft. CI on `4a9bf54` was green when it was marked: all
seven check runs succeeded. Merging is Dkaattae's.
