# Test guidelines

How to write tests in this repo. The rules in [`CLAUDE.md`](CLAUDE.md) say *that*
you write tests; this says *what* and *how*.

Tests here have a specific job. Under the loop in [`process.md`](process.md) they
are written from a task's **acceptance criteria**, by someone who has not seen the
implementation — a separate session, checked against the brief's Sessions table. A test is the executable form of "we agreed this is what
done means" — not a description of what the code happens to do.

## What to test

**Test the behaviour you would be upset to get silently wrong.** In a quiz for
children, that is data correctness above almost everything else. A crash is
loud and gets fixed. A question whose distractors give away the answer, or a
rank computed over the wrong set, ships and teaches the wrong thing.

Worth a test:

- **Anything computed across a set** — ranks, mastery, level drift, streaks. The
  bug is never "it threw", it is "it used the wrong denominator".
- **Join keys.** A FIPS code that stops matching the map breaks every question
  about that state, and nothing errors.
- **Question quality invariants.** Distractors come from the same region; the
  correct answer is not systematically longest or first; a template never emits a
  question for an entity missing its required fields.
- **Anything the plan calls out as a trap** — contested rankings, unreviewed
  text reaching shippable fields, peak-vs-sustained level.
- **Every bug you fix.** Write the test that fails first, then fix it. A bug
  without a test comes back.

Not worth a test:

- Types the compiler already guarantees.
- Thin wrappers with no logic — a getter that returns a field.
- Third-party behaviour. Test that you call it correctly, not that it works.
- Exact copy. Asserting on a fun fact's wording makes the test fail when a human
  improves the prose, which trains people to ignore tests.

## Start below the transport, not at it

The first real test suite here needed **no seam at all**. Every behaviour worth
testing in `question-bank` sits downstream of the network: `parseUsStates` turns a
recorded response into rows, and `normalizeUsStates` turns rows into entities.
Both are pure functions, and calling them directly is simpler than injecting
anything.

```ts
function allRows(): WikidataStateRow[] {
  return parseUsStates(JSON.parse(readFileSync(FIXTURE, "utf8")) as SparqlResults);
}

const { entities } = normalizeUsStates(allRows(), { only: ["CO"] });
```

Reach for a seam only when the thing under test genuinely spans the network call.
Three exist for that:

| Seam | Lets you test | Where |
|---|---|---|
| `SparqlTransport` | the whole build without Wikidata | `question-bank/src/sparql.ts` |
| `SummaryTransport` | the fun-fact pass without Wikipedia | `question-bank/src/sources/wikipedia.ts` |
| `EntitySink` | build output without a database or filesystem | `question-bank/src/types.ts` |

None is used by any test today. That is the right outcome, not a gap — a seam you
inject to test a pure function is ceremony.

**Do not mock `fetch`.** A test that stubs `fetch` asserts on the shape of an
HTTP call, which is the thing least likely to break and most likely to change.
Inject a transport instead — it is one function.

**No network in tests, ever.** Not "usually offline"; never. A test that reaches
Wikidata fails when Wikidata is slow, when a value is edited, and in CI. CI
enforces this rather than assuming it: the `Test` step of the `frontend`,
`question-bank` and `backend` jobs, and the `Test against Postgres` step of
`backend-postgres`, run with `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` and their
lowercase forms pointed at `http://127.0.0.1:1` — loopback, on a port nothing
binds — so any outbound request fails closed instead of reaching the network
(`.github/workflows/ci.yml`). Reproduce it locally for one suite:

```sh
HTTP_PROXY=http://127.0.0.1:1 HTTPS_PROXY=http://127.0.0.1:1 ALL_PROXY=http://127.0.0.1:1 \
  http_proxy=http://127.0.0.1:1 https_proxy=http://127.0.0.1:1 all_proxy=http://127.0.0.1:1 \
  uv run pytest    # from backend/ — bun test from frontend/ or question-bank/ works the same way
```

The suite should not notice.

## Three patterns worth copying

All three come from `question-bank/src/normalize.test.ts`.

**Re-read the fixture per call.** Returning a fresh parse means no test can
mutate another's data, and there is no shared setup to reason about.

```ts
function allRows(): WikidataStateRow[] {
  return parseUsStates(JSON.parse(readFileSync(FIXTURE, "utf8")) as SparqlResults);
}
const rowsFor = (name: string) => allRows().filter((row) => row.name === name);
```

**Filter parsed rows to build partial cases.** The recording stays whole; the
test narrows it. `allRows().slice(0, 49)` produces the 49-state case that proves
ranks are suppressed, and `rowsFor("Colorado")` isolates one state so border
resolution has to fall back from QIDs to labels.

**Copy a row with one field corrupted to force a warning path.** Spreading rather
than editing keeps the fixture honest and the intent obvious:

```ts
const withWrongFips = (rows: WikidataStateRow[]) =>
  rows.map((row) => (row.name === "Colorado" ? { ...row, fips: "99" } : row));
```

## Fixtures are recordings, not inventions

`question-bank/src/fixtures/us-states.sparql.json` is a real captured response
from `query.wikidata.org`, and its `_fixture` block says when it was captured and
how to regenerate it. Keep that property.

- To add a fixture, **capture it** from the real source and record the date.
- If you must hand-write one — because the real source is unreachable — say so
  in the file, in the same way, and treat everything derived from it as
  provisional.
- Never quietly edit a recording to make a test pass. That converts a test into
  a tautology and loses the only evidence of what the source actually returns.

Trim a fixture to the rows you need only if the trimming does not change meaning.
The 50-row capture stays whole because rank tests need the full field.

## Randomness and time

Question selection is the one random thing in the app. It lives in
`backend/app/selection.py` — `pick_question()`, ported from the client's old
`pickQuestion()` — and its tests are `backend/tests/test_selection.py`.

`pick_question()` draws with `random.choice`. Do not assert which question comes
back. Assert the properties that must hold for **every** possible result:

```python
# Good: true for any draw
question, is_review = pick_question(BANK, level=6.0, topic="capital")
assert question["id"] in NEAR_SIX
assert question["topic"] == "capital"
assert question["id"] not in asked_ids
```

Run a selection many times and assert the invariant across all draws when you
need confidence about a distribution. If a behaviour genuinely needs determinism,
inject the randomness rather than seeding a global — `pick_question` takes an
`rng`, which is what that looks like.

Same for clocks: pass timestamps in rather than reading `Date.now()` inside the
logic under test. `built_at` is generated data, not asserted data.

## Writing tests from acceptance criteria

When you are the test session (`process.md` step 4), you have the task file and
the repo, and you did not do the work.

- **Every criterion gets at least one test**, named so the mapping is obvious:
  `normalizeUsStates suppresses ranks when fewer than 50 states are present`.
- **Derive expected values from the criterion, not from the code.** Read the
  implementation to find entry points and signatures. Do not read it to decide
  what the answer should be — that is how a bug gets ratified.
- **Test the boundary the criterion names.** "Fewer than 50" means 49 and 50, not
  1 and 50.
- **If a criterion cannot be tested as written, say so and stop.** Report which
  criterion and why. Do not invent an interpretation, and do not write a test
  that passes trivially — a green tautology is worse than an admitted gap,
  because it looks like coverage.

## Verifying a task whose deliverable is tests

Some tasks produce tests rather than behaviour. Writing tests to check those
tests is circular, so the check is different in kind:

1. **Coverage** — does a test exist for every behaviour the criteria name?
2. **Mutation** — break each behaviour deliberately and confirm the matching test
   fails. Invert the rank-suppression condition; corrupt a FIPS code in the
   curated table; delete the label-fallback branch in border resolution. Each
   should turn exactly one test red. **Revert every mutation afterwards.**
3. **Honesty** — no network, no fixture edited to make something pass, no
   assertion that would hold for any input at all.

Mutation is the only reliable way to distinguish a real test from a green
tautology, and it is worth doing by hand long before anyone installs a mutation
testing tool. Report which mutations were made and what each one did.

## Anti-patterns

- **Tautologies.** `expect(result).toBeDefined()` on a function that always
  returns an object. Assert the value that matters.
- **Snapshotting everything.** A snapshot of a whole entity fails on every
  legitimate Wikidata refresh and teaches people to press `-u`. Snapshot narrow,
  stable shapes if at all.
- **Testing implementation details.** Assert what `normalizeUsStates` returns,
  not that it called `rankBy` twice. The second breaks on every refactor.
- **One test, twelve assertions.** When it fails you learn one thing instead of
  twelve. Split by behaviour.
- **Tests that depend on each other's order.** Each test sets up what it needs.

## Per-area specifics

### `question-bank/` and `frontend/` — `bun test`

```bash
cd question-bank && bun test    # 19 tests today
cd frontend      && bun test    # 65 tests today
```

Tests live next to what they test: `src/normalize.test.ts` beside
`src/normalize.ts`. Pure functions are the highest value per line of test and
need no setup at all.

Test files are **typechecked**, not excluded — `@types/bun` is a devDependency
of both packages and both tsconfigs carry `"types": ["bun"]`, so `bun run
typecheck` reads `*.test.ts` like any other source file (`engineering-decisions.md` E-2).
CI also **requires** them: neither `bun test` step passes a package with no test
files (E-3).

### `api/` — pytest

> **Forward-looking.** `api/` does not exist yet (plan §5, tasks T-030 onward).
> Nothing below has been exercised; treat it as the intended shape and correct it
> against the first real endpoint tests.

```bash
cd api && uv run pytest
```

- Endpoint tests go through the app with `httpx.AsyncClient`, not by calling the
  handler function — routing, validation and serialisation are part of the
  behaviour the contract promises.
- **Assert against `openapi.yaml`.** It is the contract; a response that does not
  match it is a bug even when the test author expected it.
- Database tests run in a transaction that rolls back per test. A test that
  leaves rows behind makes the next one flaky.
- Use a real Postgres, not SQLite. The point is to test what runs in production.

## Before you say it passes

```bash
bun test && bun run typecheck     # per TS package
uv run pytest && uv run ruff check # api
```

The **whole** suite, not just the new tests. A change that fixes its own task and
breaks a neighbouring one has not passed.
