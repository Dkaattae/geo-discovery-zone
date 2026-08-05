# T-0xx — <title>

**Status:** doing
**From:** [`tasks.md`](../tasks.md) T-0xx
**Branch:** `claude/t-0xx-slug`

## Goal

One or two sentences: what this is for and why it is worth doing. Not how.

## Acceptance criteria

Numbered, observable, each checkable on its own. These become the tests, and a
fresh session will read them without any other context — so they have to make
sense to someone who was not here.

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

Where to look. Save the verifier and your future self the search.

- Files: …
- Plan sections: …
- Contract: `openapi.yaml` …

## Review checklist — non-testable tasks only

Delete this section if the criteria above are testable. For decision, curation
and documentation tasks (see [`process.md`](../process.md)), list what a human
must check, and record who checked it in the PR.

- [ ] …

## Notes

Filled in while working. What surprised you, what you decided and why, anything
the brief got wrong. This is the raw material for the PR body and for the
`tasks.md` one-liner after the sweep.
