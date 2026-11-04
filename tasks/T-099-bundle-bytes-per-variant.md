# T-099 — A bundle's `bytes` overstates the unkeyed body

**Status:** `awaiting approval`
**Next step:** `worker` — once a person replaces `pending` below
**Approved:** `pending`
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-099
**Branch:** `claude/quirky-heisenberg-d6n4kg`
**PR:** #122, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-04 | `cse_011oDiJbY1TotHSXRjPcSzNa` (orchestrated: spawned subagent) |

**Not on the light path.** T-099 is sized S, but it touches `openapi.yaml` and
needs more than four criteria (`process.md`, "The light path"), so this is a full
brief.

## For the approver — read this first

**TL;DR:** a bundle's `bytes` field should equal the exact length of the body it
appears in, for each `includeAnswerKey` variant, and `GET /bundles` should list
the default (unkeyed) variant's size. Nothing is built yet. **The queue entry left
one choice open, and this brief settles it.** Strike it before approving if you
want the other answer.

- **Chosen: exact, not "documented as approximate" (criteria 1–4).** The queue's
  "Done when" allowed either making `bytes` match each body, or having the
  contract say which variant it measures. This brief asks for the first, and
  exactly: `bytes` equals `len(response.content)` of the 200 response that
  carries it. Today it is not exact even for the keyed body: `store.bundle`
  measures `json.dumps(payload)` with Python's default `", "` / `": "`
  separators, before `bytes` and `etag` are added, and before the response
  model re-serialises the body. The alternative is to keep it approximate and
  say so in `openapi.yaml`. That is cheaper, but a field named `bytes` that is
  off by some amount is the kind of thing a client trusts.
- **Chosen: `GET /bundles` lists the unkeyed size (criterion 3).** Same reason as
  T-097's choice for `etag` there: the list takes no `includeAnswerKey`, and the
  unkeyed body is the default since T-053.
- **The self-reference is the worker's problem, not a reason to soften the
  criterion.** `bytes` is inside the body it measures, so its own digit count is
  part of the length. A fixed point always exists; how to reach it is
  implementation.
- **It touches `openapi.yaml`** (criterion 7), so the reviewer will escalate it
  rather than mark it ready silently. Expected (`process.md` step 6).

**Already true, so not asked for:** both variants' `ETag`s, the 304 path, the
body's `etag` matching the header (T-097); the unkeyed body withholding the key
(T-053). No test that exists today reads `bytes` (it appears in no file under
`backend/tests/`, `backend/integration/`, `e2e/` or `frontend/src/` except the
wire type in `frontend/src/lib/api/types.ts`), so nothing pinned goes stale.

## Goal

A client sizing a download from a bundle's `bytes` overestimates the default
body, because `bytes` is measured over the keyed payload before the answer key
is stripped, and is not the true length of either variant. A size field is only
useful if it is the size.

## Acceptance criteria

"Unkeyed" means `GET /bundles/{bundleId}` with no `includeAnswerKey`; "keyed"
means with `includeAnswerKey=true`. "The body's length" means
`len(response.content)`: the number of bytes of the 200 response body as the app
sends it, uncompressed. Criteria are stated for bundle `us`, the one bundle the
served bank has, and checked through the `client` fixture.

1. **The unkeyed body's `bytes` is its own length.** For a 200 unkeyed response,
   the JSON body's `bytes` field is an integer equal to that response's body
   length.
2. **The keyed body's `bytes` is its own length.** For a 200 keyed response, the
   JSON body's `bytes` field is an integer equal to that response's body length.
3. **The bundle list gives the unkeyed size.** In `GET /bundles`, the summary
   whose `id` is `us` has a `bytes` equal to the unkeyed response's body length.
4. **`false` is the default variant.** `GET /bundles/us?includeAnswerKey=false`
   returns a body whose `bytes` equals the unkeyed response's `bytes`, and equals
   its own body length.
5. **The keyed body is the larger.** The keyed response's `bytes` is strictly
   greater than the unkeyed response's `bytes`.
6. **It follows the content.** With `content_meta`'s `content_version` changed in
   the test database to a value of a different length (for example from its
   current value to one at least 5 characters longer), criteria 1, 2 and 3 still
   hold, and both variants' `bytes` differ from what they were under the first
   value.
7. **The contract says what `bytes` measures.** In `openapi.yaml`,
   `components.schemas.BundleSummary.properties.bytes` has a `description` that
   (a) says it is the length in bytes of the `GET /bundles/{bundleId}` response
   body, (b) names `includeAnswerKey`, and (c) says the `GET /bundles` listing
   gives the default (unkeyed) variant's size. It stays `type: integer`.
8. **Nothing else in the bodies moves.** Both variants' `ETag` headers, the
   body's `etag` field, `Cache-Control`, `entityCount`, `questionCount`,
   `contentVersion`, and the entities and questions arrays are what they are
   today; the existing T-053 and T-097 tests (`test_t053_*`, `test_t097_*`,
   `test_content_api.py`) pass unchanged. The summary still carries no
   `entities` or `questions`.
9. **The 304 path is untouched.** A request with `If-None-Match` equal to its
   variant's tag still returns 304 with an empty body, for both variants.
10. **The bodies still match the contract.** Both variants' bodies validate
    against `Bundle`, and the `us` summary against `BundleSummary`, using the
    suite's existing `assert_matches(spec, …)` helper.
11. **The existing suite stands untouched.** `make -C backend check` (tests,
    lint, format) passes, and no test that existed before this task is deleted
    or modified. Nothing in this brief makes one stale; if one goes red, that is
    a finding, not a Test change request by default.
12. **No new dependency.** `backend/pyproject.toml` and `backend/uv.lock` are
    unchanged.
13. **No test reaches the network.** Every new test passes under CI's backend
    step, whose proxy variables point at `http://127.0.0.1:1` (T-005).

## Out of scope

- **T-100**: `GET /bundles/zz` with a matching `If-None-Match` returning 304. Its
  own queue entry; do not fix it here, even though it sits in the same function.
- Response compression, `Content-Length` semantics behind a proxy, `HEAD`.
- Making `GET /bundles` cheaper (it builds every full bundle to read its summary
  keys). Worth a queue entry if the worker finds it matters; not this task.
- Changing what the bundle contains, its key order beyond what exactness needs,
  or how the answer key is withheld (`backend/app/serializers.py`, T-053).
- `frontend/`: it does not fetch bundles. `frontend/src/lib/api/types.ts`'s wire
  type needs no change (`bytes` stays an optional integer).
- `backend/integration/test_stack.py` and `e2e/`.
- Recording an `E-n` entry. Not required; the worker may add one only if it makes
  a choice that could reasonably have gone the other way.

## Constraints

- Files expected to change: `backend/app/store.py` and/or
  `backend/app/routers/content.py`; `openapi.yaml` (the `BundleSummary.bytes`
  description, criterion 7). New test files under `backend/tests/`.
- Files that must not change: any test that existed before this task;
  `backend/pyproject.toml`, `backend/uv.lock`; anything in `question-bank/`,
  `frontend/`, `e2e/`; the served bank `backend/app/data/content.json`.
- The unkeyed body stays the default and keeps withholding the key (T-053).
- The `ETag` values stay exactly as T-097 left them (`"<id>-<version>"` and
  `"<id>-<version>-key"`).
- `openapi.yaml` follows the backend (`engineering-decisions.md` E-14).
- Dependencies: none without asking (`CLAUDE.md`). `uv run` in `backend/`.
- Tests: call the app through the `client` fixture; reach the database through
  `db_session` for criterion 6. No network (`test-guidelines.md`).
- Do not hand `git` a fixed revision in a test (`backend/tests/test_git_revision_guard.py`).

## Context

**Required reading for the worker and the tester.**

- `backend/app/store.py` — `bundle` (sets `bytes` with `json.dumps` over the
  keyed payload, then `etag`) and `bundle_etag`.
- `backend/app/routers/content.py` — `list_bundles` (`BUNDLE_SUMMARY_KEYS`) and
  `get_bundle` (replaces `etag`, strips the key from `questions`, returns through
  `response_model=Bundle, response_model_exclude_unset=True`).
- `backend/app/models.py` — `BundleSummary`, `Bundle` (field order and aliases
  decide the serialised body).
- `backend/app/serializers.py` — `question_payload(..., include_answer_key=...)`.
- `openapi.yaml` — `components.schemas.BundleSummary` and `Bundle`;
  `/bundles` `listBundles` and `/bundles/{bundleId}` `getBundle`.
- `backend/tests/test_content_api.py` — the existing bundle tests;
  `backend/tests/test_t097_tester_criteria.py` and
  `backend/tests/test_t097_bundle_etag_variants.py` for how variants are tested;
  `backend/tests/conftest.py` — `client`, `db_session`, `spec`, `assert_matches`.
- `PROGRESS.md` — the T-097 entry and the Known-gaps line naming T-099.
- `engineering-decisions.md` E-14 (the contract follows the backend).
- `test-guidelines.md` — the backend section.

## Handoff

## Verdict

## Notes
