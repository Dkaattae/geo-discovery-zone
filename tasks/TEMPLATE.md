# T-0xx — <title>

**Status:** `expanding` → `awaiting approval` → `working` → `awaiting verification`
→ `pass` / `fail` / `blocked` / `test changes requested` → on fail: `ci fix requested`
→ `ci fix approved` → `awaiting verification` again → `awaiting review` →
`changes requested` → `merged` / `escalated`
**Next step:** which agent runs next — `task-expander`, `worker`, `tester`,
`ci-fix`, `reviewer` — or `human`
**Approved:** `pending` — replace with who approved and the date, e.g. `Kate, 2026-08-06`
**Test changes:** `none` — the tester sets `requested` when it raises a Test change request; the tester replaces it with `approved — <name>, <date>` once that person has approved it in the tester's own session. The orchestrator never writes it (D-14, D-15)
**CI fix:** `none` — the `ci-fix` sets `requested` when it writes a CI fix plan; a person replaces it with `approved — <name>, <date>`, or after an hour with no answer the orchestrator stamps `approved — orchestrator, <date>, auto-approved after a <N>-minute timeout`; the `ci-fix` sets `applied — <that approval>` once it has applied the rows (D-17)
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
**Fault:** one sentence, written by whichever role set a non-`pass` `Status`, and
cleared when the task next reaches `pass`. What was wrong and who owns it — *"criterion 6
named a file path where it meant a behaviour"* — not what to do about it. Leave it
empty on a clean run. Both drivers read this line into `runs/`, so it is written
once here rather than restated in the log.

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
- **Tests made stale**: existing tests this change breaks by design (file, test
  name, why, and the delete or modify you propose), or "none". The worker never
  changes them itself.

## Verdict

Written by `tester`: pass, fail or blocked, which criterion, what was observed,
and — for a task whose deliverable is tests — which mutations were made and what
each one did. It also names every existing test deleted or modified, with the
reason and the approved Test change request row it came from.

## Test change request

Delete this section when no test that existed before the task needs to change.
Written by `tester` **only**, and only for tests the task's own change has made
stale or wrong (`.claude/agents/tester.md`, D-14). The worker lists candidates
under **Tests made stale** in its Handoff; it never fills this in. Raising it
sets `Status: test changes requested`, `Next step: human` and the header's
`Test changes: requested`. **No test here changes until a person approves it in
the session making the change.** If they are in the tester's session, it asks
them there. Otherwise the request waits here, and a tester started in a session
a person is attending picks it up and asks. The orchestrator never approves it
(D-15).

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `src/x.test.ts` › … › "…" | `abc1234`, T-0xx: … | criterion N changes … | delete / modify | new name, and exactly what it asserts | approved / refused — *(a person's answer, in the tester's session)* |

A count floor that drops because of a deletion above is its own **modify** row,
lowered by exactly the approved deletions from that file.

To approve: start the `tester` step for this task in a session you are
attending, and answer it there. It fills in Decision, sets the header's `Test
changes:` to `approved — <name>, <date>`, and applies the approved rows. Writing
Decision here first is fine, but the tester still asks you to confirm it in its
session. Or make the approved edits yourself, by hand, and set `Next step:
tester`.

## CI fix plan

Delete this section until the tester returns `fail`. Written by `ci-fix` **only**,
in its first pass, before it changes anything (`.claude/agents/ci-fix.md`, D-17).
Raising it sets `Status: ci fix requested`, `Next step: human` and the header's
`CI fix: requested`. **Nothing here is applied until it is approved** — by a person
(in the `ci-fix`'s session if they are there, or here, in Decision), or, after an
hour with nobody answering, by the orchestrator's timeout stamp. A later round
replaces the table rather than appending to it; git keeps the old one.

| # | File (and function or test) | Kind | Change | Why — failing test or CI line, root cause, criterion quoted for a test row | Decision |
|---|---|---|---|---|---|
| 1 | `src/x.ts` › `fn` | source / task test / pre-existing test | exactly what changes | `x.test.ts` › "…" fails because … | approved / refused |

A test row, the task's own or pre-existing, is a modify (quote the criterion; it
pins as hard as before), a delete (quote the brief's line that removes what it
pinned) or a lowered count floor (by exactly the approved deletions). A
`pre-existing test` row also gives the commit and task that introduced it. The
orchestrator's stamp approves test rows like any other, and the reviewer then
escalates (D-18).

**Root cause:** one paragraph.

**Not doing:** what was considered and rejected, and why.

To approve by hand: fill in Decision, set the header's `CI fix:` to `approved —
<name>, <date>` and `Next step` to `ci-fix`, commit, and start a run.

## CI fix

Written by `ci-fix` in its second pass, after applying the approved rows — its
handoff to the tester, read alongside the worker's `## Handoff`. Which rows were
applied and which refused, the approval line quoted, the suite / typecheck / lint
results as run, which kind of independence it had, and anything it noticed and
did not change.

## Review

Written by `reviewer`, and **only when it sends the PR back**. The same findings
as its PR comment, each with file, line, and what would make it acceptable, plus
which agent owns which. On approve there is no Review section — the PR body is
the record and this file is about to be swept.

## Notes

Filled in while working. What surprised you, what you decided and why, anything
the brief got wrong. This is the raw material for the PR body and for the
`tasks.md` one-liner after the sweep.
