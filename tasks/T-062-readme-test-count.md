# T-062 — One test count in `README.md` is still unasserted

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** Dkaattae, 2026-09-18
**From:** [`tasks.md`](../tasks.md) T-062 · `S`, light brief (`process.md`, D-6)
**Branch:** `claude/happy-shannon-dstj7a` — assigned to the expander's session by
the harness, so it is the task branch (`process.md`, "When the environment names
the branch for you"). Every later role pushes here, whatever branch its own
session starts on; `CLAUDE.md` "Branches" carries the standing permission.
**PR:** #50, draft, built from the branch above
**Fault:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-18 | 01YP7QezsJVN7pxQyV1scM6g |
| worker | 2026-09-18 | cse_01YP7QezsJVN7pxQyV1scM6g |
| tester | 2026-09-18 | cse_01YP7QezsJVN7pxQyV1scM6g (shared id — see Verdict) |

## Acceptance criteria

*Survey, as of `eea566a`. `README.md:193` reads "The nine Postgres-only tests
skip on SQLite, so nobody needs a database installed to run `make -C backend
check`." — the queue entry cites `:192`, which is the `GEO_TEST_DATABASE_URL`
line; the sentence has drifted one line down. It is the **only** count of tests,
suites, journeys, checks or cases anywhere in `README.md`. It is true today:
`backend/tests/test_postgres.py` defines exactly 9 `test_` functions. The
existing guard, `frontend/src/conventions-doc.test.ts:554-558` ("no digit count
of tests appears in the Checks code block"), does not reach it on two counts —
it looks only inside the fenced block, and only for digits.*

1. **No count of tests in `README.md` survives unpinned.** It is not possible for
   `backend/tests/test_postgres.py` to change size while `README.md` states a
   number that no longer matches it *and* every suite stays green. Boundary, both
   sides: with that file at its current **9** `test_` functions the whole suite is
   green and `README.md` reads true; add a **10th** and either `README.md` is
   still true as written or a test in `frontend/`'s `bun test` goes red. Either
   route to this — dropping the number, or asserting it — satisfies the criterion;
   the queue entry's reasoning favours dropping it, and that reasoning is not
   binding.

2. **The guard reaches the whole file and words as well as digits.** A sentence
   of the form *"The eleven Postgres-only tests skip on SQLite"* placed anywhere
   in `README.md` — inside the `## Checks` prose, in a different section, outside
   any fenced code block — turns a test in `frontend/`'s `bun test` red. So does
   the same sentence written *"The 11 Postgres-only tests"*. Nine spelled as a
   word in a sentence that is not about a count of tests (there are none today,
   but e.g. "nine states") does not.

3. **The reason a reader needs that sentence survives.** `README.md`'s `##
   Checks` section still states, in prose, both halves of what line 193 carries
   today: that the Postgres-only tests **skip when the database is SQLite**, and
   that **therefore no database server has to be installed** to run `make -C
   backend check`. The literal string `make -C backend check` stays in that
   section, and the `GEO_TEST_DATABASE_URL` override sentence above it
   (`README.md:191-192`) is left intact.

4. **Confined, and green.** The diff touches `README.md` and test files only —
   nothing under `backend/`, `question-bank/`, `e2e/`, or `frontend/src/` that is
   not a test file, and **not** `test-guidelines.md:209` or `PROGRESS.md:161`,
   whose stale counts belong to T-065. No dependency is added to any package. No
   test reaches the network (local file reads only — `test-guidelines.md`, "No
   network in tests, ever"). `cd frontend && bun test && bun run typecheck && bun
   run lint` passes, including every pre-existing assertion in
   `frontend/src/conventions-doc.test.ts`.

## Handoff

**Route taken: dropped the number** (the favoured route), plus generalised the
existing drift guard so the class of bug can't come back through a different
sentence. Diff is two files: `README.md` and
`frontend/src/conventions-doc.test.ts`.

**Files changed**

- `README.md:193` — `"The nine Postgres-only tests skip on SQLite, …"` →
  `"The Postgres-only tests skip on SQLite, …"`. Only the number is gone; the
  rest of the sentence, and `:191-192`'s `GEO_TEST_DATABASE_URL` override
  sentence above it, are untouched.
- `frontend/src/conventions-doc.test.ts:554-569` (was `:554-558`) — replaced
  the T-058 #8 guard (`no digit count of tests appears in the Checks code
  block`, scoped to the fenced block, digits only) with one that scans the
  *whole* `readmeDoc` string for a number — digit or spelled-out one through
  fifteen — followed within three words by `test`/`tests`. Kept the T-058 #8
  reference in the describe title since it's the same guard, extended, not a
  new one; added T-062.

**Why this shape, not a plain digit-count assertion pinned to 9:** criterion 1
allows either dropping the number or asserting it; the brief's own reasoning
(and the queue entry) favours dropping it, and dropping it is strictly safer —
it can't itself go stale. But criterion 2 is written as a general property
("a sentence of this *form*, placed *anywhere*"), not "keep this one sentence
truthful", so a guard limited to today's specific sentence at line 193 would
satisfy criterion 1 but not 2. The regex is the T-058 #8 guard generalised:
whole-file, and either numeral form, with a "how many words can sit between
the number and the word 'test(s)'" cap of 3 so it doesn't fire on unrelated
numbers-near-the-word-test coincidences.

**Regex correctness, checked before landing it** (see criterion-2 boundary
cases and the "nine states" negative case):
- `"The eleven Postgres-only tests skip on SQLite"` → matches.
- `"The 11 Postgres-only tests"` → matches.
- `"there are nine states"` → no match (no `test`/`tests` within 3 words).
- Ran the pattern against the *current* `README.md` post-edit: `null` (no
  match anywhere in the file). Checked every digit (`grep -n '[0-9]'
  README.md`) and every number-word (`one`…`fifteen`) occurrence in the file
  by hand first — e.g. `"15 states, 26 questions"`, `"CI runs all six jobs"`,
  `"One URL chooses; … the same test suite"` — none is a false positive
  because either no `test`/`tests` follows within 3 words, or (for `"CI runs
  all six jobs"`) it isn't `test` at all.
- Ran it against the *pre-edit* `README.md` (via `git stash`) to confirm it
  *does* flag the original line 193: matched `"nine Postgres-only tests"`.

**Criterion by criterion**

| # | Criterion | Where it lives now |
|---|---|---|
| 1 | No count of tests in README survives unpinned | `README.md:193` states no number; nothing to go stale. `backend/tests/test_postgres.py` confirmed still exactly 9 `test_` functions (unchanged by this task; not the thing being fixed). |
| 2 | Guard reaches whole file, digits and words | `conventions-doc.test.ts`'s new `testCountPattern`, run against `readmeDoc` (the full file, not `codeBlock(readmeSection(...))`) |
| 3 | Sentence's content survives | `README.md:191-194` — SQLite-skip reason, `make -C backend check` literal string, and the `GEO_TEST_DATABASE_URL` override line above it, all intact |
| 4 | Confined, and green | See below |

**Confinement:** `git diff --stat` shows exactly `README.md` and
`frontend/src/conventions-doc.test.ts` — nothing under `backend/`,
`question-bank/`, `e2e/`, or non-test `frontend/src/`; `test-guidelines.md:209`
and `PROGRESS.md:161` untouched (left for T-065). No dependency added
(`frontend/package.json`, `bun.lock` untouched). No network in the new test —
it's a `readFileSync` + regex, same pattern as every other test in that file.

**Test/lint/typecheck results — one thing worth flagging:**

- `cd frontend && bun test` — **184 pass, 0 fail** (78 of those in
  `conventions-doc.test.ts`, all pre-existing ones plus the new one green).
- `cd frontend && bun run lint` — **exit 0**, no output (clean).
- `cd frontend && bun run typecheck` — **fails**, but not because of anything
  in this diff: `src/components/UsMap.tsx` (untouched, last touched by an
  unrelated formatting commit) can't resolve `react-simple-maps` and
  `us-atlas/states-10m.json`. This session's sandbox had **no `node_modules/`
  at all** at the start; `bun install` partially succeeds but the proxy's
  private registry mirror (`europe-west1-npm.pkg.dev`) returns 403 for the
  whole d3/react-simple-maps/us-atlas family specifically (confirmed via
  `curl "$HTTPS_PROXY/__agentproxy/status"` — `recentRelayFailures` shows
  `connect_rejected … gateway answered 403 … policy denial`), while
  `registry.npmjs.org` is in the proxy's allowlist and unaffected. `@eslint/js`
  and everything `bun test`/`bun run lint` need happened to already be in the
  local bun cache (`~/.bun/install/cache`), which is why those two came up
  green once `bun install` ran — but the map libraries aren't cached and the
  gateway blocks fetching them fresh. I did **not** touch `UsMap.tsx`, add a
  type stub, or touch any config to work around it — that would be outside
  README.md/test files, and a workaround for a network-policy gap isn't this
  task's call to make. Confirmed with `git stash` that this exact
  `typecheck` failure is present on the unmodified tree too, so it predates
  and is independent of this change.
- I could not get a clean `bun run typecheck` in this sandbox because of that
  registry gap, not because of anything in this brief's diff. **Flag for the
  tester:** if your session's sandbox has full `node_modules/` (or network
  access to `europe-west1-npm.pkg.dev`) already, `bun run typecheck` should be
  clean — my diff touches no `.ts`/`.tsx` file that `tsc` would otherwise
  complain about. If it reproduces the same `UsMap.tsx` failure, that's the
  environment, not this task; if it's something else, that's a real fail and
  should come back to worker.

**What I deliberately did not do:**
- Did not touch `test-guidelines.md:209` or `PROGRESS.md:161` — explicitly
  T-065's, per criterion 4.
- Did not pin the assertion to the literal number 9 anywhere — that would
  satisfy criterion 1 alone but not criterion 2's "whole file, digit or word"
  requirement, and would reintroduce exactly the kind of number the brief is
  trying to get rid of.
- Did not run `bun install` to fix the map-package resolution failure beyond
  what's needed for `lint`/`test` to work — that's outside this task's scope
  and outside my authority to route around a registry policy.

## Verdict

**Pass.** All four criteria hold. The worker's guard genuinely fires: three
criterion-2 mutations of `README.md` each turned it red, the negative control
("nine states") left it green, and every mutation was reverted. New tests in
`frontend/src/readme-test-count.criteria.test.ts` (16, all green). Two things
the reviewer should read before merging — neither is a T-062 defect, both are
pre-existing and reproduced on the unmodified tree.

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | No count of tests in `README.md` survives unpinned | pass | Number dropped from `:193`. Added a 10th `test_` function to `backend/tests/test_postgres.py` — `README.md` still true, `frontend` suite still 184 pass / 0 fail. Reverted. |
| 2 | Guard reaches the whole file, words as well as digits | pass | 3 mutations red, 1 negative control green (table below) |
| 3 | The reason a reader needs that sentence survives | pass | 5 new assertions, each mutation-checked |
| 4 | Confined, and green | pass, with two caveats | `git diff --name-only origin/main...HEAD` = `README.md`, `frontend/src/conventions-doc.test.ts`, this brief. `frontend`: `bun test` 200 pass / 0 fail, `bun run lint` clean. `bun run typecheck` red — environmental, see below. |

### Session independence

**Not established by session id.** `$CLAUDE_CODE_REMOTE_SESSION_ID` is
`cse_01YP7QezsJVN7pxQyV1scM6g`, identical to the `worker` row above and to the
`task-expander`'s. There is no `runs/T-062-*.md`, so this is not the
orchestrated case the tester's agent definition carves out either — the id
check simply did not separate anything here.

What independence there is rests on this being a freshly spawned agent with its
own context window: no sight of the worker's conversation or reasoning, only
the committed brief and repo. That is real but **weaker than a separate
session**, because it rests on the harness having spawned the role correctly
rather than on anything checkable from inside. Weigh this `pass` accordingly.

### Criterion 2 — mutations of `README.md`, against the worker's guard

Run as `bun test src/conventions-doc.test.ts` before any test of mine existed,
so each red is attributable to `conventions-doc.test.ts:554-573` alone.

| Mutation | Placement | Result |
|---|---|---|
| `The eleven Postgres-only tests skip on SQLite` | `## Checks` prose, outside the fence | **red** (77 pass / 1 fail) |
| `The 11 Postgres-only tests skip on SQLite` | `## Checks` prose, outside the fence | **red** (77 pass / 1 fail) |
| `The eleven Postgres-only tests skip on SQLite.` | under `## Layout`, a different section | **red** (77 pass / 1 fail) |
| `The quiz covers nine states today.` | under `## Layout` | **green** (78 pass / 0 fail) — correct, not a count of tests |

All four reverted; `git status` clean afterwards.

### Criterion 1 — the boundary, both sides

- **At 9** `test_` functions in `backend/tests/test_postgres.py` (today):
  `frontend` suite green, `README.md` reads true.
- **At 10** (a 10th function appended, then reverted): `frontend` suite still
  green — 184 pass / 0 fail — and `README.md` is *still true as written*,
  because it states no number. That is the first arm of the criterion's
  disjunction, so the criterion holds. Drift is now impossible by
  construction rather than by assertion.

### New tests, and the mutations that prove they can fail

`frontend/src/readme-test-count.criteria.test.ts`, 16 tests. Expected values
come from the criteria and from `backend/tests/test_postgres.py`, not from
`README.md` or from the worker's guard — both are the things under test. The
detector is a second, independently written implementation (tokenising, not
phrase-matching), so it can disagree with the guard it sits beside.

| Mutation | Tests turned red |
|---|---|
| `README.md` says `nine Postgres-only tests` (count *correct*) | criterion 1 "states no count at all" — and correctly **not** "every claim matches", since 9 is the true count |
| `README.md` says `eleven Postgres-only tests` (count wrong) | both criterion 1 tests |
| Delete the skip-on-SQLite / no-database sentence | both criterion 3 prose tests |
| `make -C backend check` → `make -C backend everything` | criterion 3 literal-string test |
| Delete the `GEO_TEST_DATABASE_URL` override sentence | criterion 3 override-intact test |
| Remove the `only_postgres` skip from `backend/tests/test_postgres.py` | criterion 3 "the claim README makes is true" test |

Every mutation reverted; working tree clean. No network in any test — local
`readFileSync` only.

### Caveat 1 — `bun run typecheck` is red in this sandbox, and was before the diff

```
src/components/UsMap.tsx(2,55): error TS2307: Cannot find module 'react-simple-maps'…
src/components/UsMap.tsx(3,24): error TS2307: Cannot find module 'us-atlas/states-10m.json'…
src/components/UsMap.tsx(36,15): error TS7031 / (37,30): error TS7006
```

Reproduced independently of the worker's report, and **not taken on faith**:

- **Same four errors on the unmodified tree.** `git checkout eea566a -- README.md frontend/src/conventions-doc.test.ts`, re-ran `tsc` — byte-identical output. Restored.
- **Cause is a missing install, not the diff.** `react-simple-maps@^3.0.0`, `us-atlas@^3.0.1` and `@types/react-simple-maps@^3.0.6` are declared in `frontend/package.json` but absent from `node_modules/`. `bun install` fails with `403` from the sandbox's npm mirror (`europe-west1-npm.pkg.dev/…/sandbox-npm-cache`) for exactly the `react-simple-maps` / `us-atlas` / `d3-*` / `topojson-client` family and nothing else.
- **`UsMap.tsx` is not in the diff** and was last touched by `6954657`, a formatting commit predating this branch.

Judgment: **pre-existing and environmental, not a regression.** No workaround
was applied — adding a stub or touching config would breach criterion 4.
`conventions-doc.test.ts` and the new test file draw no `tsc` error of their
own. **Reviewer:** confirm the `frontend` job on PR #50 is green before
merging; CI has a working registry and is the only place a clean `typecheck`
can be observed.

### Caveat 2 — `question-bank`'s suite is red, and was already red on `main`

`cd question-bank && bun test` → 1253 pass / 2 fail. Both failures are the
frozen T-014 "nothing outside my package moved" guards:

- **`climate-kid-verify.test.ts`** — red on `origin/main` (`eea566a`) itself, verified in a detached worktree: 1254 pass / **1 fail** with no T-062 change present at all.
- **`climate-kid.test.ts`** — diffs `origin/main...HEAD` and flags `frontend/src/conventions-doc.test.ts`. It goes red for *any* branch touching `frontend/`, including one whose criterion 4 expressly permits touching test files.

Not a T-062 defect: the guard asserts something about T-014, it is documented in
its own header as a defect owned by **T-070**, and it is vacuous in CI
(`.github/workflows/ci.yml` uses `actions/checkout@v5` with no `fetch-depth`, so
`origin/main` is not a ref and the diff comes back empty). Criterion 4 scopes
"green" to the `frontend` command, which passes. Recorded here so the reviewer
does not read it as new.

### What was checked but needed no test

- **Confinement** — `git diff --name-only origin/main...HEAD` is exactly `README.md`, `frontend/src/conventions-doc.test.ts` and this brief. Nothing under `backend/`, `question-bank/`, `e2e/`; no non-test file under `frontend/src/`; `test-guidelines.md` and `PROGRESS.md` untouched, left to T-065.
- **No dependency added** — `frontend/package.json` and `bun.lock` are not in the diff.
- **The surviving prose is true** — `backend/tests/test_postgres.py`'s autouse `only_postgres` fixture calls `pytest.skip` when `engine.dialect.name != "postgresql"`, so "skip on SQLite, so nobody needs a database installed" is accurate, not merely present. Asserted, not just eyeballed.
