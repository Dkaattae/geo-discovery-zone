# T-099 — A bundle's `bytes` overstates the unkeyed body

**Status:** `changes requested`
**Next step:** `tester` — in a session Dkaattae is attending, raise and apply the Test change request for the 9 stale question-bank pins (Review, finding 1)
**Approved:** Dkaattae — 2026-11-04, given in the orchestrator's session ("approved"). See `runs/T-099-bundle-bytes-per-variant.md`.
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
| worker | 2026-11-04 | `cse_011oDiJbY1TotHSXRjPcSzNa` (orchestrated: spawned subagent; same remote session id as the expander — the orchestrator spawns every role inside one web session) |
| tester | 2026-11-04 | `cse_011oDiJbY1TotHSXRjPcSzNa` (orchestrated: freshly spawned subagent; the shared id is not evidence of separation, see Verdict) |
| reviewer | 2026-11-04 | `cse_011oDiJbY1TotHSXRjPcSzNa` (orchestrated: freshly spawned subagent; did not write any of the work) |

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

**TL;DR:** `bytes` is now the exact length of each variant's body (unkeyed 188882,
keyed 196291 on the served bank; it used to say 210404 for both), and `GET /bundles`
lists the unkeyed size. The bodies are otherwise byte-for-byte what they were.
`make -C backend check` passes (1003 passed, 9 skipped; ruff lint + format clean).
**Tests made stale: none.** One unrelated flake seen once, queued as T-101.

**Changed, file by file**

- **`backend/app/store.py`** — `bundle` no longer sets `bytes` (it measured
  `json.dumps` of the keyed dict with default separators, before `etag`). Comment
  says why. `json` import still used elsewhere.
- **`backend/app/routers/content.py`**
  - `_bundle_body(db, id, include_answer_key=)` — builds the variant (body `etag`
    per T-097, key withheld via `question_payload` per T-053), validates it through
    the `Bundle` model and dumps it with `by_alias=True, exclude_unset=True` (what
    FastAPI's `response_model` does), then sizes it. Returns `(dict, rendered bytes)`.
  - `_sized(body)` — renders with `JSONResponse.render` (compact, `ensure_ascii=False`,
    the app's default response class) and iterates `bytes` to the fixed point
    (stops when rendered length == the value written; at most 8 passes, 2–3 in practice).
  - `get_bundle` — returns a `Response` carrying exactly those rendered bytes, with
    the same `ETag`/`Cache-Control` headers and `application/json`. The 304 branch
    is untouched and still runs before any body is built. `response_model=Bundle`
    stays on the decorator for the OpenAPI docs; FastAPI does not re-serialise a
    returned `Response`. The unused `response: Response` parameter was removed.
  - `list_bundles` — reads the summary keys from `_bundle_body(..., include_answer_key=False)`.
- **`openapi.yaml`** — `BundleSummary.properties.bytes` gets a `description`; still `type: integer`.
- **`backend/tests/test_t099_bundle_bytes.py`** (new, worker's own) — both variants
  self-measure, `false` = default, list = unkeyed, follows `content_version`, and a
  unit check of `_sized` across the 10/100/1000-byte digit boundaries.

**Where each criterion lives**

| # | Where |
|---|---|
| 1, 2, 4 | `_bundle_body` + `_sized`; `get_bundle` sends the measured bytes |
| 3 | `list_bundles` via `_bundle_body(include_answer_key=False)` |
| 5 | falls out of 1–2 (key fields add ~7.4 kB) |
| 6 | everything is computed per request from `content_meta`; nothing cached |
| 7 | `openapi.yaml` `BundleSummary.bytes.description` |
| 8 | checked before/after with a throwaway dump (deleted): both variants' JSON minus `bytes` equal, same key order, same `ETag`/`Cache-Control`/`Content-Type`, and identical body lengths (188882 / 196291) — so the rendered form did not change |
| 9 | `get_bundle` 304 branch unchanged, still ahead of `_bundle_body` |
| 10 | unchanged models; the existing contract tests cover it |
| 11–13 | no test files touched other than the new one; no dependency change; no network |

**Deliberately not done**

- T-100 (304 for `zz`), compression, `HEAD` — out of scope.
- `GET /bundles` still builds the full bundle (now also renders it, up to ~3 times).
  Cost on the served bank is small (the whole suite is unchanged in feel); not
  queued, since the brief already names it as a possible follow-up. **Owner: the
  reviewer**, if they think it deserves a `tasks.md` entry.

**Contradicts the brief:** nothing. One note: the Status line still read
`awaiting approval` while **Approved** named Dkaattae; I took the Approved line as
authoritative and started.

**How to run:** `make -C backend check`, or
`cd backend && uv run pytest -q tests/test_t099_bundle_bytes.py`.

**Tests made stale:** none.

**Flake, not caused by this task:** the first full run failed
`tests/test_t040_tester_criteria.py::test_c25_a_perfect_mixed_session_reaches_100_distinct_served_questions`
(a random 100-question mixed session served no `map_identify`). It passed alone
and on the full rerun; it exercises session selection (`selection.py`, unseeded
`random`), which this task does not touch. Queued as **T-101** in `tasks.md`.
**Owner: tester**, if it recurs during verification — it is not a T-099 failure.

## Verdict

**TL;DR: pass.** All 13 criteria hold. `bytes` is now exact for both variants
(unkeyed 188882, keyed 196291; was 210404 for both), `GET /bundles` lists the
unkeyed size, and nothing else in the bodies moved. Full `make -C backend check`
green under CI's dead proxy: **1016 passed, 9 skipped**, ruff lint + format clean.
Next: reviewer (it touches `openapi.yaml`, so expect escalation).

**Independence, stated plainly.** This run is orchestrated
(`runs/T-099-bundle-bytes-per-variant.md` exists), so my session id
`cse_011oDiJbY1TotHSXRjPcSzNa` is the same as the expander's and the worker's, and
the Sessions-table check proves nothing. My independence rests only on being a
freshly spawned subagent with its own context: I did not see the work happen or
the worker's reasoning. That is weaker than a separate session, because it
depends on the orchestrator having spawned me correctly, not on anything I can
check myself.

**Tests:** `backend/tests/test_t099_tester_criteria.py`, 13 tests named `test_c<N>_…`.

| # | Verdict | Evidence |
|---|---|---|
| 1 | pass | `test_c1_unkeyed_body_bytes_is_its_own_length`: integer, == `len(response.content)` |
| 2 | pass | `test_c2_keyed_body_bytes_is_its_own_length` |
| 3 | pass | `test_c3_bundle_list_gives_the_unkeyed_size`, `test_c3_bundle_list_is_not_the_keyed_size` |
| 4 | pass | `test_c4_false_is_the_default_variant` |
| 5 | pass | `test_c5_keyed_bytes_is_strictly_larger` |
| 6 | pass | `test_c6_bytes_follows_a_longer_content_version`: version +12 chars via `db_session`, confirmed visible through `/content/version`; 1–3 re-checked; both variants' `bytes` changed |
| 7 | pass | `test_c7_contract_describes_what_bytes_measures`: `type: integer`; the description names `GET /bundles/{bundleId}`, "length in bytes", "response body", `includeAnswerKey`, the `GET /bundles` listing, and "default (unkeyed)" |
| 8 | pass | `test_c8_headers_and_body_etag_are_as_t097_left_them` (`"us-<v>"` / `"us-<v>-key"`, body `etag` == header, `Cache-Control`, `application/json`, `contentVersion`), `test_c8_counts_and_arrays_are_unchanged_between_variants`, `test_c8_summary_carries_no_entities_or_questions`. **Also a one-off comparison against the pre-task commit `5eba340`** (worktree, same fixture DB): for unkeyed, keyed and `=false`, the body without `bytes` (values and key order), the status, the `ETag`/`Cache-Control`/`Content-Type` headers and the 304 responses are all identical, and so is the `/bundles` list without `bytes`. Body lengths are unchanged too (188882 / 196291). The existing `test_t053_*`, `test_t097_*` and `test_content_api.py` pass unchanged |
| 9 | pass | `test_c9_304_path_is_untouched_for_both_variants`: 304, empty body, same `ETag`, both variants |
| 10 | pass | `test_c10_bodies_still_match_the_contract` (`assert_matches` for `Bundle` ×2 and `BundleSummary`) |
| 11 | pass | `make -C backend check` green. Checked by hand: `git diff --name-status 5eba340..HEAD` shows only one test file added, `test_t099_bundle_bytes.py` (the worker's), and no existing test changed |
| 12 | pass | Checked by hand: no diff in `backend/pyproject.toml` or `backend/uv.lock` (nor `question-bank/`, `frontend/`, `e2e/`, `backend/app/data/content.json`) |
| 13 | pass | Whole suite run with `HTTP(S)_PROXY`/`ALL_PROXY` (both cases) = `http://127.0.0.1:1`; the new tests use only `client` / `db_session` |

**The tests go red on the old code.** Copied into a worktree at `5eba340`, 7 of
the 13 fail (c1, c2, c3-unkeyed, c4, c5, c6, c7). The other 6 pin things that were
already true and must stay true (criteria 8–10, and c3-not-keyed, since 210404
was never the keyed size either).

**Mutations** to `backend/app/routers/content.py`, each reverted with
`git checkout` (tree clean afterwards):

| Mutation | Went red |
|---|---|
| `list_bundles` sizes the keyed variant | c3 ×2, c6, c8-summary |
| `_sized` fixed-point test off by one (never converges, so a 500) | 12 of 13 |
| `_sized` stops after one pass (no fixed point) | c1, c2, c4, c6 |
| old measure restored (`json.dumps` default separators) | c1, c2, c3, c4, c6 |
| keyed `ETag` header loses `-key` | c8-headers |

**Flake T-101** (`test_c25_…` in `test_t040_tester_criteria.py`) did not come up
in my run.

**Test change request:** none. No existing test is stale.

## Notes

- **Surprise:** the old value (210404) overstated even the keyed body (196291) by
  ~7%, from Python's default `", "`/`": "` separators.
- **Decision — render it ourselves and send those bytes**, rather than predicting
  what FastAPI's serialiser would emit. Predicting would have been exact only as
  long as FastAPI's rendering path stayed the same; sending the measured bytes is
  exact by construction. Cost: `get_bundle` returns a `Response`, so FastAPI does
  not validate it against `response_model` — but the body *is* produced by
  `Bundle.model_validate(...).model_dump(...)`, so the same validation runs.
  **Owner: reviewer** to confirm or overturn; no E-n entry written since the brief
  said only if the choice could reasonably go the other way, and I think this one
  is the only exact option.
- **`_sized` imported in the worker test** is a private helper; the unit test is
  there because the digit-boundary case cannot be reached through the one bank.

## Review

**TL;DR: sent back to the `tester`.** CI on PR #122 is red: 9 pre-existing
question-bank whole-tree pins fail on this task's own `backend/app/` and
`openapi.yaml` changes, the same set T-097 tripped. The tester's `pass` covered
only `make -C backend check`, which is green. The code itself is good and I
have no other blocking finding. **Needs `tester` to come back, in a session
Dkaattae is attending, and raise and apply a Test change request for finding 1**
(D-14, D-15; `process.md` step 4: "Red CI caused by a stale test sends the task
to the tester, not the worker"). PR stays draft. I committed a sweep and then
reverted it, because I checked CI only after the sweep. The brief is back.

**Evidence:** CI run 41868187805 (the head before review, `edb0040`): question-bank job
red at `Test`; backend (lint, format, test), backend (postgres), frontend,
integration and e2e green. Reviewer's own `make -C backend check` under
the dead proxy: 1016 passed, 9 skipped, lint and format clean.

### Blocking

1. **9 stale pre-existing tests in `question-bank/` (CI red).** Each one hashes
   `backend/app/` or `openapi.yaml` against an older commit, and T-099 changes
   both, as its Constraints allow:
   - `question-bank/src/climate-cold-trade-accepted-verify.test.ts`: T-091
     criterion 20 ("every non-test file under question-bank/src/, backend/app/,
     frontend/src/ is 12d242e's"), and criterion 22 ×2 ("every tracked
     non-test file outside the allowed list is 12d242e's"; "pre-existing test
     files are main's, except ones in an approved Test change request", which
     fails on the two new `test_t099_*` files).
   - `question-bank/src/farm-animal-loose-ends-verify.test.ts`: T-096
     criterion 21.
   - `question-bank/src/map-click-no-candidates-verify.test.ts`: T-092
     criterion 16 ×2 (`backend/app` and `openapi.yaml` "byte-identical to
     T-097's").
   - `question-bank/src/refresh-regenerate-reminder-verify.test.ts`: T-087
     criterion 15.
   - `question-bank/src/familiarity-drawn-apart-verify.test.ts`: T-085a
     criterion 25 (`openapi.yaml` unchanged since `ed00235`).
   - `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`: T-088
     criterion 21 (`openapi.yaml` byte-identical to main's).

   **What would make it acceptable:** the tester raises a `## Test change
   request` with one row per test, in the same form as T-097's 10-row re-pin
   (PR #120), gets Dkaattae's approval in an attended session, applies exactly
   those rows, and re-verifies with **every CI job** green, not only the backend
   suite. Criterion 11 already treats this case as a finding ("if one goes red,
   that is a finding"). Its "`make -C backend check`" wording is why both worker
   and tester missed it. That is process ticket P-18, not a criterion defect, so
   the criteria stand and the expander is not needed.
   *Local note:* `bun test` in `question-bank/` here also fails `lint-gate.test.ts`
   (T-066), because this sandbox's oxlint is missing. CI passes it, so it is
   environmental and not part of the request.

### Not blocking (dispose at the next review's sweep)

2. **`response_model_exclude_unset=True` is now inert** on `get_bundle`'s
   decorator (`backend/app/routers/content.py:286`). The handler returns a raw
   `Response`, so FastAPI applies neither that flag nor `response_model`
   validation. `response_model=Bundle` still earns its place because it drives the
   generated docs. Cosmetic. **Goes into T-100** at the sweep, since T-100 has to
   edit the same function. A new one-line task would only lengthen the queue.
3. **The worker test imports a private helper (`_sized`).** Accepted. The
   digit-boundary case cannot be reached through the one served bank, and the
   test says so.
4. **`GET /bundles` now renders each full bundle up to ~3 times.** Not queued.
   There is one bundle, and the brief already put list cost out of scope.

### Worker flags, disposed

- **"Render it ourselves and send those bytes": confirmed.** It is exact by
  construction. Predicting FastAPI's serialiser would stay exact only until that
  code path changed. Validation is not lost, because the body still goes through
  `Bundle.model_validate(...).model_dump(by_alias=True, exclude_unset=True)`.
  No E-n entry needed.
- **Status said `awaiting approval` while `Approved:` named Dkaattae: settled.**
  The run log records the person's verbatim reply in the orchestrator's session.
  The `Approved:` line is authoritative.
- **List cost: not queued** (finding 4).
- **T-101 (flaky `test_t040` c25): kept** in the queue as the worker wrote it.
  It did not recur in the tester's run or mine.

### Lanes and branch (checked, fine)

- Every role's commit is on this branch: expander `c5f01e1`, `88590a3`
  (`tasks/` and `tasks.md` only); worker `841d43c`; tester `5f3e363` (one new
  test file and the brief, no source). The orchestrator's run-log commits touch
  only `runs/`. No `ci-fix` round.
- Source changes are only in `backend/app/routers/content.py` and
  `backend/app/store.py`. `openapi.yaml` changes only in `BundleSummary.bytes`.
  No dependency, `question-bank/`, `frontend/`, `e2e/` or `content.json` change.

**When it comes back:** once CI is green, I expect to approve and **escalate**,
for the `openapi.yaml` change only (a description, no shape change). The
re-pin rows will also go into the PR body. The sweep then also amends T-100
(finding 2).
