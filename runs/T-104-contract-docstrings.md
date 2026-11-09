# T-104 — Two backend test docstrings still call `openapi.yaml` "the contract" — run log

**Task:** T-104 · **Branch:** `task/T-104-contract-docstrings` · **PR:** #129
**Started:** 2026-11-07 · **Outcome:** in progress (resumed after attended tester)

## Round 1 — task-expander — 2026-11-07
`Next step` on entry: `(none — no brief)` → on exit: `worker`

I picked T-104 and wrote it up as a light brief on branch `task/T-104-contract-docstrings`, with draft PR #129. The push landed: local HEAD and the remote branch are both at `205fdbf`.
- **Status:** `awaiting approval`
- **Next step:** `worker`
- **Approved:** `pending`
- **Needed next:** a human approves the brief. Ask them to plan on attending the tester step, because Test change request rows are likely.

**Why T-104:**
- **T-103:** skipped. It is in flight, as PR #128.
- **T-085b:** skipped. It needs a person to choose how to get Census data, because the proxy refused the census.gov hosts.
- **T-056:** skipped. It is waiting on a design decision.
- **T-095:** skipped. It needs a person to answer its Q.
- **T-104:** first in queue order with no dependency and no open PR.

**What the brief asks for (4 criteria):**
1. **`backend/tests/test_contract.py`:** the module docstring drops "contract between". It must say `openapi.yaml` follows, or is kept in step with, the backend, contain `E-14`, and still name the three drifts the file's tests catch.
2. **`backend/tests/conftest.py`:** the module docstring drops "contract promises" and "what the contract". It must contain `E-14` and the same kept-in-step statement. It must still give a reason endpoint tests go through `httpx.AsyncClient`, and its other paragraphs keep their meaning.
3. **Only the module docstrings change in those two files.** Each file's AST, with the docstring removed, must match `dca80da`. That means the `assert_matches` docstring, the `# -- contract assertions` comment and the test names stay as they are.
4. **The worker touches no other source, test or config file.** Re-pins happen only through an approved Test change request, and all three suites pass. The tester checks this with a `git diff --stat` recorded in the Verdict, not with a new committed digest pin (P-17).

**Survey:**
- **Not done yet.** On `main` the wording is still at `test_contract.py:3` and `conftest.py:3-5`.
- **No test quotes either phrase**, so changing the wording breaks no wording pin.

**Risks, recorded in the brief's Notes:**
- **Digest re-pins are likely.** `backend/` is covered by whole-tree digest tests from earlier tasks (P-17), so this change will probably turn some red even though no behaviour changes.
- **Merge order with T-103.** T-103 (PR #128) will re-pin the same digests. Whichever of the two merges second needs one more re-pin round. Neither task depends on the other.

**Commits:** two, `T-104 expander: contract-docstrings` and a follow-up recording PR #129 in the header. Together they touch only the new brief. `tasks.md` and `PROGRESS.md` are unchanged, since no sweep was needed: `tasks/` held only `README.md` and `TEMPLATE.md`.

Brief: /home/user/geo-discovery-zone/tasks/T-104-contract-docstrings.md

## Approval — 2026-11-07
Orchestrator wrote the unattended-run `Approved:` stamp. No human saw the criteria.

## Round 2 — worker — 2026-11-07
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** I rewrote the two module docstrings, committed them, and pushed. Commit `36872b5` is on `origin/task/T-104-contract-docstrings`, which is the brief's `Branch:` header. Status is `awaiting verification` and Next step is `tester`. Four question-bank pin tests are red: two my edit causes, and two were already red before I touched anything. Expect a Test change request at the tester step.

**What changed** (worker commit `36872b5`):
- **`/home/user/geo-discovery-zone/backend/tests/test_contract.py`:** module docstring only. It now says `openapi.yaml` follows the backend and is updated to match it (E-14). It still names all three kinds of drift the tests catch.
- **`/home/user/geo-discovery-zone/backend/tests/conftest.py`:** only the first paragraph of the module docstring. The `httpx.AsyncClient` reason no longer says "contract promises", and it gains the sentence that `openapi.yaml` follows the backend and is kept in step with it (E-14). The other paragraphs are unchanged.
- **`/home/user/geo-discovery-zone/tasks/T-104-contract-docstrings.md`:** Handoff, Notes, my Sessions row, and the Status / Next step header.

**My own checks against the criteria** (throwaway scripts, nothing committed):
- **Criteria 1 and 2:** the banned phrases are gone, `E-14` is present, and the wording says the spec follows the backend.
- **Criterion 3:** for both files, the code with the module docstring removed matches `dca80da` exactly (`ast.dump` comparison).
- **Criterion 4:** `git diff --stat dca80da..origin/<branch>` shows four files: the two backend files, the brief, and `runs/T-104-contract-docstrings.md`. The run log is from the orchestrator's commit, not mine.

**Suite results:**
- **Backend:** `make -C backend check` passes (1039 passed, 9 skipped).
- **Question-bank:** typecheck and lint are clean; tests are 2709 pass, 4 fail (below).
- **Frontend:** 406 pass, 4 fail, and the same 406/4 with my edit stashed. All four fail because the package `react-simple-maps` is not installed: `bun install --frozen-lockfile` gets a proxy 403 from the lockfile's `europe-west1-npm.pkg.dev` host. The frontend typecheck and lint did not pass here for the same reason. The tester needs an environment where the frontend dependencies install.

**Tests made stale** (details and proposed values are in the Handoff; all four pins were last set by `04ac466`, T-047):
1. **`refresh-regenerate-reminder-verify.test.ts`, T-087 criterion 15:** caused by this edit. Proposed new `MAIN_BOUNDARY_SHA` is `9092278337f1572f35f6199f6396e183dd53b7666bdc34a52083299158973539`.
2. **`climate-cold-trade-accepted-verify.test.ts`, T-091 criterion 22, "pre-existing test files…":** caused by this edit. Proposed new `MAIN_TESTS_SHA` is `2f2ca0e2d8cb03e950693e4fdaff6c6a5502c9256b4e567066cc1e44b3dd3a78`.
3. **Same file, T-091 criterion 22, "every tracked non-test file…":** already red before my edit. The expander's brief and the orchestrator's run log add two tracked files, so the count goes 285 to 287 and the sha needs re-pinning.
4. **`farm-animal-loose-ends-verify.test.ts`, T-096 criterion 21:** already red before my edit, same cause. The count goes 282 to 284 and the sha needs re-pinning.

For 3 and 4 I could only see the count, so the new sha values have to be read after the counts are re-pinned.

**Flags, each with an owner:**
- **Same session id for both roles.** My session id is `cse_011oDiJbsZTbExMiPULZMiFd`, the same one the expander recorded. If the tester also comes up with this id, its check will refuse to run. The orchestrator decides how to handle that.
- **Briefs and run logs keep breaking these count pins.** Every task that adds a brief and a run log will trip them. The tester puts them in this task's Test change request. Whether these pins should skip `tasks/` and `runs/` is a `process-tasks.md` question for Dkaattae.
- **T-103 re-pins the same values.** Whichever of PR #128 and this PR merges second will need one more re-pin round. The reviewer of the second PR owns that.

**Not settled:** `uv run mypy .` in the backend stops with a module-path error in `tests/conftest.py`. It is not part of `make check` and is unrelated to this change, so I left it.

## Round 3 — tester — 2026-11-07
`Next step` on entry: `tester` → on exit: `human`

**T-104 tester: all four criteria are met, but the task is halted on a Test change request with Next step `human`.** This is not a fail. Five re-pin rows need a person to approve them in an attended tester session (D-15). Until then the question-bank suite stays red: 4 tests, all of them stale pins. The push landed: `dd4b994` is on `origin/task/T-104-contract-docstrings` (PR #129).

**How independent this check is.** This is an orchestrated run, and the expander, worker and tester all share session id `cse_011oDiJbsZTbExMiPULZMiFd`. So the session-id check proves nothing. I am a freshly spawned subagent with my own context. That is weaker evidence than a separate session, because it rests on the orchestrator spawning me correctly, and the Verdict says so.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | Five `test_criterion_1_*` tests in the new test file |
| 2 | met | Seven `test_criterion_2_*` tests. A script also confirmed that docstring paragraphs 3–6 and the title line are byte-identical to `dca80da` |
| 3 | met, by a script run once, not a committed test (P-17) | For both files, `ast.dump` with the module docstring removed equals `dca80da`'s (True), and the source after the docstring is line-identical |
| 4 | met, from `git diff --stat` recorded in the Verdict | The worker's commit `36872b5` touches only the two backend files and the brief |

**Do the new tests catch real breakage?**
- **Against the original files** (`dca80da`): the 4 tests that check the new wording fail and the 8 that check kept text pass, as they should.
- **Eight deliberate breakages** of the docstrings each made exactly the one matching test fail. All were reverted.

**Suites at `6196ee9`, the commit with my test:**
- **Backend:** `make -C backend check` passes, 1051 passed and 9 skipped.
- **Question-bank:** 2709 pass and 4 fail; all four are the stale pins below. Typecheck and lint are clean.
- **Frontend:** 4 fail locally because packages can't install here (proxy 403 on the tarballs). No frontend file changed, and CI on `846a9d1` has the frontend job green. Every CI job there passed except question-bank, which failed on these same pins.

**The Test change request.** Every row modifies a pin; none deletes a test. Values come from a trial run that I reverted.
1. **`refresh-regenerate-reminder-verify.test.ts`:** set `MAIN_BOUNDARY_SHA` to `75e72445…`.
2. **`climate-cold-trade-accepted-verify.test.ts`:** set `MAIN_TESTS_COUNT` from 123 to 124 and `MAIN_TESTS_SHA` to `e91fe4e6…`.
3. **Same file:** add the T-104 brief and run log to `CRITERION_22_ALLOWED`. The count stays 285, and `MAIN_UNTOUCHABLE_SHA` becomes `eba70070…`.
4. **`farm-animal-loose-ends-verify.test.ts`:** add the brief and run log to `CRITERION_21_ALLOWED`. The count stays 282, and `MAIN_UNTOUCHABLE_SHA` becomes `d29be0bf…`.
5. **Knock-on from row 4:** row 4 edits `farm-animal-loose-ends-verify.test.ts`, whose sha is pinned in `climate-cold-trade-accepted-verify.test.ts`'s `APPLIED_REQUEST_FILE_SHAS`. That entry has to be recomputed after row 4 is applied, comments included.

**Where my list differs from the worker's:**
- **`conftest.py` also moves both `MAIN_UNTOUCHABLE_SHA` digests.** It is not a `test_*` file, so those pins count it as a non-test file. The worker blamed only the new brief and run log.
- **Rows 3 and 4 follow the usual fix.** Earlier tasks added their brief and run log to the allowed set rather than raising the count, as the worker proposed.
- **Row 5 was missing** from the worker's list.
- **My new test file also changes rows 1 and 2.**

**Still to do:**
- **Approve the rows:** someone needs to start the `tester` step for T-104 in a session they are attending and approve, or refuse, rows 1–5 there.
- **Merge order with T-103 (PR #128):** whichever PR merges second needs one more re-pin round, because both touch these same pins.
- **Process idea for Dkaattae:** exempting `tasks/` and `runs/` from these pins would stop rows 3 and 4 coming back on every task.

Files:
- /home/user/geo-discovery-zone/backend/tests/test_t104_tester_criteria.py (new)
- /home/user/geo-discovery-zone/tasks/T-104-contract-docstrings.md (header, Sessions row, Verdict, Test change request)

## Halted — test change request — 2026-11-07
Raised at commit `dd4b994`. Header: `Test changes: requested`, `Status: test changes requested`, `Next step: human`.
A person must start the `tester` step for T-104 in a session they are attending and approve or refuse each row there. The orchestrator cannot take the approval (D-15).

## Run ended — 2026-11-07
Task limit (2) reached; both tasks ended halted on test change requests.

## Resumed — 2026-11-09
A person told the orchestrator: "pr 129 is fixed please proceed". The branch head had moved to `0d81fd2`: an attended tester applied the approved test change request (`63c7e84`) and recorded a verdict (`0d81fd2`). Header on resume: `Status: pass`, `Next step: reviewer`, `Test changes: approved — Dkaattae, 2026-11-09`.

## Round 4 — reviewer — 2026-11-09
`Next step` on entry: `reviewer` → on exit: `tester` — attended, to merge `origin/main` (T-103, PR #128) into this branch and re-pin under a new Test change request (see `## Review`, finding 1); then `reviewer` again for the sweep

**I sent T-104 back with changes requested. The work is good, but the branch now conflicts with `main`.** PR #129 is draft again and the brief is live (`Status: changes requested`, `Next step: tester`, which has to be an attended session). The push landed: the remote head is `b6b0bde`, the same as my local head.

**Why it went back**
- **#128 (T-103) merged first.** It merged into `main` as `902284b` at 17:58Z, just before this review started, and it re-pinned the same three question-bank test files T-104 re-pinned. GitHub shows #129 as `dirty`.
- **A trial merge (in a scratch worktree, since removed) conflicts in these places:**
  - `refresh-regenerate-reminder-verify.test.ts`: `MAIN_BOUNDARY_SHA`.
  - `climate-cold-trade-accepted-verify.test.ts`: `MAIN_TESTS_SHA` and `MAIN_TESTS_COUNT` (124 here, 126 on `main`; 127 once merged), the farm-animal entry in `APPLIED_REQUEST_FILE_SHAS`, and `CRITERION_22_ALLOWED`.
  - `farm-animal-loose-ends-verify.test.ts`: `CRITERION_21_ALLOWED`.
- **Two values merge cleanly but will be wrong:** both `MAIN_UNTOUCHABLE_SHA` constants.
- **The fix needs a person:**
  1. An attended tester merges `origin/main` in (no rebase, no force-push).
  2. They keep both PRs' entries and recompute every T-104 value on the merged tree.
  3. A person approves the new rows (D-14), which are applied in a `tester` commit.
  4. CI goes green on the merged head.
  5. The reviewer comes back to sweep and mark the PR ready.

  T-047 hit the same situation (`7da84b5`).

**I made a mistake on the way.** I approved, swept (`b7e040b`) and marked the PR ready before I noticed `main` had moved, because my fetch at the start ran before the merge. When the PR came back `dirty`, I put it back to draft and reverted the sweep with a normal commit (`b6b0bde`, no history rewrite). The brief's `## Review` and the PR comment both say this. The PR was marked ready for about a minute and nothing was merged.

**My review of the work itself: nothing blocks it**
- **Every role's commits are in the PR**, and each role touched only its own files.
- **Every change to an existing test** is in tester commit `63c7e84` and matches rows 1-5, which Dkaattae approved.
- **The docstring wording is good.** I re-ran the criterion 3 AST check myself and it matches `dca80da`.
- **Suites on `83cdd7a`, before the conflict:**
  - **CI:** all six jobs green.
  - **Locally:** backend 1051 passed, 9 skipped; question-bank 2713 pass, 0 fail. Frontend fails 4 tests only on `react-simple-maps`, which cannot install here (proxy 403); CI has it green.
- **Envelope:** apart from the conflict, it is inside it. The next reviewer pass can approve without escalating once the re-pins are approved and CI is green.

**Findings that do not block (the approving reviewer's sweep queues them; a ready-made version is in `b7e040b`)**
- **`conventions.md:16` still calls `openapi.yaml` "the contract between frontend and backend … once both are built".** A test pins that line (`climate-koppen.criteria.test.ts:302`). It should become a new S task, T-105.
- **The tester's criteria test quotes the unchanged conftest paragraphs word for word**, so a later rewording will need a test change. This is another case of P-17.
- **The flags are settled:**
  - The brief and run-log pins that recur on every task go on P-17.
  - The merge-order flag with T-103 is now finding 1.
  - The mypy error is not queued: it was there before this task and mypy is not a gate.

**Records**
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/129 (draft, body rewritten)
- Review comment: https://github.com/Dkaattae/geo-discovery-zone/pull/129#issuecomment-6747887036
- Brief: /home/user/geo-discovery-zone/tasks/T-104-contract-docstrings.md (`## Review`, header, my Sessions row)
- Commits on `task/T-104-contract-docstrings`: `b8e3f5a` (review written as approved), `b7e040b` (sweep), `b6b0bde` (sweep reverted, changes requested)

## Halted — needs attended tester — 2026-11-09
`Next step` names `tester` but requires it attended: the merge and re-pin change pre-existing tests, which a person must approve in the session making the edits (D-15). The orchestrator did not spawn one.

## Resumed — 2026-11-09
A person told the orchestrator: "pr 129 is fixed please proceed". The branch head had moved to `148b1cd`: an attended tester merged `origin/main` (`3196135`), raised rows 6-9 (`4b499ad`), applied them (`605c476`) and recorded a verdict (`148b1cd`). Header on resume: `Status: pass`, `Next step: reviewer`.
