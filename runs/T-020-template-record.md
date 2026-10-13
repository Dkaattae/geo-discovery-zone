# T-020 — Template record type and three templates — run log

**Task:** T-020 · **Branch:** `claude/bold-noether-djxpzu` · **PR:** #79
**Started:** 2026-10-13 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-10-13
`Next step` on entry: (no brief) → on exit: `worker`

**TL;DR:** I wrote the brief for T-020 (template record type and three templates) and opened draft PR #79. Both commits are on the remote branch. Status is `awaiting approval`, Next step is `worker`, and Approved is `pending`, so a human has to approve the criteria before the worker runs.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-020-template-record.md
- **Branch:** `claude/bold-noether-djxpzu`, the one this session was assigned. It is recorded in the brief's `Branch:` header.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/79 (draft, against `main`). Its body summarises the criteria; the brief is the authoritative text.
- **Push confirmed:** `origin/claude/bold-noether-djxpzu` is at `656d902` ("record PR #79 in the brief header"), with `50eda07` ("T-020 expander: template-record") before it. The diff against `origin/main` touches only `tasks.md` and the brief.

**Why T-020:**
- **T-064** is blocked on T-040.
- **T-070** is still waiting on Q1.
- **T-084** is still blocked behind T-070 (a), and nobody has decided the split proposed for it.
- **T-020** is the first queue entry with no unmet dependency.

**What the criteria require (27 in total):**
- **New module:** `question-bank/src/templates.ts` exports four things:
  - `Template`, with exactly the nine fields from plan §1.2
  - `TEMPLATES`, holding exactly three templates: `tpl-identify-on-map`, `tpl-capital-of` and `tpl-click-the-map`
  - `DISTRACTOR_STRATEGIES`, a set of strategy names only
  - `validateTemplate(unknown)`, which returns a list of problems and never throws
- **Pinned values:**
  - `tpl-capital-of` matches the plan's example record field for field.
  - The identify prompt is the served bank's exact wording, `"Which state is highlighted?"`.
  - The click template answers on `geometry_id`, following the "join on codes, never on names" rule.
- **Validator bounds** are given on both sides of each edge (for example `base_difficulty` 0 and 18 are accepted, -0.5 and 18.5 rejected).
- **Data check:** every field a template requires is present and non-empty in all 50 committed state files.
- **Negative criteria:**
  - No dependency change.
  - No built file changes.
  - Nothing changes outside `question-bank/`.
  - No pre-existing test is modified.
  - No test reaches the network.
- **Gates:** typecheck, lint, format:check and the full `bun test` all pass.

**Choices I made that the approver should look at:**
- **Identifier spelling:** the neighbours-first strategy is pinned as `neighbours_first`, and both map templates use it.
- **Left to the worker:** `base_difficulty` and `min_age_band` for the two map templates must stay in range, and the worker records the values it picks in the Handoff.
- **No extra fields:** a tenth field such as `topic` is a validation failure on purpose. Whether templates carry tags is left to T-024.

**Something I found during the survey:** `tasks.md` T-051 says the answer payload has a field for a tapped geometry id. It does not: `openapi.yaml`'s `AnswerRequest` has no such field, and `backend/app/grading.py:39` grades `map_click` as a choice format. I added a correction to T-051's entry. Apart from that, my `tasks.md` edits mark T-020 as `doing` and note that T-084 was skipped again. I did not touch `PROGRESS.md`.

I followed the git-only rule: no build, test or pipeline commands were run.

## Approval — 2026-10-13
The harness refused an unattended orchestrator stamp. Dkaattae was present in
the orchestrator session and approved the brief there ("Approve, run worker").
The orchestrator recorded that approval in the `Approved:` line.

## Round 2 — worker — 2026-10-13
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** T-020 is built and pushed. Commit `cec0bd4` is the head of `origin/claude/bold-noether-djxpzu`. In `question-bank/`: full `bun test` 1839 pass / 0 fail; `typecheck`, `lint` and `format:check` exit 0. Tests made stale: none. Status is now `awaiting verification`, Next step `tester`.

**Files**
- `/home/user/geo-discovery-zone/question-bank/src/templates.ts` (new). Exports:
  - the four names the brief fixes: `Template`, `TEMPLATES`, `DISTRACTOR_STRATEGIES` (`neighbours_first`, `sibling_capitals_same_region`; no `"random"`), `validateTemplate`
  - extras: `QUESTION_FORMATS`, and the types `QuestionFormat`, `DistractorStrategy`, `AgeBand`, `EntityField`
- `/home/user/geo-discovery-zone/question-bank/src/templates.test.ts` (new): 17 tests. They call the code directly and read the 50 committed state files. No network.
- `/home/user/geo-discovery-zone/tasks/T-020-template-record.md`: Handoff with a criterion-to-location table, Notes, Sessions row, Status and Next step.
- `types.ts` is unchanged. The runtime lists of `Entity` keys and `EntityType` members sit in `templates.ts`, tied to those types with `satisfies Record<…, true>`.

**Criterion 15's mutation rule, checked by hand:** I added `flag_url?: string` to `Entity`. `bun run typecheck` then failed with TS2741 at `templates.ts`. I reverted the change.

**Built output didn't move:** `bun run build -- --offline` exited 0 and left `data/` byte-identical. `build.ts`, `refresh.ts` and `normalize.ts` do not import `templates.ts`.

**Values I chose (criterion 7):**
- `tpl-identify-on-map`: difficulty 2, age band 1.
- `tpl-click-the-map`: difficulty 3, age band 1.
- Click-the-map prompt: `"Tap {name} on the map."` The reviewer should read this wording.

**Decisions that need an owner:**
- **Validator is stricter than the brief:** it also rejects duplicates in `applies_to`, `{}`, unmatched braces and an empty prompt. None of this contradicts a criterion. Reviewer to confirm.
- **`QUESTION_FORMATS` is a hand copy of the `openapi.yaml` enum:** nothing keeps the two in step. Reviewer to decide whether a cross-check goes into `tasks.md`, probably under T-024.

**Two things to know:**
- **Status line was inconsistent:** the brief read `awaiting approval` even though `Approved:` named Dkaattae. I treated the named approval as the gate.
- **Same session id as the expander:** this session's `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01UpEFQfyRxWfuVGBtPaogEo`, which matches the expander's row. The tester must run in a different session. I recorded this in the Sessions table.

## Round 3 — tester — 2026-10-13
`Next step` on entry: `tester` → on exit: `reviewer`

**T-020 tester verdict: pass.** All 27 criteria hold. I added 90 tester tests and all of them pass. The full question-bank suite is 1929 pass / 0 fail, and typecheck, lint and format:check all exit 0. The commit is `99e36fb` on `claude/bold-noether-djxpzu`, and `origin` points at the same sha, so the push landed. In the brief, Status is now `pass` and Next step is `reviewer`.

**This is the weaker kind of independence.** The run is orchestrated (`runs/T-020-template-record.md` exists), and `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01UpEFQfyRxWfuVGBtPaogEo`, the same id as the worker's row. So the session check proves nothing. The only separation is that I was spawned fresh with my own context window and never saw the worker's reasoning, which relies on the orchestrator having spawned me correctly. The Verdict and my Sessions row both say this.

**What I committed:**
- `/home/user/geo-discovery-zone/question-bank/src/templates-verify.test.ts` (new): one `describe` per criterion, covering 1–21 and 23's import check. Expected values come from the brief and plan §1.2, not from the code.
- `/home/user/geo-discovery-zone/tasks/T-020-template-record.md`: the Verdict (a table with one row per criterion), the tester Sessions row, Status and Next step.

**Criteria I checked by hand, not in a test** (a test can't use a git revision, under `git-exit-guard`):
- **22 and 23:** no diff from `origin/main` for `package.json`, `bun.lock`, `data/`, `sample-data/` or `src/fixtures/`.
- **23, build:** `bun run build -- --offline` exits 0 and leaves the tree unchanged. Its stdout matches main's build, run in a worktree, except for absolute paths.
- **24:** the only changes outside `question-bank/` are `tasks.md`, the brief and the orchestrator's run log.
- **25:** no pre-existing test was modified or deleted.

**Mutations** (all reverted, tree clean afterwards):
- **Criterion 15's tie to `Entity` holds:** adding `flag_url?: string` to `Entity` makes typecheck fail.
- **My tests catch broken checks.** Each of these turned one or more tests red:
  - widening the difficulty bound
  - accepting age band 0
  - turning off the "answer_field must be in requires" check
  - dropping the extra-key problem
  - turning off the placeholder check
  - loosening the id pattern (4 tests red)
  - changing the click template's `answer_field`
- **One mutation stayed green, correctly:** making the check throw on `null` changed nothing, because the `try/catch` around it still returns a non-empty list, which is what criterion 10 asks for.

**For the reviewer** (neither is a failure):
- **Click prompt:** it is `"Tap {name} on the map."` (the brief's "Child-facing text").
- **`QUESTION_FORMATS`:** it is a hand copy of the openapi enum, and nothing checks the two against each other.

No test changes were needed.

## Round 4 — reviewer — 2026-10-13
`Next step` on entry: `reviewer` → on exit: `human`

**TL;DR:** I approved T-020 but escalated it, because there is a new prompt a child will read: `"Tap {name} on the map."`. The harness then refused the sweep, so nothing from it is applied. The brief is now `Status: blocked`, `Next step: human`, and PR #79 is still **draft**. A person needs to apply the sweep, read the prompt, then mark the PR ready and merge it.

**Status:** I used `blocked`, not `sweep refused`, because D-16 says an escalated PR gets `blocked`. That means the orchestrator's one-hour fallback does not apply.

**Push:** landed. The branch head is `e939516`, both locally and on `origin/claude/bold-noether-djxpzu`.

**Review**
- **Every role's work is in the PR:** expander `50eda07` and `656d902`, worker `cec0bd4`, tester `99e36fb`.
- **Each role stayed in its own files.** The expander touched only `tasks/` and `tasks.md`; the tester touched only its test file and the brief.
- **Nothing changed outside the brief's Constraints.** No dependency added. Nothing changed in `openapi.yaml`, `backend/`, `frontend/` or the built data. No existing test was changed.
- **My own re-run in `question-bank/`:** typecheck, lint and format:check all exit 0; `bun test` gives 1929 pass, 0 fail.
- **The code fits the codebase.** It is small, nothing in it is speculative, and adding a field to `Entity` without listing it fails typecheck.

**Findings (none block; each added as a note to a task that already owns the area):**
- **Formats list (T-024):** `QUESTION_FORMATS` is a hand copy. Nothing ties it to the backend's `QuestionFormat` enum in `backend/app/models.py`, which is the source of truth under E-14. T-024 gets the cross-check.
- **Click-the-map answers (T-021):** that template's answer is a `geometry_id`, but `map_click` is graded by `choiceIndex`. T-021 has to decide what goes in `choices`, and a FIPS code must never be shown to a child. T-021 should also copy `TEMPLATES` rather than change it.

**Worker flags, all settled:**
- **Stricter validator:** accepted.
- **Strategy comments:** left to T-022.
- **Difficulty and age-band values:** accepted for now; T-023 and T-025 tune them.
- **One session id across the run:** left to P-14.

**Escalation question for the person:** "Tap" is a little off for mouse users. "Find {name} on the map." works for both.

**Refused sweep:** the permission check refused the sweep as "Irreversible Local Destruction". It would have deleted the brief and edited `tasks.md` and `PROGRESS.md`. I did not look for another way to make those edits. The exact edits are written out under `### Sweep to apply` in the brief, ready to copy:
- delete the brief;
- remove the T-020 entry from `tasks.md`;
- add "Since T-020" notes to T-021, T-022, T-024 and T-026;
- add a Completed-tasks entry and a pipeline bullet to `PROGRESS.md`.

**PR body:** rewritten with the escalation note at the top, the criteria and what verified each, and the findings. The PR stays draft.

**Commits:**
- `56ef29d`: review written into the brief
- `e939516`: sweep written out, status set to blocked

**Files:**
- /home/user/geo-discovery-zone/tasks/T-020-template-record.md
- /home/user/geo-discovery-zone/question-bank/src/templates.ts

## Halted — 2026-10-13
Header at halt: `Status: blocked`, `Next step: human` (branch head `e939516`).
The reviewer asks, quoted: "A person needs to apply the sweep, read the prompt,
then mark the PR ready and merge it." and "'Tap' is a little off for mouse
users. 'Find {name} on the map.' works for both."
`Status: blocked` is not `sweep refused`, so the D-16 one-hour fallback does not
apply; the orchestrator does not apply the sweep. Run ends here.
