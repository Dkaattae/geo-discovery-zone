# T-020 — Template record type and three templates — run log

**Task:** T-020 · **Branch:** `claude/bold-noether-djxpzu` · **PR:** #79
**Started:** 2026-10-13 · **Outcome:** in progress

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
