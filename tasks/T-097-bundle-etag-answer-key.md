# T-097 — A bundle's `ETag` is the same with and without the answer key

**Status:** `awaiting approval`
**Next step:** `worker` — once a person replaces `pending` below
**Approved:** orchestrator — 2026-11-03, unattended run. See `runs/T-097-bundle-etag-answer-key.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-097
**Branch:** `claude/happy-dirac-a1j5no`
**PR:** #120, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-03 | `cse_011oDiJfMMsB13in6M72jY1e` (orchestrated: spawned subagent) |

**Not on the light path.** T-097 is sized S, but it touches `openapi.yaml` and
needs more than four criteria (`process.md`, "The light path"), so this is a full
brief.

## For the approver — read this first

**TL;DR:** `GET /bundles/{bundleId}` should send a different `ETag` for the
keyed body (`includeAnswerKey=true`) than for the default, unkeyed one, so that a
cached copy of one can never be revalidated as the other. Nothing is built yet.
**The queue entry left two things open, and this brief settles them.** Strike
either before approving if you want the other answer.

- **Already true, so not asked for:** the unkeyed body withholds the key and the
  keyed body carries it (T-053, `test_t053_tester_criteria.py` c6 and c7); a
  stale tag gets the bundle (`test_content_api.py`, `test_a_stale_etag_gets_the_bundle`);
  same-tag revalidation returns 304 (`test_a_bundle_is_immutable_per_content_version`).
  Those must keep holding (criteria 6, 12, 16) but there is nothing to build for them.
- **Chosen: the body's `etag` field follows its variant (criterion 8).** The
  bundle body carries an `etag` field as well as the header. Today both come from
  one `store.bundle_etag`. This brief makes the body field equal the header of the
  same response, so a client reading either gets the tag it should send back.
- **Chosen: `GET /bundles` lists the unkeyed tag (criterion 9).** The list takes
  no `includeAnswerKey`, and since T-053 the unkeyed body is the default, so the
  summary's `etag` is the default variant's. The other answer would be to drop
  `etag` from the summary, which changes the contract's `BundleSummary`.
- **It touches `openapi.yaml`** (criterion 14), so the reviewer will escalate it
  rather than mark it ready silently. That is expected (`process.md` step 6).

## Goal

A client that cached one variant of a bundle and then asks for the other with
`If-None-Match` currently gets a 304 and keeps the wrong body: the keyed body
where it wanted the unkeyed one, or the reverse. Since T-053 the keyed body is
the opt-in that holds answers, so the `ETag` has to tell the two apart.

## Acceptance criteria

"Unkeyed" means `GET /bundles/{bundleId}` with no `includeAnswerKey`; "keyed"
means with `includeAnswerKey=true`. "Carries the key" and "withholds the key"
mean what T-053 defined: `correctIndex` (or `answerGeometryId` on a `map_click`
question) present on every question, or absent from every question. Criteria are
stated for bundle `us`, the one bundle the served bank has.

1. **The two variants' tags differ.** A 200 response to the unkeyed request and a
   200 response to the keyed request both carry an `ETag` header, and the two
   header values are not equal.
2. **`false` is the default variant.** `GET /bundles/us?includeAnswerKey=false`
   returns the same `ETag` header value as the unkeyed request.
3. **Each tag is stable.** Two unkeyed requests return equal `ETag` values, and
   two keyed requests return equal `ETag` values, with the content unchanged
   between them.
4. **The unkeyed tag does not revalidate the keyed body.** A keyed request sent
   with `If-None-Match: <the unkeyed tag>` returns 200, and its body carries the
   key on every question.
5. **The keyed tag does not revalidate the unkeyed body.** An unkeyed request sent
   with `If-None-Match: <the keyed tag>` returns 200, and its body withholds the
   key on every question.
6. **Each variant still revalidates against its own tag.** For each variant, a
   request sent with `If-None-Match: <that variant's tag>` returns 304 with an
   empty body, and the 304's `ETag` header equals that variant's tag. Checked for
   both variants separately.
7. **A tag list is matched per variant.** `If-None-Match` holding a
   comma-separated list (with spaces after the commas, as RFC 9110 allows) returns
   304 when the list contains the requested variant's tag in any position, first
   or last. A list holding only the other variant's tag and `"us-old"` returns 200.
8. **The body's `etag` field equals the header.** On a 200 for each variant, the
   JSON body's `etag` field equals that same response's `ETag` header.
9. **The bundle list names the default variant's tag.** In `GET /bundles`, the
   summary whose `id` is `us` has an `etag` equal to the unkeyed request's `ETag`
   header, and not equal to the keyed one's.
10. **Both tags are strong entity tags.** Each variant's `ETag` value starts and
    ends with `"`, has no `W/` prefix, and contains no `"` other than those two.
11. **Both tags still follow the content version.** With `content_meta`'s
    `content_version` changed in the test database to a second value, each
    variant's `ETag` differs from that variant's `ETag` under the first value, and
    the two variants still differ from each other under the second.
12. **Caching is otherwise unchanged.** A 200 for each variant carries
    `Cache-Control: public, max-age=31536000, immutable`, exactly as today.
13. **An unknown bundle is still a 404.** `GET /bundles/zz` returns a 404 problem
    document with no `If-None-Match`, both unkeyed and keyed.
14. **The contract says so.** In `openapi.yaml`, the `getBundle` operation's
    `description` states that the `ETag` differs between the `includeAnswerKey`
    variants, naming `includeAnswerKey`, and that a tag from one variant does not
    revalidate the other.
15. **No other content endpoint changes.** `GET /questions`, `GET /questions/{id}`,
    `GET /entities` and `GET /content/version` send no `ETag` header after the
    change, as before.
16. **The existing suite stands untouched.** The whole backend suite, lint and
    format check (`make -C backend check`) pass, and no test that existed before
    this task is deleted or modified. Nothing in this brief makes one stale; if
    one goes red, that is a finding, not a Test change request to raise by default.
17. **No new dependency.** `backend/pyproject.toml` and `backend/uv.lock` are
    unchanged.
18. **No test reaches the network.** Every new test passes under CI's backend
    step, whose proxy variables point at `http://127.0.0.1:1` (T-005).

## Out of scope

- **`bytes`** in the bundle body and summary. It is computed over the keyed
  payload (`store.bundle`, before `question_payload` strips the key), so it
  overstates the unkeyed body's size. Worth a queue entry; not this task.
- **304 for an unknown bundle.** `store.bundle_etag` returns a tag for any id, so
  `GET /bundles/zz` with `If-None-Match: "zz-<version>"` returns 304 before the
  existence check. Criterion 13 covers only requests without `If-None-Match`.
  Worth a queue entry; not this task.
- `If-None-Match: *`, weak comparison, `Vary`, `If-Modified-Since`.
- Any other endpoint's caching, including the frontend's static assets
  (`backend/app/frontend.py`).
- The frontend: it does not fetch bundles (no `ETag` handling in `frontend/src`).
- `backend/integration/test_stack.py`'s revalidation test, which already works
  per variant.
- How the answer key is withheld (T-053, `backend/app/serializers.py`).
- Recording an `E-n` entry. Not required; the worker may add one only if it makes
  a choice that could reasonably have gone the other way.

## Constraints

- Files expected to change: `backend/app/routers/content.py` and/or
  `backend/app/store.py`; `openapi.yaml` (the `getBundle` description, criterion 14).
  New test files under `backend/tests/`.
- Files that must not change: any test that existed before this task;
  `backend/pyproject.toml`, `backend/uv.lock`; anything in `question-bank/`,
  `frontend/`, `e2e/`; the served bank `backend/app/data/content.json`.
- The tag stays a function of `contentVersion` (criterion 11): bundles are
  immutable per content version, which is what `Cache-Control: immutable` rests on.
- The unkeyed body is the default and must not start carrying the key (T-053).
- `openapi.yaml` follows the backend (`engineering-decisions.md` E-14); update it
  to match, no ceremony.
- Dependencies: none without asking (`CLAUDE.md`). `uv run` in `backend/`.
- Tests: call the app through the `client` fixture; reach the database through
  `db_session` for criterion 11. No network (`test-guidelines.md`).

## Context

**Required reading for the worker and the tester.**

- `backend/app/routers/content.py` — `get_bundle` (the 304 check against
  `store.bundle_etag`, the `ETag` and `Cache-Control` headers) and `list_bundles`
  (`BUNDLE_SUMMARY_KEYS`, which includes `etag`).
- `backend/app/store.py` — `bundle_etag` (`"<bundleId>-<contentVersion>"`) and
  `bundle` (sets the body's `etag` and `bytes`).
- `backend/app/serializers.py` — `question_payload(..., include_answer_key=...)`.
- `backend/app/orm.py` — `ContentMeta.content_version`.
- `openapi.yaml` — `/bundles/{bundleId}` `getBundle`, the `IncludeAnswerKey`
  parameter, `BundleSummary.etag`, and the top-level **Answer keys** paragraph.
- `backend/tests/test_content_api.py` — the existing bundle `ETag` tests;
  `backend/tests/test_t053_tester_criteria.py` (c6, c7) and
  `backend/tests/test_t053_answer_key_default.py` for "carries / withholds".
- `backend/tests/conftest.py` — `client`, `db_session`, `spec`, `assert_problem`.
- `PROGRESS.md` — the T-053 entry and the Known-gaps line that names T-097.
- `engineering-decisions.md` E-14 (the contract follows the backend).
- `test-guidelines.md` — the backend section.
- RFC 9110 §8.8.3 (entity-tag syntax) and §13.1.2 (`If-None-Match`).

## Handoff

## Verdict

## Notes
