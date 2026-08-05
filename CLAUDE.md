# CLAUDE.md

Kids' geography quiz. `frontend/` React + TanStack Start (bun), `question-bank/`
Wikidata → JSON pipeline (bun), `api/` FastAPI + Postgres (uv, not built yet),
`tasks/` brief for the task in flight, `openapi.yaml` the frontend/backend
contract — change it deliberately and say so.

## Docs

- `process.md` — the development loop. Read first. `.claude/agents/` defines the
  four roles it runs on: task-expander, worker, tester, reviewer.
- `tasks.md` — the work queue. `tasks/` holds the current brief.
- `test-guidelines.md` — what to test and how.
- `geoquizdataplan.md` — the plan and the reasoning. §5 is the tech stack.
- `PROGRESS.md` — what is done, broken, and next.
- `conventions.md` — code conventions, commands, and repo layout detail.
- `decisions.md` — why the process is shaped this way, and what would change it.

## Packages

`uv add` / `uv run` in `api/`. `bun add` / `bun run` in `frontend/` and
`question-bank/`. Never pip, poetry, npm, yarn or pnpm.

**Ask before adding a dependency.** Say what it does and what the alternative
was. Commit the lockfile with it.

## Tests

Run them before saying something is done — "it typechecks" is not "it works",
and that means the whole suite, not just the new tests. A bug fix gets a test
that fails without the fix.

Test the seams (`SparqlTransport`, `SummaryTransport`, `EntitySink`) rather than
mocking `fetch`. No network in tests. Details in `test-guidelines.md`.

## Content rules

This is an app for children:

- **Unreviewed text never ships.** Scraped prose lands in a review file with
  `reviewed: false`; a human rewrites it and flips the flag.
- **Prefer a blank field to a guessed one.** A missing state animal is fine; a
  wrong one in a quiz that claims to teach is not.
- **Flag uncertain data** rather than silently picking a side.

## Reporting

Say what actually happened. If a test fails, show it. If something was skipped,
name it. If a value came from a fixture rather than a live source, say which.
