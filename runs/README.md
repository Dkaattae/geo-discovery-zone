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

## Reading one

The section that matters is **"What a human still needs to look at"**. The
orchestrator holds approvals that used to be human gates; that section is where
it says what it waved through. Empty is a legitimate answer and a claim worth
checking.

Tasks run without the orchestrator have no file here. That is normal — the
directory covers orchestrated runs, not every task.
