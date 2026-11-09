# T-105 — `conventions.md` still calls `openapi.yaml` "the contract" — run log

**Task:** T-105 · **Branch:** `claude/fervent-ptolemy-4py2eg` · **PR:** #130
**Started:** 2026-11-09 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-09
`Next step` on entry: `(none — no brief)` → on exit: `worker`

**TL;DR:** I picked T-105 and wrote its brief as a light S brief with 4 criteria. Draft PR #130 is open. Status is `awaiting approval`, Next step is `worker`, and Approved is still `pending`. The push landed: `origin/claude/fervent-ptolemy-4py2eg` is at `43a7444`.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-105-conventions-openapi-row.md
- **Branch:** `claude/fervent-ptolemy-4py2eg`. It is in the brief's `Branch:` header and the PR is built from it.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/130 (draft, base `main`). The acceptance criteria are its body, and the brief's `PR:` header says #130.
- **Commits:** `3a23593` `T-105 expander: conventions-openapi-row` and `43a7444` (adds the PR number). Together they change only `tasks/T-105-conventions-openapi-row.md` (`git diff --stat 0b78dec..origin/...` shows 1 file). I did not edit `tasks.md` or `PROGRESS.md`, because nothing needed sweeping: `tasks/` held only README and TEMPLATE.

**Why T-105:** tasks are taken in queue order, so these three ahead of it were skipped:
- **T-085b:** blocked until a person chooses a Census source, because the census.gov hosts were refused by the proxy.
- **T-056:** waits on a design decision.
- **T-095:** marked "needs a person's call before it is expanded".

T-105 has no dependency. No remote branch exists for it, and the In flight list was empty.

**Criteria in brief:**
1. The `openapi.yaml` layout row in `conventions.md` does not contain "contract" or "once both are built", and does contain "follows the backend" and E-14.
2. Every other line of `conventions.md` is byte-identical to base `0b78dec`.
3. The worker touches only `conventions.md` and the brief.
4. All three suites are green at the end, and pre-existing tests change only through an approved Test change request.

**Expect a halt at the tester:**
- **Test made stale on purpose:** `question-bank/src/climate-koppen.criteria.test.ts` (T-067 criterion 17) pins the old phrase verbatim, so criterion 1 turns it red.
- **Whole-tree pins (P-17):** the new brief and run-log files will also turn red the `MAIN_UNTOUCHABLE_*` count and sha pins in `farm-animal-loose-ends-verify.test.ts` and `climate-cold-trade-accepted-verify.test.ts`.
- **What follows:** an attended Test change request is likely, as on T-104.

**Left for the reviewer to queue:** the brief's Notes list three things I kept out of scope:
- `README.md:32` and `:215`, which make the same "contract" claim.
- `geoquizdataplan.md:648`.
- `conventions.md:9`'s stale "once built".

## Approval — 2026-11-09
Orchestrator wrote the unattended-run `Approved:` stamp. No human saw the criteria.
