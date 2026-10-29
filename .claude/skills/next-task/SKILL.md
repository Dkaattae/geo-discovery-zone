---
name: next-task
description: Start the next task in the queue as an orchestrated run — check the ground is clear, then act as the `orchestrator` from `.claude/agents/orchestrator.md`, starting with the `task-expander`, which picks the task. Use when asked to "start the next task", "run the next task in the queue", or "be the orchestrator".
---

# Start the next task

You are about to become the **`orchestrator`** for one task. This skill only
covers getting to the first spawn safely. Everything after that is
[`.claude/agents/orchestrator.md`](../../agents/orchestrator.md), which you
must **read in full before spawning anything** and then follow exactly. Where
this file and `orchestrator.md` disagree, `orchestrator.md` wins.

**You do not pick the task.** The `task-expander` does, at the start of its run
(`process.md`, "Pick and sweep"). Do not open `tasks.md` to choose one or to
"help" — the orchestrator never reads the queue.

## 1. Preflight — is there room for a new task?

Run these checks and stop at the first one that fails, telling the person what
you found. Each one is mechanical; none needs you to read the work.

1. **Sync.** `git fetch origin main <your-branch>`.
2. **No live brief.** `ls tasks/` on `origin/main` and on your branch must
   show only `README.md` and `TEMPLATE.md`. If there is a `tasks/T-0xx-*.md`,
   this is not a new task. It is one that is still running. Read its first 20
   lines only, report `Status`, `Next step` and `PR`, and ask the person
   whether to resume it from `Next step`. Do not start a second.
3. **Your branch is clean.** `git diff --name-only origin/main...HEAD` must be
   empty. If it is not, your branch still carries an earlier task's PR. Check
   whether that PR is merged:
   - **Merged** → restart the branch from main, keeping the name:
     `git checkout -B <your-branch> origin/main`, then
     `git push --force-with-lease -u origin <your-branch>`.
   - **Open, or unsure** → stop and ask. One task, one branch, one PR.
4. **G1 on the starting point.** The same diff must not touch `process.md`,
   `process-decisions.md`, `CLAUDE.md` or `.claude/`. On a clean branch it is
   empty, so this passes trivially; it matters when step 3 found commits.

## 2. The branch

With no brief yet, there is no `Branch:` header. Use **the branch the session
was assigned** (Claude Code on the web names one). The expander writes it into
the new brief's header, and from then on the header is the authority
(`CLAUDE.md`, "Branches"). Never invent a branch name.

## 3. Spawn the expander

Use the template from `orchestrator.md` with exactly these substitutions — the
"no brief yet" form of the Brief slot is the only difference:

```
You are the `task-expander` for the next task, at its step in process.md.

Brief:  none yet — `tasks/` holds no live brief
Branch: <your-branch>   — commit and push here. It becomes the brief's `Branch:` header.

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
reviewer marks the PR ready or the run halts.

## 4. Things earlier runs ran into

These are reminders, not new rules. Each points back at the rule it comes from.

- **The `Approved:` stamp can be refused** by the harness as self-approval
  (T-078). Then halt under G2 and ask the person; if they approve in your
  session, record their words in `runs/` and write the line.
- **A refused sweep** (`Status: sweep refused`) → halt, ask the person, and
  schedule a check-in about 60 minutes out with `send_later` (D-16). If they
  answer first, cancel the check-in.
- **A CI fix request** (`CI fix: requested`, `Status: ci fix requested`) →
  halt, ask the person, and schedule a check-in about 60 minutes out with
  `send_later`. If nobody answers, stamp it from the header and spawn a fresh
  `ci-fix`, as `orchestrator.md` "CI fix requests" says (D-17). Never open the
  plan.
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

As `orchestrator.md` "Ending": log, push to the brief's branch, confirm with
`git log origin/<branch> -1`, and report — roles in order, where it ended, and
any question a person has to answer, quoted. Then stop. **One task per run.**
