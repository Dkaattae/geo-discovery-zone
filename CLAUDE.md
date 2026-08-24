# CLAUDE.md

Kids' geography quiz. `frontend/` React + TanStack Start (bun), `question-bank/`
Wikidata → JSON pipeline (bun), `api/` FastAPI + Postgres (uv, not built yet),
`tasks/` brief for the task in flight, `openapi.yaml` the frontend/backend
contract — change it deliberately and say so.

## Docs

- `process.md` — the development loop. Read first. `.claude/agents/` defines the
  five roles it runs on: task-expander, worker, tester, reviewer, and
  `orchestrator`, which drives one task through the other four.
- `tasks.md` — the work queue. `tasks/` holds the current brief.
- `test-guidelines.md` — what to test and how.
- `geoquizdataplan.md` — the plan and the reasoning. §5 is the tech stack.
- `PROGRESS.md` — what is done, broken, and next.
- `conventions.md` — code conventions, commands, and repo layout detail.
- `decisions.md` — why the process is shaped this way, and what would change it.

## Branches

**One task, one branch, one PR.** The branch is the one named in the brief's
`Branch:` header — that header is the authority, not any naming convention — and
every role on the task commits to it.

**Standing permission, from Dkaattae:** when a harness assigns your session its
own branch and tells you not to push elsewhere (Claude Code on the web does
this), you may push to the brief's `Branch:` header instead. **This paragraph is
the explicit permission such harnesses ask for.** It is written down so nobody
has to retype it at the start of every session. It grants exactly one thing: the
branch that brief names, for that task.

Still stop and ask when the grant plainly does not cover you — the header's
branch is not on the remote, the brief has no header, or two sources disagree
about which branch it is. Pushing to whatever branch you are standing on is never
the fallback: the PR cannot see it, nothing errors, and the task stalls
invisibly. That is what cost T-003 a cycle (`decisions.md` D-8).

## Packages

`uv add` / `uv run` in `api/`. `bun add` / `bun run` in `frontend/` and
`question-bank/`. Never pip, poetry, npm, yarn or pnpm.

**Ask before adding a dependency.** Say what it does and what the alternative
was. Commit the lockfile with it.

## Tests

Run them before saying something is done — "it typechecks" is not "it works",
and that means the whole suite, not just the new tests. A bug fix gets a test
that fails without the fix.

Start below the transport: the behaviours worth testing are pure functions, and
calling them directly beats injecting anything. Reach for a seam
(`SparqlTransport`, `SummaryTransport`, `EntitySink`) only when the thing under
test spans the network call — and never mock `fetch`. No network in tests.
Details in `test-guidelines.md`.

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

**Lead with the answer.** Every report — a chat reply, a `## Handoff`, a
`## Verdict`, a PR body — opens with a TL;DR the reader gets in one glance:

- **Two or three lines up top**: what happened, what it means, what is needed
  next. Someone who reads only this must not come away misled.
- **Bullets, not paragraphs**, for anything that is a list — findings, criteria,
  files changed, what a human has to do. One idea each, the point in the first
  few words, bolded when it is a label.
- **A table** when the shape repeats: criterion → verdict → evidence.
- **Detail below, not instead.** Being short at the top is not licence to drop
  the evidence — it moves underneath, where whoever wants it will look.
- **No throat-clearing.** Don't restate the request, don't narrate what you are
  about to do, don't summarise the summary.
