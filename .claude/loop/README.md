# `.claude/loop/` — the shell driver

`run-loop.sh` runs [`process.md`](../../process.md)'s loop with no human in the
middle, on a **local machine with the `claude` CLI**. It reads the brief's
`Next step`, invokes `claude -p --agent <role>`, records what happened, and
repeats until a gate stops it.

It is the second of two ways to run the loop unattended. The other is the
[`orchestrator`](../agents/orchestrator.md) agent, which does the same job from
inside a session. **They are for different environments and neither replaces the
other** — see "Which one to use".

## There is no model in this file

`decisions.md` D-1 originally rejected an orchestrator agent and predicted this
instead: *"a shell script that reads `Next step` and invokes `claude --agent
<name>`. Fifteen lines, no model, no drift."* It came out at 500, because the
gates turned out to be the whole value — but the principle held. **Nothing in
`run-loop.sh` reasons.** Every decision it makes is a `case` statement you can
read, and it cannot be talked out of one.

That is the property the orchestrator agent cannot have and the reason to keep
both.

## Which one to use

| | `run-loop.sh` | `orchestrator` agent |
|---|---|---|
| Runs on | a local machine with the `claude` CLI | anywhere a session runs, including Claude Code on the web |
| Spawns | a **new session per step**, `--session-id` minted by the driver | `Agent` subagents inside one session |
| Tester's independence | **checkable** — distinct session ids land in the Sessions table | attestation only; every subagent shares one session id |
| Branch | checks out the brief's `Branch:` header itself | inherits the orchestrator's checkout, passes the header in the prompt |
| Gates | six, mechanical, in `bash` | the same six, as instructions |
| Per-step spend cap | `--max-budget-usd`, enforced by the CLI | none — the model cannot cap itself |
| Cost and turn counts | real, from `--output-format json` | unavailable, recorded as `—` |
| Drift | impossible | possible, which is why the prompt is a fixed template |

**Prefer the driver when you have the choice.** It is strictly stronger on the
two things that matter — the independence check is evidence rather than a claim,
and the budget cap is enforced by something other than the model's opinion of how
much it has spent. The orchestrator agent exists because the web has no shell you
can leave running.

## Usage

```bash
.claude/loop/run-loop.sh              # run until stopped, finished, or capped
.claude/loop/run-loop.sh status       # where does the task stand? invokes nothing
.claude/loop/run-loop.sh --dry-run    # print the next step, invoke nothing
```

Needs `claude` and `jq` on `PATH`, and a clean working tree. It refuses to start
dirty, because its first act after every step is `git add -A`.

Stopping is `exit 0`. **Only a broken driver exits non-zero** — a run that halts
for a human has worked, not failed.

## The gates

Six, all mechanical. None of them looks at whether the work is any good; that is
the tester's job and the reviewer's, and a driver that judged would be the
orchestrator agent D-1 originally rejected.

| | Gate | Stops when |
|---|---|---|
| **G0** | `gate_next_unambiguous` | `Next step` names **two** roles. Taking the first silently is the D-8 failure shape |
| **G1** | `gate_process_files` | the diff touches `process.md`, `decisions.md`, `CLAUDE.md` or `.claude/` |
| **G2** | `gate_approval` | `Approved:` is missing or still `pending` |
| **G3** | `gate_rounds` | `fail` or `blocked` rounds hit their bound — **counted separately** |
| **G4** | `gate_branch` | the header is missing — otherwise it **checks the header's branch out** |
| **G5** | in `run_role` | a role returned having changed neither `Status` nor `Next step` |

**G1 is the one to understand.** A task that changes how the loop works does not
get to run through the loop. It is checked against the real diff rather than
against what the brief claims, so a brief cannot talk its way past it — and it is
why **this very change** could not have been made by an unattended run.

**G4 does more than gate: it checks the branch out.** That is what you want from
a driver that owns the checkout, and it is a sharp edge everywhere else — a brief
whose `Branch:` header names some other branch will move your working tree as a
side effect of running the loop. `test-gates.sh` names the current branch in
every fixture for exactly this reason, and restores the checkout on exit if
something slips past.

**G5 is the one that exists because of T-003.** A role that returns having moved
nothing produces no error and no red test; the task simply stops existing. See
`runs/T-003-ci-typecheck-lint-test.md`, fault 1.

## The round bound, and what T-003 says about it

`LOOP_MAX_FAIL` and `LOOP_MAX_BLOCKED` default to 2 each and are counted
**separately**, because they mean opposite things:

- **`fail`** — the tester ran the criteria and the code did not meet them. Back
  to the `worker`. The brief is fine.
- **`blocked`** — the tester could not run the criteria at all. Back to the
  `task-expander`. **The brief is wrong.**

T-003 hit one of each, and they had nothing in common: criterion 6 named a file
path where it meant a behaviour (`blocked`), and the skip guard disagreed with
bun about `.mts` (`fail`). A single combined bound of 2 would have stopped that
task one step before it passed. A combined bound of 4 would let four straight
`fail`s run, which is a spin.

Two counters, two bounds, and the log reports them as **"sent back: N on the
code, M on the criteria"** rather than as one number.

## Permissions

`--permission-mode` defaults to `acceptEdits`, which **still prompts for Bash** —
so an unattended run needs one of:

- a `permissions.allow` list in `.claude/settings.json` covering the git and test
  commands the roles actually run; or
- `LOOP_PERMISSION_MODE=bypassPermissions`, **in a sandbox or container only.**

The safe one is the default on purpose. A driver that ships with
`bypassPermissions` is a driver that gets run on a laptop by accident.

## On limits

Three caps, and they are backstops for three different failures:

| Variable | Default | Catches |
|---|---|---|
| `LOOP_BUDGET_USD` | `5` | a step that **spends** — enforced per step by the CLI |
| `LOOP_TIMEOUT` | `3600` | a step that **hangs** without spending |
| `LOOP_MAX_STEPS` | `20` | a livelock the gates somehow miss |

**`LOOP_BUDGET_USD` is the only one that is real.** It is enforced by
`--max-budget-usd` inside the CLI, not by the model's estimate of its own
remaining budget — which is the difference between a limit and a request. The
other two are wall-clock and counting, which is why they are set loose enough to
never fire on a healthy run.

Hitting a cap is not data loss. **Every exit is committed and pushed** —
`checkpoint()` runs after each step whatever the exit code, including timeout and
Ctrl-C — so a dead session's work is on the branch before the driver decides what
to do about it. Raise the cap and run again; the next session picks the task up
from the brief.

## Other variables

| Variable | Default | Meaning |
|---|---|---|
| `LOOP_MAX_FAIL` | `2` | failed verify rounds before stopping |
| `LOOP_MAX_BLOCKED` | `2` | blocked verify rounds before stopping |
| `LOOP_PUSH` | `1` | set `0` to commit without pushing |
| `CLAUDE_BIN` | `claude` | path to the CLI |

## What it writes

Everything lands in [`runs/`](../../runs/) — see the README there. `ledger.tsv`
is the source of truth and the only file the driver appends to; `T-0xx-slug.md`
is regenerated from it after every step, so editing the markdown cannot corrupt
the driver's state. Edit the ledger.
