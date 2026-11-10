# T-105 — `conventions.md` still calls `openapi.yaml` "the contract" — run log

**Task:** T-105 · **Branch:** `claude/fervent-ptolemy-4py2eg` · **PR:** #130
**Started:** 2026-11-09 · **Outcome:** in progress (resumed after attended tester)

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

## Round 3 — tester — 2026-11-09
`Next step` on entry: `tester` → on exit: `human`

**T-105 is halted for a person.** The `conventions.md` change meets criteria 1–3, but criterion 4 can't pass until someone approves changes to six existing test pins that this task's own change made stale. Status is `test changes requested`, Next step is `human`, and the push landed (`origin/claude/fervent-ptolemy-4py2eg` = `c90cba3`).

**Needed from a person:** start an attended `tester` session for T-105 and approve or refuse rows 1–6 of the brief's Test change request. Under D-15 the orchestrator can't approve them.

**Independence:** this run is orchestrated, so the session-id check proves nothing and did not pass. All three Sessions rows (expander, worker, tester) show `cse_011oDiJbsZTbExMiPULZMiFd`. My independence rests only on being a freshly spawned subagent that never saw the worker's reasoning. That is weaker than a separate session, and the Verdict says so.

| Criterion | Verdict | Evidence |
|---|---|---|
| 1 | met | 5 tests in the new test file, all green |
| 2 | met | 5 tests in the same file. Base `0b78dec`'s other lines are held as a sha256, because CI checks out shallow |
| 3 | met | `git diff --stat 0b78dec..HEAD` and per-commit stats are in the Verdict. The worker touched only `conventions.md` (`011459b`) and the brief (`bf7b318`) |
| 4 | not yet | Pre-existing pins are red; rows 1–6 below |

**Mutations:** I made six temporary edits to `conventions.md`, and each turned at least one of my new tests red. They were: restoring base's row, editing the `backend/` row, shifting the padding, `E-140`, inserting "Contract", and adding an extra line. All were reverted.

**Suites:**
- **Backend:** 1221 passed, 9 skipped.
- **question-bank:** 2720 pass, 3 fail (rows 1–3). Typecheck and lint are clean.
- **Frontend:** fails locally only because `react-simple-maps` / `us-atlas` aren't installed in this sandbox. CI's frontend job passed on `9cc7751`, and no frontend file changed.

**Test change request:**
- **Row 1:** T-067's criterion-17 test in `climate-koppen.criteria.test.ts` still expects the old "contract" wording. It changes to assert "follows the backend" and no "contract", keeping the exactly-once and E-14 checks.
- **Rows 2–3:** add the T-105 brief and run log to the allowed sets in two whole-tree pins. Counts and digests stay the same.
- **Row 4:** `MAIN_TESTS_COUNT` goes from 127 to 128 because of my new test file, and `MAIN_TESTS_SHA` is recomputed.
- **Row 5:** the farm-animal `APPLIED_REQUEST_FILE_SHAS` entry is recomputed.
- **Row 6:** the digest in `hand-check-levels-verify.test.ts` is recomputed.

The worker listed rows 1–3. Rows 4–6 are ones it missed. A dry run applying all six took question-bank to 0 fail with backend still green; I reverted all six, and only my new test file is committed. Rows 2, 3 and 5 recur on every task, so the Verdict repeats T-104's P-17 note for Dkaattae.

Files:
- /home/user/geo-discovery-zone/question-bank/src/conventions-openapi-row-verify.test.ts (new, committed)
- /home/user/geo-discovery-zone/tasks/T-105-conventions-openapi-row.md (Verdict, Test change request, header, Sessions row)

## Halted — test change request — 2026-11-09
Raised at commit `c90cba3`. Header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`.
A person must start the `tester` step for T-105 in a session they are attending and approve or refuse each row there. The orchestrator cannot take the approval (D-15).

## Resumed — 2026-11-10
A person told the orchestrator: "pr 130 is fixed please proceed". The branch head had moved to `1d4a830`: an attended tester applied approved rows 1-6 and recorded a verdict. Header on resume: `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-11-10`.
