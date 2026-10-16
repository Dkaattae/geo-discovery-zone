# T-086 — `seed-level.ts` and E-22 loose ends after T-025 — run log

**Task:** T-086 · **Branch:** `claude/wonderful-heisenberg-0ekakv` · **PR:** #86
**Started:** 2026-10-16 · **Outcome:** ready for merge

## Round 1 — task-expander — 2026-10-16
`Next step` on entry: (no brief) → on exit: `worker` (after a human approves below)

**TL;DR:** I wrote the T-086 brief and opened it as draft PR #86. It sits at `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. The push is on `origin/claude/wonderful-heisenberg-0ekakv`: `git log` there shows `88b85d6`, and the local branch is level with it. Next, a person approves the brief (or the orchestrator stamps it under its rules), then the `worker` runs.

**Pick**
- **T-086 — `seed-level.ts` and E-22 loose ends after T-025** (S). It is the first entry in the queue whose dependencies are done.
- **Skipped:**
  - T-064 depends on T-040, which has not run.
  - T-070 is waiting on Q1.
  - T-084 is gated on T-070. I added a "Skipped again, 2026-10-16, for T-086" line to its entry.
  - T-085 is waiting on a person.
- `tasks/` held only README and TEMPLATE when I started, so the last cycle was swept.

**Files** (my commits touch only `tasks/` and `tasks.md`)
- /home/user/geo-discovery-zone/tasks/T-086-seed-level-loose-ends.md — the brief: 14 criteria, a full template rather than a light one because the criteria run past four. `Branch:` is `claude/wonderful-heisenberg-0ekakv` and `PR:` is #86.
- /home/user/geo-discovery-zone/tasks.md — T-086 marked `doing`, plus the T-084 skip line.
- Commits: `146c64f T-086 expander: seed-level-loose-ends` and `88b85d6 T-086 expander: record PR #86 in the brief header`.
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/86 (draft, criteria in the body).

**What the survey found that the queue entry did not say**
- **The band label is already right.** The entry says level 3.5 is "between medium and hard". But `band_label` in `backend/app/levels.py` and `bandLabel` in `frontend/src/lib/level.ts` both render band 1.5 as "Hard". So E-22's "1st grade (hard)" matches what the app shows. Criteria 7 and 8 ask E-22 to state band 1.5, the Medium/Hard boundary, without calling it "medium".
- **There is a second stale future-tense T-025 reference.** It is "so T-025 can set it", in E-22's `familiarity_bonus` bullet. I added it as criterion 6 under the entry's "E-22 is true".
- **`levelFor` and `nearDistractorCount` have no importer, and no caller passes `weights`.** Their only mention outside `seed-level.ts` is as string pins in `hand-check-levels-verify.test.ts` criterion 10.

**Decisions I made that a reviewer may want to check**
- **Keep-or-drop is left to the worker.** The queue entry allows either, but the criteria require E-22 to record the choice for each of the three items. A "kept" choice must name a real use, a caller or a queued task id. The test pin does not count as a use, and neither does "harmless".
- **Removing anything turns two existing tests red by design:** `hand-check-levels-verify.test.ts` criterion 10 (signature pins) and criterion 12 (the `weights.familiarity_bonus;` baseline line). That needs a Test change request, which a person has to approve in an attended tester session (D-14, D-15). The brief says to plan for that.
- **Worker model:** Sonnet is enough.

I ran no build, test or pipeline command. Bash was used only for git, plus two small file edits.

## Round 2 — worker — 2026-10-16
`Next step` on entry: `worker` (after a human approves below) → on exit: `tester` — **attended**: one pre-existing test is stale by design and needs a Test change request a person approves (D-14, D-15)

**TL;DR:** T-086 is built and pushed in commit `23b3227` on `claude/wonderful-heisenberg-0ekakv`. I removed all three unused pieces in `seed-level.ts` and corrected E-22 in place. Levels and weights are unchanged. One existing test now fails on purpose, so the tester step needs a person present to approve a Test change request (D-14, D-15).

- **Status:** `awaiting verification`
- **Next step:** `tester`, attended by a person
- **Push:** `git log origin/claude/wonderful-heisenberg-0ekakv -1` shows `23b3227 T-086 worker: …`

**Why everything was removed:** the brief only lets you keep an item if a caller in the repo or a queued task uses it. Nothing does, and T-085 does not name a call to `levelFor`. So `levelFor`'s `weights` parameter, the `export` on `levelFor` and the `export` on `nearDistractorCount` are all gone.

**Files changed:**
- **`/home/user/geo-discovery-zone/question-bank/src/seed-level.ts`**
  - Both exports and the `weights` parameter are removed.
  - `levelFor` now opens with `const weights = LEVEL_SEED_WEIGHTS;`, so the rest of its body is byte-identical. Because the `weights.familiarity_bonus;` line is unchanged, criterion 12's baseline test still passes. That leaves one stale test instead of two.
  - The header comment no longer says T-025 will tune it.
- **`/home/user/geo-discovery-zone/engineering-decisions.md`** (inside E-22 only):
  - New bullet, "What the module exports", records the three removals and why.
  - The `familiarity_bonus` sentence that said T-025 would set it is reworded.
  - "Revisit when" now names T-085 instead of T-025; the other three triggers are kept.
  - The band paragraph now gives `3.5 - 2 = 1.5`: the Medium/Hard boundary, which the app shows as Hard.
- **`/home/user/geo-discovery-zone/tasks/T-086-seed-level-loose-ends.md`:** Handoff, Notes, my Sessions row, Status and Next step.

**Test now failing (stale):**
- **Test:** `hand-check-levels-verify.test.ts` › `T-025 criteria 10-13: what must still hold` › `criterion 10: exported names and function signatures of seed-level.ts equal aa88101's`.
- **Proposed fix:** take the two removed entries out of `AA88101_EXPORT_SIGNATURES` and keep the other six pinned.

**Suite results:**
- **question-bank:** 2211 pass, 1 fail (the stale test). Typecheck, lint and format check are clean.
- **backend:** 537 passed, 9 skipped.
- **frontend:** 375 pass, 1 fail. This is the 403 already noted in `PROGRESS.md`: the agent proxy blocks the `pkg.dev` registry, so `react-simple-maps` can't install. I changed no frontend files, so CI has to close this part of criterion 14.
- **Side effect:** a frontend lint test rewrote `frontend/README.md` while dependencies were half-installed. I reverted it; the tester may see the same thing.

**Decisions for others:**
- **Tester:** criterion 13's diff also includes `runs/T-086-seed-level-loose-ends.md`, which the orchestrator wrote. The criterion's list of allowed files doesn't name `runs/`, so it's your call whether that counts.
- **Reviewer:** confirm removing all three, or send it back to `task-expander` if T-085 is expected to need `levelFor` exported. Also confirm the local-const approach in `levelFor`.
- **Orchestrator / process owner:** the session-id variable returns the orchestrator's id to every role. My Sessions row therefore matches the expander's, so the table can't show that the worker and tester ran in separate sessions in this run.

## Round 3 — tester — 2026-10-16
`Next step` on entry: `tester` — **attended**: one pre-existing test is stale by design and needs a Test change request a person approves (D-14, D-15) → on exit: `human` — start an **attended** `tester` session for T-086 to approve or refuse the Test change request row below (D-14, D-15)

**TL;DR: T-086 is halted at `test changes requested`, and the next step is a human.** Criteria 1–13 hold. Criterion 14 (whole suite green) does not yet: exactly one existing test is red, and it went stale because of this task's own change. I wrote a Test change request asking to modify it. Only a person can approve it, in an attended `tester` session, so I changed no existing test.

**Independence:** this is an orchestrated run (`runs/T-086-seed-level-loose-ends.md` exists). My `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_01H1X3vo49b7U5nujJi7mYCb`, the same id the brief lists for task-expander and worker, so the session check proves nothing. My independence rests only on being a freshly spawned subagent that did not see the work. That depends on the orchestrator having spawned me correctly, which I cannot check myself. The Verdict says this.

**Pushed:** commit `4009ee5` ("T-086 tester: verify criteria, request approval for one stale test") is on `claude/wonderful-heisenberg-0ekakv`. That branch is the brief's `Branch:` header and the one I was standing on. I fetched the remote afterwards and its head equals my HEAD.

**What I did:**
- **New test file:** `/home/user/geo-discovery-zone/question-bank/src/seed-level-loose-ends-verify.test.ts`, 23 tests covering criteria 1–12, all green. The baselines at `41811f9` come from a git worktree of that commit and are stored as sha256 digests:
  - the 150 levels by id;
  - `LEVEL_SEED_WEIGHTS`;
  - `engineering-decisions.md` outside E-22's body;
  - the hand-check table.
- **Mutations:** I made six, and each turned its matching test red. All are reverted.
  - re-export `levelFor`
  - re-add the `weights` parameter
  - change a weight
  - restore E-22 to its `41811f9` text
  - "1st grade (hard)" → "(medium)"
  - edit E-1
- **Brief updated** (`/home/user/geo-discovery-zone/tasks/T-086-seed-level-loose-ends.md`):
  - header: Status `test changes requested`, Next step `human`, Test changes `requested`, plus a Fault line;
  - my tester row in the Sessions table;
  - a `## Test change request` section and a `## Verdict` section.

**Test change request (one row):**

| Test | Action | Why stale | Becomes |
|---|---|---|---|
| `question-bank/src/hand-check-levels-verify.test.ts` › "T-025 criteria 10-13: what must still hold" › "criterion 10: exported names and function signatures of seed-level.ts equal aa88101's" (added in `236b0e0` by the T-025 tester) | modify | It pins `export function nearDistractorCount(…)` and `export function levelFor(…, weights …)`. Criteria 2–4 removed both exports. | An exact-equality check on the six remaining export signatures, unchanged from today's pin |

**Suite on this branch:**
- **question-bank:** 2234 pass, 1 fail (the stale pin above). Typecheck, lint and format check are clean.
- **Backend:** 537 passed, 9 skipped.
- **Frontend:** 375 pass, 1 fail. `react-simple-maps` is missing because `bun install` gets a 403 from the proxy, the known issue in `PROGRESS.md`. No frontend file is changed.
- **PR CI:** I could not read it, because `gh pr checks` goes through GraphQL, which returns 403 here.

**For the reviewer, criterion 13:** the diff also contains `runs/T-086-seed-level-loose-ends.md`, which is the orchestrator's run log and not task output. I counted criterion 13 as met; the reviewer may overrule that.

**To finish:** a person starts an attended `tester` session for T-086 and approves or refuses the row. That tester applies what was approved, reruns the whole suite, and records pass or fail.

## Halted — test change request — 2026-10-16
Raised in commit `4009ee5`. Header reads `Test changes: requested`, `Status: test changes requested`, `Next step: human`.

What a human has to decide: approve or refuse the tester's Test change request. Per D-15 that approval must be given in an attended `tester` session for T-086, not to the orchestrator. Once that tester finishes, its header names the next role and a new run starts from there.

## Resumed — 2026-10-16
The person resolved the halt in an attended `tester` session; I neither saw nor relayed the approval. Branch head on resume: `f196d58` ("T-086 tester: record approval (Dkaattae) and pass verdict"), after `a0bec65` ("T-086 tester: apply approved test change request"). Header now reads `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-10-16`. The person wrote in this session: "ci is green. please proceed". Verdict tally: 0 fail, 0 blocked.

## Round 4 — reviewer — 2026-10-16
`Next step` on entry: `reviewer` → on exit: `human` merges PR #86 (inside the envelope; no escalation) — read from the header at `3a5171f`; the sweep in `f88362e` then deleted the brief.

**I approved T-086 with no escalation, and the sweep is pushed.** PR #86 is now marked ready for review, nothing in it needs a separate decision, and a person needs to merge it. Its new head is `f88362e` on `claude/wonderful-heisenberg-0ekakv`. CI was still running on that head when I finished; on the previous head (`7f5f3ff`) all six jobs passed.

**What I checked**
- **Every role's work is in the PR.** The expander, worker, tester (orchestrated and attended) and orchestrator each have commits on the PR. No work is sitting on another branch.
- **Each role stayed in its lane.** The expander changed only `tasks/` and `tasks.md`, and the tester changed only tests and the brief. The one older test that changed is `hand-check-levels-verify.test.ts` criterion 10, the pin on the module's exported function signatures. That change is the Test change request row Dkaattae approved, and it came in the tester's commit `a0bec65`.
- **The diff is small and fits the module.** It removes the unused `weights` parameter from `levelFor` and the `export` on `levelFor` and `nearDistractorCount`, and corrects E-22 in place. No level or weight moved, no dependency was added, and nothing changed that a child reads, the API contract or the schema.
- **The question-bank suite passes on my rerun, after the sweep as well:** 2235 pass, 0 fail, and typecheck, lint and format:check are clean.

**The worker's flags, decided**
- **Remove all three pieces: confirmed.** T-085 will edit `levelFor` in place, so it needs neither an export nor an alternate-weights argument.
- **`const weights = LEVEL_SEED_WEIGHTS;` inside `levelFor`: confirmed.** It keeps the function body unchanged and matches how the module's other helpers take their weights.
- **The `runs/` file under criterion 13: ruled met.** `runs/` is where the orchestrator is supposed to write its log, so it is not task output.
- **One session id for every role:** this is already ticket `P-14`, so there was nothing new to file.

**One finding that does not block.** The tester's new `question-bank/src/seed-level-loose-ends-verify.test.ts` permanently pins the 150 seeded levels, `engineering-decisions.md` outside E-22, and the count of `## E-n` headings. The next task that adds a decision entry will turn it red and need a person to approve a test change. I did not send it back: the tester encoded the criteria faithfully, and whether such checks should stay in the suite is the open loop question in P-17. Instead I added a "Since T-086" note to P-17, T-070, T-085 and T-026, saying which of these checks each one will break.

**Commits pushed and confirmed on the remote**
- `3a5171f` T-086 reviewer: approve, record review (adds the `## Review` section, Status and a Sessions row to the brief)
- `f88362e` T-086 reviewer: the sweep. It deletes the brief and the T-086 queue entry, logs the task in `PROGRESS.md` under "Completed tasks", and amends T-070, T-085, T-026 and P-17.

I updated the PR body with all 14 criteria word for word and what verified each, the decisions above, and what I chose not to do.

Files:
- /home/user/geo-discovery-zone/tasks.md
- /home/user/geo-discovery-zone/PROGRESS.md
- /home/user/geo-discovery-zone/process-tasks.md
- /home/user/geo-discovery-zone/question-bank/src/seed-level-loose-ends-verify.test.ts
- /home/user/geo-discovery-zone/tasks/T-086-seed-level-loose-ends.md (deleted in the sweep)

## Ended — 2026-10-16
Reviewer approved and marked PR #86 ready. The PR is Dkaattae's to merge. Run over.
