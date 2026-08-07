# T-0xx — <title>

**Status:** `expanding` → `awaiting approval` → `working` → `awaiting verification`
→ `pass` / `fail` / `blocked` → `awaiting review` → `changes requested` →
`merged` / `escalated`
**Next step:** which agent runs next — `task-expander`, `worker`, `tester`,
`reviewer` — or `human`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-08-06`
**From:** [`tasks.md`](../tasks.md) T-0xx
**Branch:** `task/T-0xx-slug` — **replace this with the branch actually used.**
Created by `task-expander`, shared by every role, and this line is what they read
to find it. `task/T-0xx-slug` is the default when the session may name its own
branch; where the environment assigns one per session, write that name here
instead (`process.md`, "When the environment names the branch for you"). Every
role after the expander checks `git branch --show-current` against this line and
stops if they differ — a placeholder left unreplaced strands their commits.
**PR:** #NN, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it; `changes requested` sends it back to the
agent named in Next step

**Sessions:** one line per agent run — role, date, and session id
(`echo $CLAUDE_CODE_REMOTE_SESSION_ID`). The tester must refuse to run in a
session already listed as `worker`; that separation is the only thing making
verification independent, and it is invisible unless it is written down.

| Role | Date | Session |
|---|---|---|
| task-expander | | |

This header is the loop's only shared state. Sessions are sequential and none of
them remembers the last one, so whoever opens this file must be able to tell
where the task stands without asking anybody. Every agent updates both lines
before it stops.

> **Light brief for an `S` task** (`process.md`, D-6): keep this header, the
> Sessions table, **Acceptance criteria**, **Handoff** and **Verdict**. Delete
> Goal, Out of scope, Constraints and Context. The file itself is never dropped —
> it is where four sessions find each other.

## Goal

One or two sentences: what this is for and why it is worth doing. Not how.

## Acceptance criteria

Numbered, observable, each checkable on its own. These become the tests, and a
fresh session reads them without having seen the work — so they have to make
sense to someone who was not here.

**Frozen once approved.** They change only by going back through `task-expander`
for a fresh approval, never by an edit during implementation and never by the
tester.

1. …
2. …
3. …

Write them as statements of what is true when the work is done:

> 3. `normalizeUsStates` returns `population_rank: null` for every entity when
>    the result set contains fewer than 50 states, and a rank in 1–50 when it
>    contains exactly 50.

Not as instructions:

> ~~3. Add a check in `normalize.ts` for the length of the matched array.~~

Include boundaries, and include what must *not* happen where that is the real
risk ("no test reaches the network", "no new dependency").

## Out of scope

What this task deliberately does not touch. Anything noticed here that is worth
doing becomes a new entry in `tasks.md`, not an extra commit in this branch.

- …

## Constraints

Rules the implementation has to respect.

- Files expected to change: …
- Invariants to hold: …
- Dependencies: none without asking (see [`CLAUDE.md`](../CLAUDE.md))
- …

## Context

**Required reading for the worker and the tester**, not background. Link
precisely — `geoquizdataplan.md` §1.4, not "the plan" — because these links are
how both of them reach the definition of correct.

- Files: …
- Plan sections: …
- Contract: `openapi.yaml` …

## Review checklist — non-testable tasks only

Delete this section if the criteria above are testable. For decision, curation
and documentation tasks (see [`process.md`](../process.md)), list what a human
must check, and record who checked it in the PR.

- [ ] …

## Handoff

Written by `worker` before the tester runs. **Always written, even when nothing
was built** — the tester starts cold and this is the only message it gets.

- Changed, file by file — or explicitly "nothing; already satisfied by `x.ts:NN`"
- Where each criterion's behaviour now lives
- What was deliberately not done, and why
- Anything found that contradicts the brief
- How to run what was touched

## Verdict

Written by `tester`: pass, fail or blocked, which criterion, what was observed,
and — for a task whose deliverable is tests — which mutations were made and what
each one did.

## Review

Written by `reviewer`, and **only when it sends the PR back**. The same findings
as its PR comment, each with file, line, and what would make it acceptable, plus
which agent owns which. On approve there is no Review section — the PR body is
the record and this file is about to be swept.

## Notes

Filled in while working. What surprised you, what you decided and why, anything
the brief got wrong. This is the raw material for the PR body and for the
`tasks.md` one-liner after the sweep.
