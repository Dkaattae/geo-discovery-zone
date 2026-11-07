# T-104 — Two backend test docstrings still call `openapi.yaml` "the contract" — run log

**Task:** T-104 · **Branch:** `task/T-104-contract-docstrings` · **PR:** #129
**Started:** 2026-11-07 · **Outcome:** in progress

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
