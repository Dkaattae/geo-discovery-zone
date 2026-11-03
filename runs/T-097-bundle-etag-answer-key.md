# T-097 — A bundle's `ETag` is the same with and without the answer key — run log

**Task:** T-097 · **Branch:** `claude/happy-dirac-a1j5no` · **PR:** #120
**Started:** 2026-11-03 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-03
`Next step` on entry: (no brief) → on exit: `worker` — once a person replaces `pending` below

**TL;DR:** I wrote the T-097 brief (bundle `ETag` with and without the answer key), pushed it to `claude/happy-dirac-a1j5no` and opened draft PR #120. The brief is `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. Nothing is built yet. A person, or the orchestrator's unattended stamp, has to fill in `Approved:` before the worker starts.

**Pick and survey**
- **`tasks/` was empty** apart from README and TEMPLATE, so no cycle was left unfinished.
- **Why T-097:** it is the first task in the queue whose dependencies are done. §A and §B have no open tasks. T-085b needs a reachable Census release. T-056 and T-095 each need a person's decision first.
- **What already holds:** the unkeyed body withholds the key, the keyed body carries it, a stale tag gets a 200, and a same-tag request gets a 304. Existing tests cover all of these (`backend/tests/test_t053_tester_criteria.py` c6 and c7, `backend/tests/test_content_api.py`). The brief only requires that they keep holding.
- **What remains:** `store.bundle_etag` returns one tag per bundle (`"<id>-<contentVersion>"`), whatever `includeAnswerKey` is. `get_bundle` in `backend/app/routers/content.py` checks `If-None-Match` against that single tag.

**The brief**
- **18 criteria.** They cover:
  - the two variants having different tags, with `=false` treated the same as no flag;
  - a tag from one variant not revalidating the other, in both directions;
  - each variant still getting a 304 against its own tag;
  - matching inside a list of tags;
  - the body's `etag` field equalling the header;
  - `GET /bundles` listing the unkeyed tag;
  - both tags staying strong and following `contentVersion`;
  - `Cache-Control` and the 404 for an unknown bundle not changing;
  - the `openapi.yaml` `getBundle` description saying the tag differs by variant;
  - no `ETag` on other endpoints, no pre-existing test changed, no new dependency, no network.
- **Two choices made for the approver** (flagged in the brief and the PR body, either can be struck):
  - the body's `etag` field follows its variant;
  - the list endpoint shows the unkeyed, default tag.
- **The reviewer will escalate this PR** because it touches `openapi.yaml`. That is expected.
- **Out of scope, worth future queue entries:**
  - `bytes` is computed over the keyed payload, so it overstates the unkeyed body's size;
  - `GET /bundles/zz` with a matching `If-None-Match` returns 304 instead of 404.

**Commits and push**
- `6d17d6a T-097 expander: bundle-etag-answer-key` adds the brief and moves the T-097 line in `tasks.md` to `doing`.
- `d89e6c7 T-097 expander: record PR #120 in the brief`.
- **Push confirmed:** `git log origin/claude/happy-dirac-a1j5no` shows `d89e6c7` on top. The diff against `origin/main` touches only `tasks.md` and the brief.

**Files**
- /home/user/geo-discovery-zone/tasks/T-097-bundle-etag-answer-key.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/120 (draft)

## Round 2 — worker — 2026-11-03
`Next step` on entry: `worker` (Status `awaiting approval`) → on exit: `tester` (Status `awaiting verification`)

**TL;DR:** T-097 is built. The keyed bundle (`includeAnswerKey=true`) now has its own strong tag, `"us-<contentVersion>-key"`. The unkeyed tag has not changed (`"us-<contentVersion>"`). `make -C backend check` passes: lint, format check, and 971 tests passed with 9 skipped. Commit `8f825a9` is on `origin/claude/happy-dirac-a1j5no`, which is the brief's `Branch:` header. **Status:** `awaiting verification`. **Next step:** `tester`. **Tests made stale:** none.

**Changes**
- **`/home/user/geo-discovery-zone/backend/app/store.py`**: `bundle_etag` takes a new keyword-only `include_answer_key` (default `False`). When it is true, `-key` is added inside the quotes. The default tag is unchanged, so `GET /bundles` still lists the unkeyed tag (criterion 9).
- **`/home/user/geo-discovery-zone/backend/app/routers/content.py`** (`get_bundle`): one tag for the variant asked for is now used in three places:
  - the `If-None-Match` 304 check;
  - the `ETag` header;
  - the body's `etag` field (criterion 8).
- **`/home/user/geo-discovery-zone/openapi.yaml`**: the `getBundle` description now says:
  - the `ETag` differs between the `includeAnswerKey` variants;
  - a tag from one variant does not revalidate the other;
  - the body's `etag` equals the header;
  - `GET /bundles` lists the unkeyed tag.
- **`/home/user/geo-discovery-zone/backend/tests/test_t097_bundle_etag_variants.py`** (new, 9 tests): my own checks for criteria 1–11. They do not replace the tester's per-criterion tests.
- **`/home/user/geo-discovery-zone/tasks.md`**: two new queue entries for the brief's out-of-scope findings:
  - **T-099**: `bytes` overstates the size of the unkeyed body.
  - **T-100**: an unknown bundle sent with a matching `If-None-Match` gets a 304 instead of a 404.
- **`/home/user/geo-discovery-zone/tasks/T-097-bundle-etag-answer-key.md`**: the Handoff has a table mapping each criterion to where it is handled. I also wrote the Notes, added a worker row to Sessions, and updated Status and Next step.

**Decisions for the reviewer to confirm or overturn**
- **Only the keyed tag changes.** Clients that cached the default bundle keep revalidating as before.
- **The router sets the body's `etag`, not `store.bundle`.** `store.bundle` doesn't know which variant is wanted, so the router sets it in the same place it strips the answer key.

**Caveats**
- **Criterion 10:** the tags stay strong only while `contentVersion` contains no `"`. The old unkeyed tag had the same limit, and the version in the served bank has none.
- **Approval:** the brief's header still read `awaiting approval`, but Approved carried the orchestrator's unattended-run stamp, which the worker role accepts. The criteria themselves have not been checked by a human.
- **mypy:** `mypy app` reports 39 import-not-found errors with or without this change. It runs outside the project's environment and is not part of `make check`, so I left it alone.

No dependencies were added. `backend/pyproject.toml` and `backend/uv.lock` are unchanged.
