# T-071 — `question-bank/` is formatted by a pinned prettier, and CI gates it — run log

**Task:** T-071 · **Branch:** `claude/nice-euler-247a4f` · **PR:** #63
**Started:** 2026-09-28 · **Outcome:** in progress

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
