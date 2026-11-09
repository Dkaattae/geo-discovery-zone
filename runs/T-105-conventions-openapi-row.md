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

## Round 2 — worker — 2026-11-09
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** T-105 is implemented and pushed to `claude/fervent-ptolemy-4py2eg`. The only content change is line 16 of `conventions.md`. The suite is not fully green, for two reasons:
- Three question-bank tests are stale by design and need an attended Test change request.
- The frontend tests and typecheck fail because this sandbox can't install `react-simple-maps`; the package registry is blocked. No frontend file was touched.

Status is `awaiting verification` and Next step is `tester`.

**The push landed:** `git log origin/claude/fervent-ptolemy-4py2eg` shows my two commits on top.
- `011459b T-105 worker: openapi.yaml layout row follows the backend, not a contract` changes only `conventions.md`.
- `bf7b318 T-105 worker: handoff, status awaiting verification` changes only the brief.

**The change:**
- `conventions.md:16` now reads `openapi.yaml     describes the API; follows the backend, which is the source of truth (engineering-decisions.md E-14)`.
- A diff against base `0b78dec` shows only that line changed. Both versions have 133 lines, and the description still starts in column 18.

**Tests made stale** (left failing; details and suggested fixes are in the Handoff):
- **`question-bank/src/climate-koppen.criteria.test.ts` › "T-067 criterion 17 …"**: it asserts the old wording ("the contract between frontend and backend"). Criterion 1 makes it red. It should drop that line and keep the exactly-once and `E-14` checks.
- **`question-bank/src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21 …" › "criterion 21 …"**: it pins 282 non-test files; there are now 284, and the hash on line 172 moves too.
- **`question-bank/src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22 …"**: it pins 285 files; there are now 287, and the hash on line 97 moves too.
- **Cause of the two count failures:** the new brief and `runs/` file, not the `conventions.md` edit.
- `refresh-regenerate-reminder-verify.test.ts` stayed green.

**Suite results:**

| Suite | Result |
|---|---|
| `make -C backend check` | 1221 passed, 9 skipped |
| `question-bank/` | 2710 pass, 3 fail (the three above); typecheck and lint pass |
| `frontend/` | 406 pass, 4 fail; typecheck exit 2; lint passes |

- **Frontend failures:** every one is a missing `react-simple-maps` or `us-atlas` module. `bun install --frozen-lockfile` was refused by the proxy (403 for `europe-west1-npm.pkg.dev`), and I did not retry it.
- **Tester** should re-run the frontend checks where the install works, or use CI's frontend result.

**Flags:**
- **Sessions table:** my worker row has the same session id as the expander's (`cse_011oDiJbsZTbExMiPULZMiFd`), because the orchestrated run reports one remote session id for all its subagents. I said this in the Handoff; the tester should judge independence from it.
- **Out of scope, reviewer to queue:** `README.md:32` and `:215`, `geoquizdataplan.md:648`, and `conventions.md:9` still have the same stale wording, as the brief's Notes say.
- **Mistake, fixed:** my first attempt to update the brief failed on a script error, so the brief went in a separate second commit. Nothing was lost.

Brief: `/home/user/geo-discovery-zone/tasks/T-105-conventions-openapi-row.md`
