# runs/

What each task actually cost, and where its cycles went. One file per task,
`T-0xx-slug.md`, plus an append-only `ledger.tsv` behind them.

Unlike [`tasks/`](../tasks/), **this directory is not swept.** The brief is
deleted at the sweep and the PR inherits the acceptance criteria — but
neither keeps the story of the run: which role got sent back, what it missed, how
many rounds it took, and which calls were made unattended that a human would
otherwise have made.

## Who writes here

The [`orchestrator`](../.claude/agents/orchestrator.md) agent appends each role's
result to `T-0xx-slug.md` **verbatim**. It has no way to measure turns, cost or
wall clock, so those are **`—`**, and every subagent shares one session id.

Older logs, `ledger.tsv`, `between-tasks.md` and `transcripts/` were written by
the shell driver `.claude/loop/run-loop.sh`, removed in D-19. They are kept as
history. Nothing writes to them now.

**Where a number is unavailable it is `—`, never an estimate.** Filling those
columns with plausible values would make the logs nobody can check into the ones
that look most complete. The same rule covers the one hand-written file below.

## It is a record, not state

The brief's `Status` and `Next step` header is the state machine. **Nothing here
is read to decide what happens next.** See `process-decisions.md` D-1. A file that is
both a record and a source of truth goes stale in whichever of the two you check
less often.

For the orchestrator agent the rule is sharper, because it is the thing standing
between one role's framing and the next role's context: the valve is **one-way**.
Things go into this file; nothing comes out of it into a spawn prompt (D-3).

## The two files

- **`T-0xx-slug.md`** — the human-readable log, one per task, appended to by the
  orchestrator. A run of several tasks writes one file per task, each on that
  task's branch.
- **`ledger.tsv`**, **`between-tasks.md`**, **`transcripts/`** — the removed shell
  driver's output (see above). Frozen.

## Why this is separate from `PROGRESS.md`

They answer different questions and have different lifetimes.

| | `PROGRESS.md` | `runs/` |
|---|---|---|
| Question | *what landed, and why did reality differ from the brief* | *what did it cost, and where did the cycles go* |
| Granularity | one paragraph per task | one row per step |
| Written by | the `reviewer`, in prose, at sweep | the orchestrator, verbatim, every step |
| Survives the sweep | yes | yes |

The completed-task entry in `PROGRESS.md` carries a `*Run:*` line —
`9 steps · 3 rounds · 2 approvals` and a link here. That is the whole overlap, on
purpose: the coarse view stays coarse, and the numbers live where they are
generated rather than being retyped into prose that then drifts.

**Fault sentences are shared, not duplicated.** Both files quote the brief's
`Fault:` header, written once by whichever role set a non-`pass` status. If they
ever disagree, the brief was edited after the fact.

## Reading the numbers

`Rounds` counts trips through the tester, so three rounds means the task was
verified three times, not that it failed three times. The line that matters more
is **sent back**: how many of those trips ended `fail` (the code was wrong, on
to the `ci-fix`) versus `blocked` (the criteria were wrong, back to the expander).
Those two have completely different causes and completely different fixes, which
is why the round bound counts them separately — see `orchestrator.md`, G3.

Cross-task questions are one `awk` away — that is the reason for a single ledger
rather than a file per task:

```bash
# average rounds per completed task
awk -F'\t' 'NR>1 && $6=="tester" {n[$3]++} END {for (t in n) s+=n[t]; print s/length(n)}' runs/ledger.tsv

# every fault, newest first
awk -F'\t' 'NR>1 && ($12=="fail" || $12=="blocked") {print $1, $3, $12, $14}' runs/ledger.tsv | sort -r

# what a task cost
awk -F'\t' -v t=T-003-ci-typecheck-lint-test 'NR>1 && $3==t {s+=$9} END {printf "$%.2f\n", s}' runs/ledger.tsv
```

## Reading an orchestrated run

Start at the bottom. **`Outcome: halted — needs human`** means a role hit
something `CLAUDE.md` reserves for a person — a dependency, a product call — and
could not ask you, because a spawned agent has no way to reach anybody. The
question it wrote is quoted there, and the run is waiting on your answer.

Then read the brief. **Nobody approved its criteria** — a relayed run skips the
step-2 gate and the `Approved:` line says so outright. This file is where you
catch afterwards what a human would have caught before.

Tasks run manually, one session per step, have no file here. That is normal — the
directory covers unattended runs, not every task.

## The one hand-written file

`T-003-ci-typecheck-lint-test.md` was reconstructed after the fact, because
neither driver existed when T-003 ran. Its turn and cost columns are `—` and it
says so at the top. It is kept because it is the only end-to-end task the loop
has run, and the shape it shows — where the rounds went, and the fault that
produced no verdict at all — is the reason this directory exists.
