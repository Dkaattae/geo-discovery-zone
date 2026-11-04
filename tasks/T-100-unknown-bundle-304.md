# T-100 — `GET /bundles/zz` with a matching `If-None-Match` returns 304

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** orchestrator — 2026-11-04, unattended run. See `runs/T-100-unknown-bundle-304.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-100
**Branch:** `claude/ecstatic-hopper-lp3me9`
**PR:** #123, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-04 | cse_011oDiJeFc5BLAbjAcwGQdfw |

## Goal

An unknown bundle id must be a 404 whatever the client sends in `If-None-Match`.
Today `get_bundle` answers the conditional check before it checks the bundle
exists, and `store.bundle_etag` mints a tag for any id, so `GET /bundles/zz` with
`If-None-Match: "zz-<contentVersion>"` gets a 304 — a cache is told a resource
that does not exist is fresh.

## Survey — what is already true

- **The bug is real on `main` (`15a3175`).** `backend/app/routers/content.py`
  `get_bundle` computes `etag = store.bundle_etag(...)` and returns 304 on a match
  before calling `_bundle_body`; `store.bundle_etag` (`backend/app/store.py:276`)
  never consults `bundle_ids`. Read from the source, not run.
- **An unknown bundle with no `If-None-Match` is already a 404 problem document**,
  for both variants: `test_t097_tester_criteria.py::test_c13_an_unknown_bundle_is_still_a_404`.
  Criterion 1 below extends that to the conditional request; it does not redo it.
- **The 404 shape already exists**: `app.problems.not_found("Bundle", ...)`, and
  `tests.conftest.assert_problem` checks it.
- **`openapi.yaml` already declares 304 and 404** for `getBundle`
  (`/bundles/{bundleId}`, `responses`). Nothing in the contract needs to change.
- **A cheap existence check already exists**: `store.bundle_ids(db)` reads only
  the distinct `entities.scope` values. Whether the worker uses it is the
  worker's call; criterion 6 states the cost bound, not the function.
- **`response_model_exclude_unset=True` on the `get_bundle` decorator is inert**:
  since T-099 (PR #122) the handler returns a raw `Response`, so FastAPI never
  applies the response model to it. Removing it should change no served byte.

## Acceptance criteria

"Unknown bundle" below means an id not returned by `GET /bundles` — the tests use
`zz`. "`<cv>`" is the seeded `contentVersion` (`ContentMeta.content_version`, as
the T-097 tests read it). "Unkeyed" is no `includeAnswerKey` parameter; "keyed" is
`includeAnswerKey=true`.

1. `GET /bundles/zz` with `If-None-Match: "zz-<cv>"` (unkeyed) and with
   `If-None-Match: "zz-<cv>-key"` and `includeAnswerKey=true` (keyed) each return
   **404** with an `application/problem+json` body whose `status` is 404 — i.e.
   they pass `tests.conftest.assert_problem(response, 404)`.
2. `GET /bundles/zz` returns that same 404 problem document, for **both**
   variants, when `If-None-Match` holds each of: the other variant's tag for
   `zz` (`"zz-<cv>-key"` unkeyed, `"zz-<cv>"` keyed); a comma-separated list
   containing the matching tag among others (`"zz-old", "zz-<cv>"` unkeyed and
   `"zz-old", "zz-<cv>-key"` keyed); and `*`.
3. None of the 404 responses in criteria 1 and 2 carries an `ETag` header, and
   none carries a `Cache-Control` header containing `immutable`. (A 404 cached
   as immutable would outlive the bundle being added.)
4. For the known bundle `us`, conditional behaviour is unchanged, for both
   variants: `If-None-Match` equal to that variant's own `ETag` (alone, or inside
   a comma-separated list) returns **304** with an empty body and an `ETag`
   header equal to that tag; the other variant's tag, or `"us-old"`, returns
   **200** with the full bundle.
5. For the known bundle `us`, the unconditional 200 response is unchanged, for
   both variants: `ETag` and `Cache-Control: public, max-age=31536000, immutable`
   headers present, body `etag` equal to the `ETag` header, body `bytes` equal to
   the length of the response body as sent, and the body matching the
   `Bundle` schema in `openapi.yaml`.
6. A 304 response for `us` (either variant) is served without reading the
   `questions` table: no SQL statement executed while handling that request
   names the `questions` table. (The existence check must stay cheap; a matching
   tag must not cost a full bundle render.)
7. The FastAPI route serving `GET /bundles/{bundleId}` — the `APIRoute` in
   `app.main.app.routes` whose path ends in `/bundles/{bundleId}`, whatever
   `API_PREFIX` is — has `response_model_exclude_unset` false, and its
   `response_model` is still `app.models.Bundle`.
8. `GET /bundles` is unchanged: it lists `us` with the unkeyed variant's `etag`
   and `bytes`, and does not list `zz`.
9. **No pre-existing test is deleted or modified.** Every test that exists on
   `main` at `15a3175` is present and unedited on the branch. (Checked by hand
   against the branch diff and recorded in the Verdict — not pinned in a test
   that diffs against a fixed commit, E-11 / E-12.)
10. **No dependency change**: `backend/pyproject.toml` and `backend/uv.lock`,
    and every `package.json` / `bun.lock`, are untouched.
11. **`openapi.yaml` is untouched**, as are migrations, `geoquizdataplan.md`,
    and every file under `backend/app/data/`.
12. **No test reaches the network**: new tests use only the in-process
    `client` / `db_session` fixtures, and the backend suite passes with the
    proxy variables pointed at `http://127.0.0.1:1`, as CI runs it.
13. The whole backend check (`make -C backend check`) passes, plus the
    frontend and question-bank suites, unchanged.

## Out of scope

- **`If-None-Match: *` on a known bundle.** RFC 9110 says `*` matches any current
  representation, so `GET /bundles/us` with `*` arguably should be 304; today it
  is 200. Criterion 2 only requires `*` on an *unknown* bundle to be 404. If the
  worker thinks the known-bundle `*` case worth fixing, it becomes a new
  `tasks.md` entry, not a commit here.
- **Weak validators** (`W/"..."`) and `If-Modified-Since`. Not supported today,
  not asked for.
- **`store.bundle_etag`'s return value for unknown ids.** It may keep minting a
  tag for any id, or not; the criteria are about what the endpoint serves.
- **Any other endpoint's 404 / conditional behaviour** (`/questions/{id}`,
  `/entities/{id}`, `/geometry/{layer}`).
- **`list_bundles`'s `response_model_exclude_unset=True`.** It returns a dict and
  the flag is live there. Leave it.
- **The `bytes` sizing (`_sized`, `_bundle_body`)**, settled by T-099.
- **T-101** (the flaky `test_t040` c25). If it goes red during this task, it is
  that task's flake, not this one's — rerun, and say so in the Handoff / Verdict.

## Constraints

- **Files expected to change:** `backend/app/routers/content.py`, and possibly
  `backend/app/store.py` if the existence check moves there. New test file(s)
  under `backend/tests/` (e.g. `test_t100_*.py`). Nothing else outside `tasks/`.
- **Invariants:** a matching tag for a known bundle still short-circuits to 304
  before the bundle body is built (criterion 6). The 200 response stays the raw
  measured `Response` T-099 built, so `bytes` is still the length sent.
- **Dependencies:** none, without asking (`CLAUDE.md` "Packages").
- **Existing tests are not the worker's to change** (D-14). None is expected to
  go stale: no existing test asserts a 304 for an unknown id. If one turns out
  to, list it under **Tests made stale** in the Handoff.
- **Envelope:** this task touches no `openapi.yaml`, migration, plan, or child-
  facing text, so a clean pass should land inside the reviewer's envelope.

## Context

Required reading for the worker and the tester.

- **Source:** `backend/app/routers/content.py` — `get_bundle`, `_bundle_body`,
  `list_bundles`; `backend/app/store.py` — `bundle_ids` (line 271),
  `bundle_etag` (276), `bundle` (289); `backend/app/problems.py` — `not_found`.
- **Existing tests on the same surface:** `backend/tests/test_t097_tester_criteria.py`
  (its `fetch` helper and how it reads `<cv>`; `test_c13` is the unconditional
  404), `backend/tests/test_t097_bundle_etag_variants.py`,
  `backend/tests/test_t099_tester_criteria.py`,
  `backend/tests/test_content_api.py` (`test_a_bundle_is_immutable_per_content_version`,
  `test_a_stale_etag_gets_the_bundle`), `backend/tests/conftest.py`
  (`assert_problem`, `client`, `db_session`).
- **Contract:** `openapi.yaml` `/bundles/{bundleId}` → `get` (`getBundle`):
  description and the `304` / `404` responses; `components.responses.NotFound`.
- **Queue entry:** `tasks.md` §E, T-100, including the T-099 review note about
  `response_model_exclude_unset`.
- **Decisions:** `engineering-decisions.md` E-11, E-12 (why criterion 9 is
  checked by hand, not by a test pinned to a commit).
- **Guidelines:** `test-guidelines.md` — no network, test below the transport
  where you can; here the endpoint is the behaviour, so the in-process
  `httpx.ASGITransport` client is the right level. For criterion 6, a SQLAlchemy
  `before_cursor_execute` listener on the test engine is a fair way to observe
  which tables a request touches.

## Handoff

## Verdict

## Notes
