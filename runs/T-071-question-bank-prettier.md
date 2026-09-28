# T-071 — `question-bank/` is formatted by a pinned prettier, and CI gates it — run log

**Task:** T-071 · **Branch:** `claude/nice-euler-247a4f` · **PR:** #63
**Started:** 2026-09-28 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-09-28
`Next step` on entry: `—` (no brief existed) → on exit: `worker`

I've written the brief for T-071 and opened draft PR #63. Both commits are pushed and `origin/claude/nice-euler-247a4f` is at `78c5ce2`. The brief needs a human to approve it before the worker starts.

- **Header:** Status is `awaiting approval`, Next step is `worker`, and Approved is still `pending`. Under this orchestrated run that line gets the orchestrator's unattended stamp.
- **Nothing to decide:** the brief holds no open human question. The prettier dependency was already approved (katechen150621@gmail.com, 2026-09-25, in `tasks.md`).

**Why T-071:** it is the first §A task, and its one blocker, the dependency decision, is answered.

**What the brief asks for (19 criteria):**
- **Pinned formatter:** `prettier` is pinned to an exact `3.x.y` version and resolved to that version in `bun.lock`. Its settings in `question-bank/` must be the ones `conventions.md` documents: 100 columns, double quotes, semicolons, trailing commas. The "22 files" count in the queue was taken at prettier's default settings, so the real count will differ.
- **The gate:** a `bun run <script>` format step in the `question-bank` CI job, set up like its Lint and Test steps. It must fail on a badly formatted probe file, both at the top of `src/` and one folder down. No file may be excluded from the check, and it must work with the network blocked.
- **One reformat commit:** it may only restyle existing `src/**/*.ts` files, and each changed file must be exactly what the pinned prettier produces from its previous content. `data/`, `sample-data/` and `src/fixtures/` must not change, because the offline rebuild has to reproduce the committed bank byte for byte.
- **One shared dependency check instead of nine:** the queue entry asked the brief to choose, and I chose to replace the per-file pins with one check. Adding a devDependency, removing `oxlint`, or adding a `dependencies` key must turn tests red in exactly one file, even in a full clone. Loosening the prettier pin must fail a test.
- **Docs:** `conventions.md` stops recommending `bunx prettier`, and `engineering-decisions.md` gains an `E-16` entry.

**Things the next roles should know:**
- **There are nine dependency pins, not eight.** The queue listed eight; I found a ninth in `question-bank/src/lint-gate.test.ts` (T-066 criterion 16). It rejects any devDependency whose name contains `prettier`, so adding prettier turns it red straight away.
- **The reformat may break tests that read source files.** Many tests read `.ts` source (for example `src/curated/us-states.ts`) and match on its text. The brief says to fix the test's pattern rather than exclude a file from formatting.
- **Bigger than its size tag:** `tasks.md` still calls this S, but with the dependency-check consolidation it is closer to M. It has more than four criteria, so it is a full brief rather than a light one.
- **Left out on purpose:** reformatting `frontend/`, a frontend format step in CI, T-070's hashes of the committed data files, and `PROGRESS.md`. The worker reports the frontend's format-check result in the Handoff.
- **The PR body is a shortened version of the criteria.** The brief says its own wording wins where the two differ.

**My commits touched only these two files:**
- `/home/user/geo-discovery-zone/tasks/T-071-question-bank-prettier.md` (new brief)
- `/home/user/geo-discovery-zone/tasks.md` (T-071 marked `doing`, plus a note about the ninth pin)

After my last read the brief was changed on disk by something else. I did not re-read it and left that change as it is.

## Paused at the step-2 gate — 2026-09-28
A human is present in the orchestrator session, so the run waits for their approval
of the brief rather than recording an unattended stamp.

## Approved — 2026-09-28
Recorded on the brief: `katechen150621@gmail.com — 2026-09-28, approved via chat in the orchestrator session.`
The user replied "approved, go ahead", and that approval is what is recorded here.

## Round 2 — worker — 2026-09-28
`Next step` on entry: `worker` → on exit: `human`

**T-071 is blocked and only partly built. It needs a human.** The harness's permission classifier ("Security Test Removal") refused my step to delete the nine hand-pinned dependency tests, even though the brief says to consolidate them. I did not try to get around it. The brief now says Status `blocked`, Next step `human`, and I pushed it. `origin/claude/nice-euler-247a4f` shows `80ecee5` as its latest commit.

**Needed from Dkaattae:**
- **Either** allow the pin removal (approve it in an attended session, or add a permission rule) and set Next step back to `worker`.
- **Or** remove the nine pins by hand and hand the rest back to the worker.
- **Not a criteria problem.** The task-expander isn't needed.

**Done and pushed:**

| Commit | What it does |
|---|---|
| `b2f4294` | Pins `prettier` to exactly `3.9.6` (the version frontend's lockfile resolves) in `question-bank/package.json`, updates `bun.lock`, adds `question-bank/.prettierrc` with the four documented settings, and adds `format` and `format:check` scripts. Both scripts run on `"src/**/*.ts"` so the JSON fixtures are never formatted. |
| `6536170` | The reformat commit for criterion 14: `bun run format` output only, 16 existing `.ts` files. |
| `80ecee5` | Adds the Handoff, my Sessions row and the blocked status to the brief. |

**Test results after the reformat:** `bun test` in `question-bank/` gives 1311 pass, 9 fail.
- **The 9 failures** are exactly the nine dependency pins. They fail because `prettier` was added, and will keep failing until the pins are removed.
- **No other test broke** under the reformat.
- **Not run:** typecheck, lint and the frontend suite.

**Not started:**
- Removing the nine pins.
- The shared check, planned as a new `question-bank/src/dependency-set.test.ts`.
- The CI `bun run format:check` step and the Lint-step comment in `ci.yml`.
- `conventions.md`, and the E-16 entry in `engineering-decisions.md`.
- Counting the files frontend's prettier flags, for the reviewer.

After the first denial, the classifier also refused a plain read of `conventions.md` and `engineering-decisions.md`, so I stopped rather than keep testing it.

**Two notes for whoever resumes:**
- **Criterion 11 needs a tenth test gone.** `lint-gate.test.ts`'s whole "T-066 criterion 16" describe block has to go, including the "oxlint is in devDependencies; there is no dependencies key" test. Otherwise criterion 11 (a) and (b) fail in two files, not one.
- **The Sessions row shares the expander's session id** (`cse_01KmyHhDTUDHHNBeuqPkeiKW`), because I ran as a subagent inside that session. It's recorded as such in the table.

Brief: `/home/user/geo-discovery-zone/tasks/T-071-question-bank-prettier.md`

## Halted — 2026-09-28
Header on exit: `Status: blocked`, `Next step: human`. The worker asked:
> **Either** allow the pin removal (approve it in an attended session, or add a permission rule) and set Next step back to `worker`.
> **Or** remove the nine pins by hand and hand the rest back to the worker.

What a human has to decide: whether the nine per-file dependency-pin tests may be deleted
(the brief's consolidation into one shared check), and by which route. The orchestrator does
not answer this and does not perform the removal itself.

## Resumed — 2026-09-28
The user answered in the orchestrator session: "approved, delete the pins and resume the worker".
Recorded in the brief under `## Human decision`; header set to `Status: working`, `Next step: worker`.
The orchestrator did not perform the deletion; a fresh worker carries on from the brief.

## Round 3 — worker — 2026-09-28
`Next step` on entry: `worker` → on exit: `human`

**T-071 is blocked again, on the same step: deleting the nine per-file dependency pins.** The harness's permission classifier refused that deletion a second time ("Security Test Removal"), even with the human approval now written into the brief. A decision recorded in a file doesn't clear the harness's check, so I didn't route around it. Everything else is built and pushed. The brief now reads **Status: `blocked`**, **Next step: `human`**.

**What a person has to do (Dkaattae / katechen150621@gmail.com), one of:**
- **Do it by hand.** Make the removal using the exact list in the brief's Handoff ("Removal to make"), which is about ten minutes of work. Commit it, then set Next step to `worker` (or to `tester` if the suite is green).
- **Allow the action.** Approve it in an attended session or add a harness permission rule, then re-run the worker.

**Pushed to `claude/nice-euler-247a4f`** (`git log origin/claude/nice-euler-247a4f` shows `8ca6d9f` at the head):
- **`505cfe9`:**
  - A `Format` step in the `question-bank` CI job (`bun run format:check`, same `if:` as Typecheck/Lint/Test), and the "Formatting is not checked yet" comment is gone.
  - The shared check, new file `question-bank/src/dependency-set.test.ts` (4 tests, all pass).
  - `conventions.md` no longer says `bunx prettier` and lists `bun run format:check` under Commands.
  - New `## E-16` entry in `engineering-decisions.md`.
- **`8ca6d9f`:** the Handoff, my Sessions row, and the Status change.
- **Earlier, from the first round:** `b2f4294` pins prettier at exactly 3.9.6 and adds the config; `6536170` is the reformat commit.

**Test results in `question-bank/`:**
- **Pass:** typecheck, lint and the format check (exit 0).
- **`bun test`:** 1315 pass, 9 fail. The 9 failures are exactly the pins still waiting to be removed.

**Things the brief did not foresee:**
- **A tenth pin.** In `climate-kid-verify.test.ts`, the test "the only package.json under question-bank/ still has no dependencies block growth" also pins the dependency set. If it stays, criterion 11(b) fails in two files, so it has to go with the other nine.
- **Test-count floors will go red.** Two older "nothing weakened" tests require `state-animals.test.ts` to keep at least 43 tests and `landmarks.test.ts` at least 53, and both files have exactly that many today. Removing the pins drops each by one, which turns 3 floor tests red. I propose lowering those three floors by exactly 1, with a comment citing T-071 and E-16. Whoever does the removal should confirm that, then the reviewer.

**Findings for the reviewer and tester:**
- **Frontend formatting:** prettier flags 4 frontend files: `AGENTS.md`, `README.md`, `src/routes/README.md`, `src/styles.css`. The reviewer decides whether that becomes a queue entry.
- **Frontend environment was incomplete here.** `bun install` got a 403 from the npm mirror on `d3-ease`, so frontend typecheck fails in `UsMap.tsx`, and `bun test` had 1 timing-sensitive lint-gate failure. `conventions-doc.test.ts`, the one frontend test this task can affect, is 80/80. This task changes no frontend file, so the tester should re-run `frontend/` in a clean environment for criterion 16.

Brief: `/home/user/geo-discovery-zone/tasks/T-071-question-bank-prettier.md`

## Halted — 2026-09-28
Header on exit: `Status: blocked`, `Next step: human`. The harness refused the pin removal twice;
a recorded approval in the brief does not clear it. A human must make the removal by hand (or allow
the action in an attended session), and must decide on the worker's proposal to lower three
test-count floors by 1.
