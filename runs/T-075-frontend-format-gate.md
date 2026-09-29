# T-075 — `frontend/` gets a pinned prettier and a CI format gate — run log

**Task:** T-075 · **Branch:** `claude/dazzling-hawking-13k700` · **PR:** #66
**Started:** 2026-09-29 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-09-29
`Next step` on entry: (no brief) → on exit: `worker`

**TL;DR:** I wrote the T-075 brief, pushed it to `claude/dazzling-hawking-13k700` and opened draft PR #66. The push landed: local and origin are both at `0b34fe4`. The brief says **Status `awaiting approval`**, **Next step `worker`**, **Approved `pending`**, so a human has to approve it before the worker starts.

**Task picked:** T-075 is the first `todo` entry in §A of `tasks.md` and has no dependencies. It gives `frontend/` a pinned prettier and a CI format gate, the same as T-071 did for `question-bank/`.

**Files**
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-075-frontend-format-gate.md`. Its `Branch:` header says `claude/dazzling-hawking-13k700` and its `PR:` header says #66.
- **Queue:** `/home/user/geo-discovery-zone/tasks.md`. T-075 is now `doing`, with a one-line note that it was expanded.
- **Nothing else changed.** The diff against `origin/main` is just those two files. `PROGRESS.md` is unchanged.
- **Commits:** `T-075 expander: frontend-format-gate`, then `T-075 expander: record PR #66 in the brief`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/66 (draft; its body has the criteria).

**What the survey found**
- **`.ts`/`.tsx` are already format-checked.** The frontend lint runs `eslint-plugin-prettier` (last entry in `frontend/eslint.config.js`). That explains why all four drifted files are Markdown or CSS: `AGENTS.md`, `README.md`, `src/routes/README.md` and `src/styles.css`.
- **The version is already right.** `frontend/bun.lock` resolves `prettier@3.9.6`, the same as `question-bank/`. Only the specifier `^3.7.3` changes, so pinning adds no dependency.
- **Two config files already exist.** `.prettierrc` and `.prettierignore` are in `frontend/`, and the brief keeps both byte-identical.
- **No existing test looks likely to go stale.** A grep found nothing under `frontend/src` that pins the frontend's devDependencies or its CI step list.

**Two decisions the approver should check** (engineering calls, not product ones, and approving the brief approves them):
1. **The check covers the whole package (`.`), not just source.** That matches the existing `format` script, which already writes `.`.
2. **Prettier is pinned to exactly `3.9.6`**, to match `question-bank/`.

**One accepted risk:** Lovable writes `frontend/AGENTS.md`. If Lovable is reconnected (T-044) and rewrites that file unformatted, the new gate will fail on its commit. The brief reformats the file anyway rather than excluding it.

**Criteria:** 22 in all, so this is a full brief, not the light path. They cover:
- the exact pin, and that no other dependency changes;
- the `format:check` script, tested with probe files across 7 file types, plus a run with the proxies pointed at a dead port to show it needs no network;
- the CI Format step with the same `if:` as its siblings, and the job name `frontend (typecheck, lint, test)` left unchanged;
- a separate commit that only reformats the four files and touches no `.ts`/`.tsx`/`.js`/`.mjs`;
- the lint, typecheck and test suites still passing;
- updates to `conventions.md` and a new E-17 entry, with E-16 left untouched.

Where the frontend suite can't be installed in the sandbox, a green CI run on the head commit counts as the evidence.

I ran no build, test or prettier command (D-7). The "4 files flagged" figure is T-071's worker's observation as recorded in `tasks.md`.

## Halted — awaiting human approval — 2026-09-29
The orchestrator's attempt to stamp `Approved: orchestrator — unattended run` was
refused by the session's permission check, so the brief stays `Approved: pending`.
A human has to decide: approve the brief (on PR #66 or by name in the
`Approved:` line), or explicitly authorise an unattended stamp for this run. The
worker has not been spawned.
