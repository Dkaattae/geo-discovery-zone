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
