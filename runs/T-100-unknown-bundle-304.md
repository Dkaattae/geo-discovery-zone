# T-100 — `GET /bundles/zz` with a matching `If-None-Match` returns 304 — run log

**Task:** T-100 · **Branch:** `claude/ecstatic-hopper-lp3me9` · **PR:** #123
**Started:** 2026-11-04 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-04
`Next step` on entry: `(no brief)` → on exit: `worker`

**TL;DR:** I wrote the brief for T-100, pushed it to `claude/ecstatic-hopper-lp3me9` (head `3ac61b2`, confirmed on the remote) and opened draft PR #123. The brief is `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. Before the worker starts, the `Approved:` line needs filling in (by a person, or by the orchestrator's unattended stamp).

**Which task, and why**
- **T-100**: `GET /bundles/zz` with a matching `If-None-Match` returns 304 instead of 404.
- It was the first task in `tasks.md` I could start. T-085b, T-056 and T-095 each wait on a person's decision or an outside source.
- `tasks/` held only `README.md` and `TEMPLATE.md`. T-099's reviewer had already swept, so there was nothing left over from the last cycle.

**What I found in the code** (by reading it; I ran nothing)
- **The bug is real.** In `backend/app/routers/content.py`, `get_bundle` returns 304 on a matching tag before it checks the bundle exists. `store.bundle_etag` (`backend/app/store.py:276`) makes a tag for any id.
- **Already true, not asked for again:**
  - An unconditional request for an unknown bundle is already a 404 (`test_t097_tester_criteria.py::test_c13`).
  - `openapi.yaml` already declares 304 and 404 for this endpoint.
  - `store.bundle_ids` is a cheap existence check that already exists.
  - `response_model_exclude_unset=True` on `get_bundle` has no effect since T-099.

**The 13 criteria**
- **1–3:** an unknown bundle is a 404 problem document for both variants. That holds for its own tag, the other variant's tag, a list containing the matching tag, and `*`. The 404 carries no `ETag` and no `immutable` `Cache-Control`.
- **4–5:** behaviour for `us` is unchanged, both the 304/200 conditional cases and the full 200 response.
- **6:** a 304 for `us` must not read the `questions` table, so a matching tag never costs a full bundle render.
- **7:** the route's `response_model_exclude_unset` is false and its `response_model` is still `Bundle`.
- **8:** `GET /bundles` is unchanged.
- **9–13:** the negatives and the whole suite: no pre-existing test changed (checked by hand, per E-11/E-12), no dependency change, `openapi.yaml`, migrations and the plan untouched, no network in tests, all suites green.

**Out of scope:** `*` on a known bundle (RFC 9110 suggests 304 there, today it is 200), weak validators, other endpoints, `list_bundles`'s flag, and the T-101 flaky test.

**Commits:** only `tasks/` and `tasks.md` changed. The `tasks.md` change is T-100's status set to `doing`. `PROGRESS.md` needed no edit.

Files:
- /home/user/geo-discovery-zone/tasks/T-100-unknown-bundle-304.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/123

## Orchestrator — 2026-11-04
Approved stamped unattended. Note: the expander's returned result summarised the criteria; it is logged here verbatim and was not used in any spawn prompt.
