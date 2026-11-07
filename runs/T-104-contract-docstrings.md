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
