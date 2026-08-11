# Run logs

What each task actually cost, and where its cycles went. Written by
[`.claude/loop/run-loop.sh`](../.claude/loop/run-loop.sh); nothing here is
hand-maintained except where a file says so.

## The two files

- **`ledger.tsv`** — append-only, one row per step, every task in one place. This
  is the source of truth and the only thing the driver writes to. One tab-separated
  row per invocation: timestamps, task, step, round, role, session, turns, cost,
  wall clock, exit, the `Status` and `Next step` the step left behind, and the
  fault sentence if it left one.
- **`T-0xx-slug.md`** — regenerated from the ledger after every step. Never
  appended to, so a human editing the markdown cannot corrupt the driver's state.
  Edit the ledger if you need to correct something.

`transcripts/` holds the raw JSON result of each invocation, which is where to
look when a step did something surprising.

## Why this is separate from `PROGRESS.md`

They answer different questions and have different lifetimes.

| | `PROGRESS.md` | `runs/` |
|---|---|---|
| Question | *what landed, and why did reality differ from the brief* | *what did it cost, and where did the cycles go* |
| Granularity | one paragraph per task | one row per step |
| Written by | the `reviewer`, in prose, at sweep | the driver, mechanically, every step |
| Survives the sweep | yes | yes |

The completed-task entry in `PROGRESS.md` carries a `*Run:*` line —
`9 steps · 3 rounds · 2 approvals` and a link here. That is the whole overlap, on
purpose: the coarse view stays coarse and the numbers live where they are
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
is why `process.md`'s round bound counts them separately.

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

## The one hand-written file

`T-003-ci-typecheck-lint-test.md` was reconstructed after the fact, because T-003
ran before the driver existed. Its turn and cost columns are `—` rather than
numbers: they were never measured, and filling them with plausible values would
make the one log nobody can check the one log that looks most complete. It says
so at the top.
