# Conventions

Detail that does not need to be in front of every session. `CLAUDE.md` carries
the rules that always apply; this carries the rest.

## Layout

```
frontend/        React 19 + TanStack Start app (TypeScript, bun)
question-bank/   Wikidata → entity JSON pipeline (TypeScript, bun)
api/             FastAPI backend (Python, uv) — not built yet
tasks/           brief for the task in flight; empty when nothing is
openapi.yaml     the contract between frontend and backend
```

## Code

**TypeScript is strict**, including `exactOptionalPropertyTypes`. Optional
fields are declared `field?: T | undefined`, not `field?: T` — the latter fails
to typecheck when assigned a possibly-undefined value.

**Formatting** is prettier at 100 columns, double quotes, semicolons, trailing
commas everywhere. `bun run format` in `frontend/`; `question-bank/` uses the
same settings via `bunx prettier`. Python is `ruff format`.

**Alembic owns the database schema.** The pipeline emits JSON and a Python
loader writes it; nothing else creates tables (plan §5.3). `DbSink` in
`question-bank/` is a seam for standalone use, not the path that defines tables.

**Join on codes, never on names.** FIPS for US states, ISO 3166-1 alpha-3 for
countries. "Côte d'Ivoire", "Ivory Coast" and "CIV" are the same place, and
name-joining will lose you an evening finding that out.

**No secrets in the repo, and no API keys in the client.** The pipeline runs at
build time precisely so no key ever reaches a browser. Keys come from the
environment.

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
bun test

# api (once it exists)
cd api && uv sync && uv run fastapi dev
cd api && uv run alembic upgrade head
cd api && uv run pytest && uv run ruff check
```

## Network

`question-bank` needs `query.wikidata.org` and `en.wikipedia.org`. Bun's `fetch`
cannot negotiate every egress proxy, so `httpGet()` falls back to `curl` on
transport failure and logs when it does; `QUESTION_BANK_NO_CURL=1` disables it.
A `403 Host not in allowlist` is the sandbox, not Wikidata.
