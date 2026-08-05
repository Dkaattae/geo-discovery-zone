# tasks/

Briefs for work **currently in flight**. One file per task, created at
[`process.md`](../process.md) step 2 and deleted at step 6 once the PR is merged.

An empty folder means nothing is in progress. That is the normal state.

```
tasks/
  README.md      this file
  TEMPLATE.md    copy this to start a task
  T-0xx-slug.md  the task being worked right now
```

## Why the brief lives in a file

It is the handoff. The session that verifies the work is a **fresh one with no
memory of it** — it reads this file, the repository, `test-guidelines.md` and
`CLAUDE.md`, and nothing else. Anything the verifier needs that lives only in
someone's head or in a chat transcript is, for its purposes, lost.

That makes the acceptance criteria the contract. They are what gets tested, and
they are what "done" means.

## Why it gets deleted

So the folder always answers "what is being worked on right now" without anyone
having to prune stale files. Nothing is lost: the brief is in git history, and
the PR body carries the acceptance criteria verbatim, which is where they belong
permanently — attached to the change that satisfied them.

## Naming

`T-0xx-short-slug.md`, matching the ID in [`tasks.md`](../tasks.md), e.g.
`T-001-question-bank-test-setup.md`.
