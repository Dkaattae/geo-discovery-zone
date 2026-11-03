# T-097 — A bundle's `ETag` is the same with and without the answer key

**Status:** `pass`
**Next step:** `reviewer` — re-review the re-pin diff (`c53efe2`), then sweep and escalate
**Approved:** orchestrator — 2026-11-03, unattended run. See `runs/T-097-bundle-etag-answer-key.md`.
**Test changes:** `approved — Dkaattae, 2026-11-03`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-097
**Branch:** `claude/happy-dirac-a1j5no`
**PR:** #120, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-03 | `cse_011oDiJfMMsB13in6M72jY1e` (orchestrated: spawned subagent) |
| worker | 2026-11-03 | `cse_011oDiJfMMsB13in6M72jY1e` (orchestrated: spawned subagent) |
| tester | 2026-11-03 | `cse_011oDiJfMMsB13in6M72jY1e` (orchestrated: spawned subagent) |
| reviewer | 2026-11-03 | `cse_011oDiJfMMsB13in6M72jY1e` (orchestrated: spawned subagent) — changes requested |
| tester | 2026-11-03 | `cse_011oDiJfMMsB13in6M72jY1e` (orchestrated: spawned subagent) — round 2, test change request raised |
| tester | 2026-11-03 | `cse_011oDiJc13uC7U2DoNZsmfCm` (attended, separate session) — round 3, applied approved rows 1-10 |

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

**TL;DR:** built. The keyed bundle now has its own tag, `"us-<contentVersion>-key"`;
the unkeyed tag is unchanged at `"us-<contentVersion>"`. The 304 check, the
`ETag` header and the body's `etag` all use the requested variant's tag.
`make -C backend check` is green (971 passed, 9 skipped). **Tests made stale: none.**

**What changed, file by file**

- **`backend/app/store.py`**: `bundle_etag(db, bundle_id, *, include_answer_key=False)`.
  The keyed variant appends `-key` inside the quotes. The default is unchanged, so
  `store.bundle` (and therefore `GET /bundles`) still carries the unkeyed tag.
- **`backend/app/routers/content.py`** `get_bundle`: computes the tag with
  `include_answer_key=includeAnswerKey`, compares `If-None-Match` against it (same
  comma-split and strip as before), sends it as `ETag`, and overwrites the body's
  `etag` with it on the copied dict.
- **`openapi.yaml`**: `getBundle` `description` gains a paragraph. It says the `ETag`
  differs between the `includeAnswerKey` variants, that one variant's tag does not
  revalidate the other, that the body `etag` equals the header, and that
  `GET /bundles` lists the unkeyed tag.
- **`backend/tests/test_t097_bundle_etag_variants.py`** (new, 9 tests): the worker's
  own checks for criteria 1-11. They are not the per-criterion tests; those are yours.
- **`tasks.md`**: two new queue entries for the brief's out-of-scope findings:
  **T-099** (`bytes` overstates the unkeyed body) and **T-100** (an unknown bundle
  with a matching `If-None-Match` gets a 304).

**Where each criterion lives**

| # | Where |
|---|---|
| 1, 2, 3 | `store.bundle_etag`: the suffix depends only on the flag, and `false` is the default |
| 4, 5, 6, 7 | `get_bundle`: the set membership check against the variant's own tag |
| 8 | `get_bundle`: `bundle["etag"] = etag` |
| 9 | `list_bundles` → `store.bundle` → `bundle_etag` with the default (unkeyed) |
| 10 | Tag format `"<id>-<version>[-key]"`. One caveat: it holds only if `contentVersion` itself has no `"` in it. That was already true of the unkeyed tag before this task, and the served bank's version has none |
| 11 | Both variants take `content_meta.content_version`. My test changes it through `db_session` |
| 12, 13 | Unchanged code paths in `get_bundle` |
| 14 | `openapi.yaml`, `/bundles/{bundleId}` → `getBundle` → `description` |
| 15 | Nothing else touched. Only `get_bundle` sets `ETag` |
| 16 | `make -C backend check`: ruff check passed, format check passed, 971 passed, 9 skipped. No existing test touched |
| 17 | `backend/pyproject.toml` and `backend/uv.lock` are not in the diff |
| 18 | The new tests use only the in-process `client` and `db_session` |

**Deliberately not done**

- **The out-of-scope items** (`bytes`, unknown-bundle 304, `Vary`, `*`, weak
  comparison) were left alone. The first two are queued as T-099 and T-100.
- **No `E-n` entry.** Changing only the keyed tag, so the default stays as it was,
  is the obvious choice. It is not a fork worth recording.

**Contradictions with the brief:** none found. The brief's header still read
`awaiting approval` / "once a person replaces `pending`", but **Approved** carried
the orchestrator's unattended-run stamp, which the worker role accepts.

**How to run:** `make -C backend check`, or
`cd backend && uv run pytest tests/test_t097_bundle_etag_variants.py`.

**Tests made stale:** none.

## Verdict

**TL;DR: pass.** I applied all 10 approved Test change request rows in `c53efe2`. The
question-bank suite is now green (2713 pass, 0 fail), and the backend is still green
(`make -C backend check`: 998 passed, 9 skipped, proxies at `http://127.0.0.1:1`).
**Next:** the reviewer re-reviews the re-pin diff, then sweeps and escalates.

### Round 3 (attended, session `cse_011oDiJc13uC7U2DoNZsmfCm`)

- **Independence: a separate session.** My id is not in the Sessions table under any
  other role. A person started me directly and answered me in the session.
- **Approval.** I put the 10 rows to the person one line each. Their answer was
  "Approve all 10 rows", and the name for the record is "Dkaattae". The header now reads
  `Test changes: approved — Dkaattae, 2026-11-03`.
- **The rows still held on the current branch.** Before the edit the question-bank
  suite had the same 9 failures (2704 pass, 9 fail). Since `4cbe98a` only the brief
  and the run log had changed, and both are in the allowed sets.
- **Applied exactly rows 1-10, nothing else** (`c53efe2`, 6 files): the digests from the
  request, the two T-097 paths in both allowed sets, `MAIN_TESTS_COUNT` 116 → 118, the two
  T-092 renames to "T-097's", and the comments. Row 10's four
  `APPLIED_REQUEST_FILE_SHAS` were recomputed after rows 4 and 6-9 had been applied
  with their comments:
  - agriculture: `4c1a470b…`
  - map-click: `c085d888…`
  - farm-animal: `f965c702…`
  - familiarity: `b448ddf4…`
- **No pin weakened.** Every count stayed the same except row 2's, which rose by exactly
  T-097's two new test files. No test was deleted.
- **Suites after the commit:**

| Suite | Result |
|---|---|
| question-bank `bun test` | 2713 pass, 0 fail |
| question-bank typecheck, lint, format:check | clean |
| backend `make -C backend check` (ruff, format, pytest) | 998 passed, 9 skipped |
| frontend | **not run locally**: `bun install --frozen-lockfile` fails here with proxy 403s on npm tarballs, so `node_modules` is incomplete. T-097 changes nothing under `frontend/` (`git diff origin/main -- frontend` is empty). CI's frontend job is the evidence |

- **The 18 criteria:** the source has not changed since round 1 (`1f48f9f`), so round 1's
  per-criterion tests and mutations still stand. Criteria 16 and 17 hold as the person
  accepted them in substance: no backend test changed, and the only pre-existing tests
  that changed are the 9 approved question-bank pins.

**TL;DR: test changes requested, halted for a person.** The 18 criteria still hold
(backend unchanged since round 1: `make -C backend check` green, 998 passed, 9 skipped,
proxies at `http://127.0.0.1:1`). The question-bank suite is red on exactly the 9
whole-tree pins the reviewer named (2704 pass, 9 fail, same as CI). Each goes red
because of a file the Constraints require T-097 to change, so it is a stale pin, not
a fail. The 10-row request below re-pins them. **Needed next:** a person approves or
refuses each row in an attended `tester` session for T-097.

**Independence: weaker than a separate session.** Orchestrated run
(`runs/T-097-bundle-etag-answer-key.md` exists), so my session id matches the
worker's and the Sessions check proves nothing. I am a freshly spawned subagent
that did not see the worker's or the round-1 tester's reasoning. That rests on the
orchestrator having spawned me correctly, not on anything I could verify.

### Round 2 (this session)

- **Source unchanged since round 1.** `git diff --name-only 1f48f9f HEAD` lists only
  the brief and the run log, so round 1's per-criterion tests and mutations still
  apply to the same code. I re-ran the backend suite rather than re-mutating.
- **Question-bank suite, on this branch:** 2704 pass, 9 fail. All 9 are the rows
  below (1-9). On first run 12 more T-066 lint tests failed only because
  `question-bank/node_modules` was absent; `bun install --frozen-lockfile` fixed
  that and changed no tracked file.
- **Stale, not a fail.** Every one of the 9 pins a file that T-097's Constraints
  require to change (`backend/app/store.py`, `backend/app/routers/content.py`,
  `openapi.yaml`, new files under `backend/tests/`) or the loop records every task
  adds (brief, run log). No pin catches a behaviour that is wrong.
- **Contradiction for the approver to judge (reviewer finding 1).** Criterion 16
  says no pre-existing test is modified and "Nothing in this brief makes one stale";
  Constraints forbid changes in `question-bank/`. Both are false in letter: the
  required changes do make these pins stale. T-053, T-093 and T-098 had the same
  conflict and the person accepted the re-pin in substance. If you would rather
  amend the criterion first, refuse the rows and send the brief to `task-expander`.

**Dry run (in a scratch worktree, deleted afterwards; nothing in the repo was
edited).** I applied rows 1-10 to a detached worktree at `4cbe98a`, without the new
comments:

- **The question-bank suite went green:** 2713 pass, 0 fail.
- **Every old pin came back with T-097's changes taken out.** Restoring `store.py`,
  `routers/content.py` and `openapi.yaml` to `d7273bd` and untracking the two
  `test_t097_*.py` files, with the T-097 loop records in the allowed sets, gives
  290 / `5e702ce3…`, 116 / `d367f38f…`, `c6cf34f6…`, 286 / `7ad951c7…`, `69778f17…`,
  `0da5b1a5…`, `a89a88a0…` and `37db5438…`. Those are today's pins, so the new
  digests differ from them only by T-097's own files.
- **The digest script reproduces every current pin at `d7273bd`** (main, before
  T-097), so it computes what the tests compute.

**Tests made stale:** the worker said none, and so did round 1. Both missed these 9,
because both ran only the backend suite. I found nothing beyond the reviewer's 9.
Row 10 is the cascade, green today.

### Round 1 (superseded: it ran the backend suite only)

**TL;DR (round 1): pass.** All 18 criteria hold. 27 new tester tests in
`backend/tests/test_t097_tester_criteria.py`, every one green; `make -C backend check`
green (ruff, format, 998 passed, 9 skipped) with the proxy variables at
`http://127.0.0.1:1`. 12 mutations of the source, each caught and each reverted.
Next: reviewer, who escalates it for the `openapi.yaml` change (expected).

**Independence: weaker than a separate session.** This was an orchestrated run
(`runs/T-097-bundle-etag-answer-key.md` exists), so the session id is the same as
the worker's and the Sessions check proves nothing. The independence rests on my
being a freshly spawned subagent with its own context: I did not see the worker's
conversation or reasoning. That depends on the orchestrator having spawned me
correctly, not on anything I could verify.

| # | Verdict | Evidence (`test_t097_tester_criteria.py`) |
|---|---|---|
| 1 | pass | `test_c1_the_two_variants_tags_differ` |
| 2 | pass | `test_c2_false_is_the_default_variant` |
| 3 | pass | `test_c3_each_tag_is_stable[unkeyed/keyed]` |
| 4 | pass | `test_c4_the_unkeyed_tag_does_not_revalidate_the_keyed_body` (200, key carried on every question) |
| 5 | pass | `test_c5_the_keyed_tag_does_not_revalidate_the_unkeyed_body` (200, key withheld on every question) |
| 6 | pass | `test_c6_each_variant_revalidates_against_its_own_tag[unkeyed/keyed]` (304, empty body, `ETag` equals own tag) |
| 7 | pass | `test_c7_a_tag_list_containing_the_variants_tag_is_a_304[first/last × unkeyed/keyed]`, `test_c7_a_list_of_only_the_other_variants_tag_and_an_old_one_is_a_200[unkeyed/keyed]` (lists joined with `", "`) |
| 8 | pass | `test_c8_the_body_etag_equals_the_header[unkeyed/keyed]` |
| 9 | pass | `test_c9_the_bundle_list_names_the_default_variants_tag` |
| 10 | pass | `test_c10_both_tags_are_strong_entity_tags[unkeyed/keyed]` |
| 11 | pass | `test_c11_both_tags_follow_the_content_version` (sets `content_version` through `db_session`) |
| 12 | pass | `test_c12_cache_control_is_unchanged[unkeyed/keyed]` |
| 13 | pass | `test_c13_an_unknown_bundle_is_still_a_404[unkeyed/keyed]` (via `assert_problem`) |
| 14 | pass | `test_c14_the_contract_says_the_etag_differs_between_variants`, `test_c14_the_contract_says_one_variants_tag_does_not_revalidate_the_other` |
| 15 | pass | `test_c15_no_other_content_endpoint_sends_an_etag` (`/questions`, `/questions/{id}`, `/entities`, `/content/version`) |
| 16 | pass | `make -C backend check` green. `git diff --name-status d7273bd HEAD -- backend/tests` shows only `A backend/tests/test_t097_bundle_etag_variants.py`: no existing test changed or deleted. Checked by hand, not pinned (E-11, E-12) |
| 17 | pass | `git diff d7273bd HEAD -- backend/pyproject.toml backend/uv.lock` is empty. Also empty for `question-bank/`, `frontend/`, `e2e/`, `backend/app/data/`. Checked by hand |
| 18 | pass | Whole suite run with `HTTP(S)_PROXY`/`ALL_PROXY` (both cases) at `http://127.0.0.1:1`; new tests use only `client` and `db_session` |

**Mutations** (each applied alone, run against the tester file, then reverted with
`git checkout -- backend/app openapi.yaml`; `git status` clean of source changes afterwards):

| Mutation | Went red |
|---|---|
| M1 keyed suffix removed (both variants share a tag) | c1, c4, c5, c7 (other-variant list ×2), c9, c11 |
| M2 304 check compares against the unkeyed tag only | c4, c6[keyed], c7 (other-variant list, keyed) |
| M3 body `etag` not overwritten with the variant's tag | c8[keyed] |
| M4 `contentVersion` dropped from the tag | c11 |
| M5 `If-None-Match` entries not stripped | c7 (304 list, `last` ×2) |
| M6 tags made weak (`W/` prefix) | c10 ×2 |
| M7 keyed suffix contains an inner `"` | c10[keyed] |
| M8 `bundle_etag` defaults to the keyed variant (list shows keyed tag) | c9 |
| M9 `Cache-Control` changed | c12 ×2 |
| M10 `getBundle` description's new sentences deleted | c14 ×2 |
| M11 `GET /content/version` sends an `ETag` | c15 |
| M12 unknown bundle returns 200 instead of a 404 | c13 ×2 |

One run of mine first stacked mutations M1 to M10 by accident: a bad pathspec
aborted the revert. I restored with `git checkout -- backend/app openapi.yaml`,
confirmed a clean tree, and re-ran every mutation on its own. The table above is
from that second run.

**Tests made stale:** none found. The worker's list said none; no existing test
went red and none needed changing. No Test change request.

**Not tested, by design:** the brief's out-of-scope items (`bytes`, a 304 for an
unknown bundle with a matching `If-None-Match`, `*`, weak comparison, `Vary`).

## Test change request

**TL;DR:** 10 modify rows, no deletions, nothing weakened. Rows 1-9 are the 9 red
pins. Row 10 is the cascade that T-053 row 33, T-098 row 5 and T-093 row 7 also
needed. Paths are relative to `question-bank/`.

These pins go stale because of T-097's own files. The Constraints require
`backend/app/store.py` and/or `backend/app/routers/content.py`, `openapi.yaml`
(criterion 14) and new test files under `backend/tests/`, and every task adds its
brief and run log.

- **Rows 1 and 4 follow the T-093 / T-098 precedent.** The task's loop records join
  the allowed set and the counts stay the same. `store.py` stays counted, so the digest
  is re-pinned and still covers its new bytes. `routers/content.py` and `openapi.yaml`
  are already allowed (T-053, T-039).
- **Rows 2, 3 and 5-9 re-pin to digests that include T-097's files.** Each was
  checked to give back the old pin once those files are taken out (Verdict, "Dry run").
- **Row 2's count goes up by exactly T-097's two new test files** (116 → 118).

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester: no non-test file outside T-091's allowed set changes or appears | T-097's brief and run log are new tracked non-test files (292 ≠ 290), and `backend/app/store.py` (counted) moved, as the Constraints allow | modify | Same name. Add `tasks/T-097-bundle-etag-answer-key.md` and `runs/T-097-bundle-etag-answer-key.md` to `CRITERION_22_ALLOWED`, with a comment citing T-097 row 1. `MAIN_UNTOUCHABLE_COUNT` stays **290**. `MAIN_UNTOUCHABLE_SHA` `5e702ce3…bd91d` → `0acaca5633c674a3b96a7bf1ad8f9c327c27dc53b1f3f0a44d7c97e1997eb28b`, comment "Re-pinned by T-097 (Test change request row 1): backend/app/store.py moved". With `d7273bd`'s `store.py` the old digest returns (verified) | approved — Dkaattae, 2026-11-03 |
| 2 | same file › same describe › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091 tester: no test file is added, removed or modified outside named exceptions | T-097 adds `backend/tests/test_t097_bundle_etag_variants.py` (worker) and `backend/tests/test_t097_tester_criteria.py` (tester) (118 ≠ 116) | modify | Same name and filter. `MAIN_TESTS_COUNT` **116 → 118**. `MAIN_TESTS_SHA` `d367f38f…3c1c` → `7f7c51408963a166d9bd9dbf325d2847bd7a50894271d2a96351dfa58f951ae2`, comment "Re-pinned by T-097 (Test change request row 2): T-097 added test_t097_bundle_etag_variants.py and test_t097_tester_criteria.py (116 -> 118)". Without those two files the set equals the old pin at 116 (verified) | approved — Dkaattae, 2026-11-03 |
| 3 | same file › "T-091 criterion 20: no non-test source file moves" › "every non-test file under question-bank/src/, backend/app/, frontend/src/ is 12d242e's" | `950f334`, T-091 tester: no non-test source file under the three trees moves | `backend/app/store.py` and `backend/app/routers/content.py` moved, as the Constraints require | modify | Same name and file set. `MAIN_SOURCE_TREES_SHA` `c6cf34f6…fe9` → `3fed2394767441633ee2459496f07caa373af8c723b41cae71111b76d76f676a`, comment "Re-pinned by T-097 (Test change request row 3): backend/app/store.py and routers/content.py moved". With `d7273bd`'s two files the old digest returns (verified) | approved — Dkaattae, 2026-11-03 |
| 4 | `src/farm-animal-loose-ends-verify.test.ts` › "T-096 criteria 17-21: the bank and the boundaries" › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester: no non-test file outside T-096's allowed set changes or appears | Same as row 1 (288 ≠ 286) | modify | Same name. Add the same two T-097 paths to `CRITERION_21_ALLOWED`, with a comment citing T-097 row 4. Count stays **286**. `MAIN_UNTOUCHABLE_SHA` `7ad951c7…7d12` → `4452ec88ca61c92adf7a03de12147907e8c1cba0f193a364bd71230184c39e07`, comment "Re-pinned by T-097 (Test change request row 4): backend/app/store.py moved". With `d7273bd`'s `store.py` the old digest returns (verified) | approved — Dkaattae, 2026-11-03 |
| 5 | `src/refresh-regenerate-reminder-verify.test.ts` › "T-087 criterion 15: nothing under backend/, frontend/ or e2e/ changes" › "every tracked file under the three trees is as re-pinned by T-039, none added or removed" | `40f6c54`, T-087 tester (renamed `bcb2a38` T-039; re-pinned by T-045, T-053, T-098, T-093): every file under the three trees is pinned | `store.py` and `routers/content.py` changed and two backend test files were added | modify | Same name and file set. `MAIN_BOUNDARY_SHA` `69778f17…89bc2` → `0f3d3da8b4acbbf38fc46a8a8f5d27ade33385eb1063efa89d51681ae3a3be5e`, comment "Re-pinned by T-097 (Test change request row 5): T-097 changed backend/app/store.py and routers/content.py and added two backend test files". The digest includes both test files' bytes at `4cbe98a`, so any later edit to them goes red. With those four files at `d7273bd` the old pin holds (verified) | approved — Dkaattae, 2026-11-03 |
| 6 | `src/map-click-no-candidates-verify.test.ts` › "T-092 criterion 16: no other surface changes" › `backend/app (except [ "backend/app/content_build.py" ]) is byte-identical to T-093's` | `cf63f66`, T-092 tester (re-pinned by T-085a, T-088, T-045, T-053, T-093): `backend/app` does not move | `store.py` and `routers/content.py` moved | modify | Renamed to `… is byte-identical to T-097's` (as T-053 and T-093 renamed it). Same exception list. Digest `0da5b1a5…0b32` → `19de54aa7e38196b75ea590b370776798c0bbf9aa7e244821dbcbc0c5bccbc7c`. Add "Re-pinned at T-097 (Test change request row 6), after T-097 gave the keyed bundle its own ETag in store.py and routers/content.py" to the comment above it. Old digest returns with `d7273bd`'s files (verified) | approved — Dkaattae, 2026-11-03 |
| 7 | same file › same describe › `openapi.yaml (except []) is byte-identical to T-053's` | `cf63f66`, T-092 tester (re-pinned by T-039, T-045, T-053): `openapi.yaml` does not move | Criterion 14 requires the `getBundle` description change | modify | Renamed to `openapi.yaml (except []) is byte-identical to T-097's`. Digest `a89a88a0…a677` → `80cade8ba3241fcb2afcf7f9b62414ca4bc8355e1071693b0782a1d7d9f33f6c`. Add "Re-pinned at T-097 (Test change request row 7), after T-097 documented the per-variant ETag on getBundle" to the comment above it. Old digest returns with `d7273bd`'s `openapi.yaml` (verified) | approved — Dkaattae, 2026-11-03 |
| 8 | `src/familiarity-drawn-apart-verify.test.ts` › "T-085a criteria 23-25: negative" › "criterion 25: openapi.yaml is unchanged since ed00235 (re-pinned T-039)" | `b061fd8`, T-085a tester (re-pinned by T-039, T-045, T-053): `openapi.yaml` does not move | Same as row 7 | modify | Same name (T-045 and T-053 kept it). `BEFORE_FILE_SHA["openapi.yaml"]` `37db5438…6bae` → `ec1b1fca3504a3a95922912f97d3c1d7eeb1c2fc3888d3067b7f0521d2a06209` (the file's sha256 now), comment extended with "Re-pinned at T-097 (Test change request row 8): T-097 documents the per-variant ETag on getBundle". Criterion 23's loop over the other entries is unchanged | approved — Dkaattae, 2026-11-03 |
| 9 | `src/agriculture-true-wrong-answers-verify.test.ts` › "T-088 criteria 20-25: what must not change" › "criterion 21: openapi.yaml is byte-identical to main's" | `e9d666e`, T-088 tester (re-pinned by T-039, T-045, T-053): `openapi.yaml` does not move | Same as row 7 | modify | Same name. `MAIN_FILE_SHA["openapi.yaml"]` `37db5438…6bae` → `ec1b1fca3504a3a95922912f97d3c1d7eeb1c2fc3888d3067b7f0521d2a06209`, comment extended with "Re-pinned at T-097 (Test change request row 9): T-097 documents the per-variant ETag on getBundle" | approved — Dkaattae, 2026-11-03 |
| 10 | `src/climate-cold-trade-accepted-verify.test.ts` › "T-091 criterion 22: the diff touches only the allowed files" › "each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | `bac230d`, T-091 tester: the files in its request hold exactly their approved re-pins | Green today. Rows 4, 6-7, 8 and 9 change `farm-animal-loose-ends-verify.test.ts`, `map-click-no-candidates-verify.test.ts`, `familiarity-drawn-apart-verify.test.ts` and `agriculture-true-wrong-answers-verify.test.ts`, whose digests are pinned in `APPLIED_REQUEST_FILE_SHAS` | modify (only for the files whose rows are approved) | Same name. Re-pin those entries of `APPLIED_REQUEST_FILE_SHAS` to each file's sha256 **after** its rows are applied with their comments, and extend each entry's comment with ", then by T-097 (row 10)". `MAIN_REQUEST_FILE_SHAS`, `seed-level-loose-ends-verify.test.ts` and `test_t089_tester_criteria.py` stay as they are. (The dry run's values, without the new comments, were `3e615385…`, `dbcf5e17…`, `8c094c4b…`, `084d830f…`. The real ones differ by the comments, so recompute them) | approved — Dkaattae, 2026-11-03 |

**To approve:** start the `tester` step for T-097 in a session you are attending,
and approve or refuse each row there. That tester applies the approved rows as
`T-097 tester: apply approved test change request`, re-runs **all** the suites
(backend, question-bank, frontend), and writes the final verdict. If you would
rather amend criterion 16 and the Constraints first, refuse the rows and send the
brief to `task-expander`.

## Notes

- **Decided: change only the keyed tag.** The unkeyed tag stays byte-for-byte what
  it was. Clients and caches holding the default variant keep revalidating, and
  `GET /bundles` needed no change for criterion 9. Reviewer to confirm or overturn.
- **Decided: the router, not `store.bundle`, sets the body's `etag`.** `store.bundle`
  has no variant: it returns the keyed payload, and the router strips the key. So the
  router overwrites `etag` at the same point it strips the key. Reviewer to confirm.
- **Noticed:** `mypy app` reports 39 import-not-found errors. That count is the same
  with and without this change: the global mypy cannot see the venv's packages, and
  mypy is not part of `make check`. Nothing to do here.

## Review

**TL;DR: changes requested, sent back to `tester`.** The code is good and I would
approve it as written. But CI on PR #120 is red: the question-bank job fails 9
pre-existing whole-tree pins that this task's diff trips. The tester's verdict
ran only `make -C backend check`, so it never saw them. Needs a fresh `tester`
to raise a Test change request, then a person to approve it (the orchestrator
never stamps that request, D-14). Nothing swept; the PR stays draft.

**Checked first**

- **PR #120 is open and draft**, not merged.
- **Every role's work is in it.** Sessions rows: expander, worker, tester. Commits:
  `6d17d6a`/`d89e6c7` expander, `8f825a9` worker, `1f48f9f` tester, plus orchestrator
  run-log commits. None stranded.
- **Lanes held.** The expander's commits touch only `tasks/` and `tasks.md`; the
  tester's touch only `backend/tests/test_t097_tester_criteria.py` and the brief;
  no `ci-fix` ran.

### Findings

1. **Blocks: CI is red, 9 question-bank pins fail** (run 41705776703, job
   "question-bank (typecheck, lint, test)", step Test: 2704 pass, 9 fail). Every
   other job is green. They are the same recurring pins T-039, T-045, T-053, T-087,
   T-093 and T-098 each tripped and re-pinned (`PROGRESS.md`):
   - `question-bank/src/climate-cold-trade-accepted-verify.test.ts`: T-091 criterion 20
     (source-tree pin, `backend/app/`), criterion 22 ×2 (whole-repo non-test pin and
     pre-existing-test pin, from the brief, run log, `openapi.yaml`, the new tests)
   - T-096 criterion 21 (whole-repo pin)
   - T-092 criterion 16 ×2 (`backend/app` byte-identical to T-093's; `openapi.yaml`
     byte-identical to T-053's)
   - T-087 criterion 15 (every tracked file under `backend/`, `frontend/`, `e2e/`)
   - T-085a criterion 25 (`openapi.yaml` unchanged since ed00235)
   - T-088 criterion 21 (`openapi.yaml` byte-identical to main's)

   `grep -rn "<test name>" question-bank/src/` finds each file. **What makes it
   acceptable:** a fresh `tester` writes a `## Test change request` with one modify
   row per pin (re-pin to this branch's tree, asserting nothing less), sets
   `Test changes: requested`, `Next step: human`; a person approves it; an attended
   tester applies it and re-runs **the whole repo's suites, not only the backend**,
   and the CI run on the PR goes green. Note for the approver: the brief's
   Constraints say "anything in `question-bank/`" must not change, and criterion 16
   says no pre-existing test is modified. Re-pinning contradicts both in letter, as
   it did for T-053, T-093 and T-098; the approver decides whether to amend them
   (then `task-expander`) or accept it in substance as before.

2. **Does not block: the tester's verdict claimed "whole suite" from the backend
   suite alone.** Criterion 16 names only `make -C backend check`, so the verdict
   is true in letter, but the envelope needs the whole of CI. This is the loop gap,
   not this tester's alone: briefs that touch `backend/` name only the backend
   suite. **Not ticketed:** `process-tasks.md` is pinned by T-091's criterion 22, the
   same reason the T-087, T-039 and T-098 reviewers gave. It goes in the reviewer's
   sweep note once the pins are re-pinned, or a person adds it by hand.

3. **Does not block: two test files for one task.** `test_t097_bundle_etag_variants.py`
   (worker, 9 tests) overlaps `test_t097_tester_criteria.py` (tester, 27 tests)
   almost entirely. Kept: earlier tasks leave both, and the worker's file is small.
   No task.

### The code, judged

- **Fits.** `bundle_etag` keeps its shape with a keyword-only flag defaulting to the
  old behaviour; the router uses the variant's tag at the 304 check, the header and
  the body. Six lines of source, nothing speculative.
- **Inside Constraints:** `store.py`, `routers/content.py`, `openapi.yaml`, new tests,
  plus `tasks.md` (T-099, T-100 queued from the Out of scope list, as the brief
  invited). No dependency, no migration, no child-facing text.
- **Docs true.** The `getBundle` description matches the behaviour, including the
  body `etag` and the list's unkeyed tag.

### The worker's flags, disposed

- **"Change only the keyed tag": confirmed.** Leaving the unkeyed tag byte-for-byte as
  it was keeps every cached default copy valid and needs no change to `GET /bundles`.
- **"The router, not `store.bundle`, sets the body's `etag`": confirmed.** `store.bundle`
  has no variant, and the router is where the key is stripped. The cost is that
  `store.bundle(...)["etag"]` is the unkeyed tag only. Its one other caller,
  `list_bundles`, wants exactly that.
- **"`contentVersion` with a `"` breaks criterion 10": no action.** It was true
  before this task and the version is generated, not typed.

### When it comes back

The reviewer re-reviews only the re-pin diff, then sweeps and **escalates** (not a
silent ready): `openapi.yaml` changed (criterion 14), and the brief carries the
orchestrator's unattended `Approved:` stamp, so the two product choices in "For
the approver" (criteria 8 and 9) were never seen by a person.

