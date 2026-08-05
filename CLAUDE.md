# CLAUDE.md

Working rules for this repo. A kids' geography quiz: React frontend, FastAPI
backend, Postgres, and a build-time data pipeline.

## Layout

```
frontend/        React 19 + TanStack Start app (TypeScript, bun)
question-bank/   Wikidata → entity JSON pipeline (TypeScript, bun)
api/             FastAPI backend (Python, uv) — not built yet
tasks/           brief for the task in flight; empty when nothing is
openapi.yaml     the contract between frontend and backend
```

## Documentation

These files carry the project's state and process. Read them before starting
work, and update them as part of finishing it. [`process.md`](process.md) is the
one to read first — it says how the others fit together.

| File | What it is | When to touch it |
|---|---|---|
| [`geoquizdataplan.md`](geoquizdataplan.md) | The plan. Why the app works the way it does — question generation, difficulty, maps, session flow, and the tech stack (§5) | Rarely. It is the reference, not a scratchpad |
| [`tasks.md`](tasks.md) | The work queue: small, independent, ordered tasks | Every task. Mark done, add what you discover |
| [`tasks/`](tasks/) | The brief for the task in flight — goal, acceptance criteria, out of scope, constraints | Created when a task starts, deleted when its PR merges |
| [`process.md`](process.md) | How to actually run the loop — pick, expand, work, verify in a fresh session, ship, sweep | Read first. Change only when the process changes |
| [`PROGRESS.md`](PROGRESS.md) | What is done, what is known-broken, what is next at a coarser grain | When a group of tasks lands |
| [`test-guidelines.md`](test-guidelines.md) | What to test and how — seams, fixtures, writing tests from acceptance criteria | When a testing practice changes |

`openapi.yaml` is the API contract. Change it deliberately and say so — the
frontend and backend both read it as truth.

## Packages

**Ask before adding a dependency.** Every one is a thing to update, audit and
explain. Prefer the standard library, then something already in the lockfile,
then a new package — and when a new package really is the answer, say what it
does and what the alternative was before adding it.

| Where | Add | Run | Never |
|---|---|---|---|
| `api/` (Python) | `uv add <pkg>` | `uv run <cmd>` | `pip install`, `poetry`, a bare `venv` |
| `frontend/`, `question-bank/` (TS) | `bun add <pkg>` | `bun run <script>` | `npm`, `yarn`, `pnpm` |

Dev-only tools go in the dev group: `uv add --dev pytest`, `bun add -d <pkg>`.
Commit the lockfile in the same change as the dependency.

## Tests

[`test-guidelines.md`](test-guidelines.md) is the detail. The short version:

**Write tests for behaviour you would be upset to break.** Not every function —
the ones where being wrong is expensive or silent. In this project that means
data correctness above all: a rank computed over the wrong set, a FIPS code that
stops matching the map, a question whose distractors give the answer away.

- Run tests before saying something is done. "It typechecks" is not "it works".
- A bug fix gets a test that fails without the fix. Otherwise it comes back.
- Test the seams the code already has — `SparqlTransport` and `SummaryTransport`
  exist so the pipeline can be tested without a network, and `EntitySink` so it
  can be tested without a database. Use them rather than mocking `fetch`.
- Fixtures are recordings, not inventions. `question-bank/src/fixtures/` holds a
  real captured Wikidata response. If you need a new one, capture it and say when.
- No network in tests.

```bash
cd question-bank && bun test        # no tests yet — T-001 adds them
cd frontend      && bun test
cd api           && uv run pytest
```

## Commands

```bash
# frontend
cd frontend && bun install && bun run dev
cd frontend && bun run lint && bun run format

# question bank
cd question-bank && bun install
bun run build              # live: query.wikidata.org → data/us-states/
bun run build:sample       # offline replay of the recorded fixture
bun run typecheck

# api (once it exists)
cd api && uv sync && uv run fastapi dev
cd api && uv run alembic upgrade head
```

## Conventions

- **TypeScript is strict**, including `exactOptionalPropertyTypes`. Optional
  fields are declared `field?: T | undefined`.
- **Format before committing**: `bun run format` in `frontend/`, prettier with
  the same settings in `question-bank/`, `ruff format` in `api/`.
- **Alembic owns the database schema.** The pipeline emits JSON and a loader
  writes it; nothing else creates tables (see plan §5.3).
- **Join on codes, never on names.** FIPS for US states, ISO 3166-1 alpha-3 for
  countries. "Côte d'Ivoire" and "Ivory Coast" are the same place.
- **No secrets in the repo**, and no API keys in the client. The pipeline runs at
  build time precisely so no key ever reaches a browser.

## Content rules

This is an app for children, which makes a few things non-negotiable:

- **Unreviewed text never ships.** Scraped Wikipedia prose lands in a review file
  with `reviewed: false`. A human rewrites it in kid language and flips the flag.
  Nothing reaches an entity's shippable fields before that (plan §1.6).
- **Prefer a blank field to a guessed one.** A missing state animal is fine; a
  wrong one in a quiz that claims to teach is not.
- **Say when data is uncertain.** Contested rankings get flagged, not silently
  picked (plan §1.8).

## Reporting

Say what actually happened. If a test fails, show it. If something was skipped,
name it. If a value came from a fixture rather than a live source, say which.
The pipeline warns rather than silently correcting, and the same standard
applies to what you write in a PR.
