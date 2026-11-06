---
name: next-task
description: Start an orchestrated run over the queue — check the ground is clear, then act as the `orchestrator` from `.claude/agents/orchestrator.md`, running tasks one after another (3 by default, or as many as the person says), each started by a `task-expander` that picks it. Use when asked to "start the next task", "run the next N tasks", "run the loop", or "be the orchestrator".
---

# Start an orchestrated run

You are about to become the **`orchestrator`** for a run of one or more tasks,
taken one at a time. This skill only covers getting to the first spawn safely. Everything after that is
[`.claude/agents/orchestrator.md`](../../agents/orchestrator.md), which you
must **read in full before spawning anything** and then follow exactly. Where
this file and `orchestrator.md` disagree, `orchestrator.md` wins.

**How many tasks.** Whatever the person said — "the next task" is one, "the
next three" is three, "run the loop" with no number is the orchestrator's
default of 3. `orchestrator.md` "The loop you run" has the limit and the
conditions that end a run early.

**You do not pick the task.** The `task-expander` does, at the start of its run
(`process.md`, "Pick and sweep"). Do not open `tasks.md` to choose one or to
"help" — the orchestrator never reads the queue.

## 1. Preflight — is there room for a new task?

Run this once, before the first task. Later tasks start from `origin/main` on
their own branches (`orchestrator.md`, "Between tasks"), so it does not repeat.

Run these checks and stop at the first one that fails, telling the person what
you found. Each one is mechanical; none needs you to read the work.

1. **Sync.** `git fetch origin main <your-branch>`.
2. **No live brief.** `ls tasks/` on `origin/main` and on your branch must
   show only `README.md` and `TEMPLATE.md`. If there is a `tasks/T-0xx-*.md`,
   on **your branch**, this is not a new task. It is one that is still running.
   Read its first 20 lines only, report `Status`, `Next step` and `PR`, and ask
   the person whether to resume it from `Next step` before starting new ones.
   A live brief on `main` itself means a sweep was missed: stop and say so.
3. **Your branch is clean.** `git diff --name-only origin/main...HEAD` must be
   empty. If it is not, your branch still carries an earlier task's PR. Check
   whether that PR is merged:
   - **Merged** → restart the branch from main, keeping the name:
     `git checkout -B <your-branch> origin/main`, then
     `git push --force-with-lease -u origin <your-branch>`.
   - **Open, or unsure** → do not reuse it. Start the first task with
     `Branch: new`, as for any later task. One task, one branch, one PR.
4. **G1 on the starting point.** The same diff must not touch `process.md`,
   `process-decisions.md`, `CLAUDE.md` or `.claude/`. On a clean branch it is
   empty, so this passes trivially; it matters when step 3 found commits.

## 2. The branch

With no brief yet, there is no `Branch:` header. For the **first task** use
**the branch the session was assigned** (Claude Code on the web names one);
every later task gets `Branch: new` and the expander creates
`task/T-0xx-slug` from `origin/main`. The expander writes it into
the new brief's header, and from then on the header is the authority
(`CLAUDE.md`, "Branches"). Never invent a branch name.

## 3. Spawn the expander

Use the expander's form of the template from `orchestrator.md`. For the first
task:

```
You are the `task-expander` for the next task, at its step in process.md.

Brief:     none yet — `tasks/` on main holds no live brief
Branch:    <your-branch>   — commit and push here. It becomes the brief's `Branch:` header.
In flight: none

Read the brief, process.md for your step, and CLAUDE.md. Do your role's job.
Write your section of the brief, update Status and Next step, add your Sessions
row, commit and push, and confirm the push landed.

This run is orchestrated: no human is watching it turn by turn. If you need a
human decision — a dependency, a product call, anything CLAUDE.md reserves for a
person — do not guess and do not proceed. Write what you need into the brief,
set Status: blocked and Next step: human, commit, and stop.
```

When it returns, create `runs/T-0xx-slug.md` from the header it wrote and carry
on as `orchestrator.md` says: stamp `Approved:`, run G0–G5, relay until the
task ends, then start the next one until the run ends.

## 4. Things earlier runs ran into

These are reminders, not new rules. Each points back at the rule it comes from.

- **The `Approved:` stamp can be refused** by the harness as self-approval
  (T-078). Then halt under G2 and ask the person; if they approve in your
  session, record their words in `runs/` and write the line.
- **A refused sweep** (`Status: sweep refused`) → halt the task, ask the
  person, note the time, and move on to the next task. Come back to it at the
  end of the run (`orchestrator.md`, "Waiting tasks at the end of a run", D-16).
- **A CI fix request** (`CI fix: requested`, `Status: ci fix requested`) →
  the same. If nobody has answered by the time you come back and the hour is
  up, stamp it from the header and spawn a fresh `ci-fix`, as `orchestrator.md`
  "CI fix requests" says (D-17). Never open the plan.
- **Your subagents share your checkout.** Before spawning for a task, stand on
  that task's `Branch:` (G4). Between tasks, go back to `origin/main`.
- **Stop-hook nags about untracked files while a role is running** are the
  role's work in progress. Leave them alone — the role commits its own work.
  Commit leftovers only after the role returns (orchestrator "Checkpoint").
- **Every spawned role shares one session id.** The worker may ask for a
  tester in another session; you cannot supply one. Do not add a sentence to
  the tester's prompt about it — the tester reports it in its Verdict (P-14).
- **Marking the PR ready and merging** belong to the reviewer and a person. Do
  the first only when a person tells you to in your session, after checking CI.
  Never merge.

## 5. Ending

As `orchestrator.md` "Ending": every task's log pushed to its own branch and
confirmed with `git log origin/<branch> -1`, then one report — a row per task
with its PR, roles in order and where it ended, and every question a person has
to answer, quoted. Then stop.
