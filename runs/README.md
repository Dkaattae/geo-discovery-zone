# runs/

One file per orchestrated task: `T-0xx-slug.md`, written by the `orchestrator`
agent as it drives a task through the loop.

Unlike [`tasks/`](../tasks/), **this directory is not swept.** The brief is
deleted when its task merges and the PR inherits the acceptance criteria — but
neither keeps the story of the run: which role got sent back, what it missed, how
many rounds it took, and which calls the orchestrator made that a human would
otherwise have made.

## It is a record, not state

The brief's `Status` and `Next step` header is the state machine. Nothing reads
the run log to decide what happens next, and no role but the orchestrator writes
one. This is deliberate — see `decisions.md` D-1. A file that is both a record
and a source of truth goes stale in whichever of the two you check less often.

## What is in one

Each role's returned result, **copied verbatim** — not summarised, not commented
on. The orchestrator does not read the work and has no view to add; it timestamps
what came back and moves on.

The valve is one-way. Things go into this file; **nothing comes out of it into a
spawn prompt.** That is what keeps the orchestrator from carrying one role's
framing into the next one's context (D-3).

## Reading one

Start at the bottom. **`Outcome: halted — needs human`** means a role hit
something `CLAUDE.md` reserves for a person — a dependency, a product call — and
could not ask you, because a spawned agent has no way to reach anybody. The
question it wrote is quoted there, and the run is waiting on your answer.

Then read the brief. **Nobody approved its criteria** — a relayed run skips the
step-2 gate and the `Approved:` line says so outright. This file is where you
catch afterwards what a human would have caught before.

Tasks run without the orchestrator have no file here. That is normal — the
directory covers orchestrated runs, not every task.
