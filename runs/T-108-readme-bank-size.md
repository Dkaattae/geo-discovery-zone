# T-108 — `README.md` still says "15 states, 26 questions", and cites E-14 by bare id — run log

**Task:** T-108 · **Branch:** `task/T-108-readme-bank-size` · **PR:** #135
**Started:** 2026-11-12 · **Outcome:** in progress

Run: orchestrated, task 3 of 3. In flight at start: T-106, T-107.

## Round 1 — task-expander — 2026-11-12T18:19Z
`Next step` on entry: `none (no brief)` → on exit: `worker`

I expanded T-108. The brief and a draft PR (#135) are pushed and the push is confirmed on the remote. It now needs `Approved:` stamped, then the `worker`.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-108-readme-bank-size.md
- **Branch:** `task/T-108-readme-bank-size`, created from `origin/main` at `8092372`. The brief's `Branch:` header names it.
- **PR:** #135 (draft, against `main`): https://github.com/Dkaattae/geo-discovery-zone/pull/135
- **Header:** `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. The Sessions table has the expander's row.
- **Commits:** `cc13a2b` (`T-108 expander: readme-bank-size`) and `57f7db9` (writes PR #135 into the header). `origin/task/T-108-readme-bank-size` is at `57f7db9`. The diff against `origin/main` touches only the brief.

**How the task was picked.**
- **§A and §B:** no open tasks.
- **T-085b:** skipped. It needs a person to choose a reachable Census source.
- **T-056:** skipped. It depends on a design decision.
- **T-095:** skipped. It needs a person's call (its Q).
- **T-108:** picked. It has no dependency and no open PR. Its only file, `README.md`, is not in T-107's diff.
- **In flight:** T-106 is merged (PR #133) and T-107 is in flight (PR #134), so I left both alone.

**What the brief asks for (14 criteria, full brief because it is over the light path's four).**
- **Remove the stale size:** "15 states, 26 questions" goes, and so does "human-written and reviewed explanations". No served question has an explanation; only the 50 fun facts are reviewed.
- **No question count in `README.md`:** the count changes every time templates are added and nothing checks it.
- **A state count is optional,** but if stated it must be 50.
- **The paragraph keeps saying** that only a US-states bank ships.
- **Both `openapi.yaml` lines (32 and 215) name `engineering-decisions.md` with `E-14`.** Each keeps "follows the backend" and no "contract". The Layout line keeps column 21.
- **Nothing else moves:** only those README lines change, checked by `git diff` rather than a new pin. The worker touches only `README.md` and the brief. No new dependency. The whole suite must be green.

**Out of scope, which the reviewer may want to queue.**
- **README pitch:** lines 5 and 13 promise explanations ("A miss earns the reason the right answer is right"). I treated them as design intent.
- **Stale source comments:** `question-bank/src/curated/us-states.ts:69` and `:80` still say "the 15 states shipping today".

**Expect the usual whole-tree pins to go red** (P-17), the same family as on T-104 to T-106: `farm-animal-loose-ends-verify` criterion 21 and `climate-cold-trade-accepted-verify` criterion 22.

I did not touch `tasks.md` or `PROGRESS.md`. `tasks/` had no leftover brief, and the T-107 expander had not edited those files either. I ran no build or tests.

## Approval — orchestrator — 2026-11-12T18:19Z
Stamped `Approved:` as an unattended run. The criteria were not read.
