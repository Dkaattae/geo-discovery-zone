# runs/

What each task actually cost, and where its cycles went. One file per task,
`T-0xx-slug.md`, plus an append-only `ledger.tsv` behind them.

Unlike [`tasks/`](../tasks/), **this directory is not swept.** The brief is
deleted at the sweep and the PR inherits the acceptance criteria — but
neither keeps the story of the run: which role got sent back, what it missed, how
many rounds it took, and which calls were made unattended that a human would
otherwise have made.

## Two writers, one format

The loop has two unattended drivers and they fill these files differently:

| | [`.claude/loop/run-loop.sh`](../.claude/loop/run-loop.sh) | the [`orchestrator`](../.claude/agents/orchestrator.md) agent |
|---|---|---|
| Writes | `ledger.tsv`, then **regenerates** `T-0xx-slug.md` from it | appends each role's result to `T-0xx-slug.md` **verbatim** |
| Turns, cost, wall clock | real, from `--output-format json` | **`—`** — it has no way to measure them |
| Sessions column | a distinct id per step, minted by the driver | one id, shared by every subagent |
| `transcripts/` | raw JSON per invocation | nothing |

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

- **`ledger.tsv`** — append-only, one tab-separated row per step, every task in
  one place: timestamps, task, step, round, role, session, turns, cost, wall
  clock, exit, the `Status` and `Next step` the step left behind, and the brief's
  `Fault:` sentence if it left one. Written only by the shell driver.
- **`T-0xx-slug.md`** — the human-readable log. Regenerated from the ledger by the
  driver, appended to by the orchestrator agent. **Do not hand-edit a generated
  one**; correct the ledger and it will be rewritten.

`transcripts/` holds the raw JSON result of each driver invocation, which is
where to look when a step did something surprising.

## Why this is separate from `PROGRESS.md`

They answer different questions and have different lifetimes.

| | `PROGRESS.md` | `runs/` |
|---|---|---|
| Question | *what landed, and why did reality differ from the brief* | *what did it cost, and where did the cycles go* |
| Granularity | one paragraph per task | one row per step |
| Written by | the `reviewer`, in prose, at sweep | a driver, mechanically, every step |
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
is **sent back**: how many of those trips ended `fail` (the code was wrong, back
to the worker) versus `blocked` (the criteria were wrong, back to the expander).
Those two have completely different causes and completely different fixes, which
is why the round bound counts them separately — see `.claude/loop/README.md`,
"The round bound".

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
