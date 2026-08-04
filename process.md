# Process

How work moves through this repo. One task at a time, in order, with the queue
kept honest as you go.

The three documents this loop runs on:

- [`geoquizdataplan.md`](geoquizdataplan.md) — why the app works the way it does
- [`PROGRESS.md`](PROGRESS.md) — where the project stands, coarse grained
- [`tasks.md`](tasks.md) — the queue of small, independent, ordered tasks

## The loop

### 1. Pick the next task

Take the **first task in [`tasks.md`](tasks.md) whose dependencies are done**.
Order is a judgement already made — don't re-litigate it per task. Skip past a
task only when it is genuinely blocked, and write down what blocks it.

One task at a time. Two half-finished tasks are worth less than one finished one.

### 2. Do it

Mark the task `doing` before you start, so an interrupted session leaves a trail.

Stay inside the task's scope. Work you notice along the way that is *not* this
task becomes a new task in the queue — not an extra commit in this one. A task
that grows past a few hours' work is really two tasks; split it.

Follow the rules in [`CLAUDE.md`](CLAUDE.md): ask before adding dependencies, use
`uv` and `bun`, write tests for behaviour worth protecting.

### 3. Finish it

A task is done when:

- its **Done when** criteria are all true,
- tests pass — including a new test for anything fixed,
- docs that are now wrong have been corrected in the same change.

That last one is not optional. A README saying something has never run, after it
has run, is worse than no README.

Mark the task `done` and add a one-line note of what actually happened,
especially if reality differed from the plan.

### 4. Re-evaluate the queue

**This is the step that keeps the list useful, and the one most likely to be
skipped.** Finishing a task changes what the remaining ones mean. Before picking
up the next one, read back through `tasks.md` and ask:

- **Did this make a later task smaller, larger, or unnecessary?** Delete tasks
  that no longer need doing and say why. A queue nobody prunes stops being read.
- **Did it uncover work that isn't in the queue?** Add it, sized small.
- **Did it invalidate an assumption a later task rests on?** Rewrite that task
  now, while you still remember why.
- **Did the order change?** Something newly cheap may deserve to come first.

Then reconcile upward:

- **`PROGRESS.md`** — when a group of tasks lands, or when a known gap opens or
  closes. Not every task needs an entry.
- **`geoquizdataplan.md`** — only when reality contradicts the plan. The plan is
  a considered document; changing it is a decision, not bookkeeping. If a plan
  section is now wrong, say so explicitly rather than quietly editing it away.

### 5. Ship it

One task, one branch, one PR. A PR that is easy to review gets reviewed.

The PR body should say what changed, what you verified, and what you chose not
to do. If a decision could reasonably have gone the other way, say why it went
this way — that is the part reviewers cannot reconstruct from the diff.

## When reality disagrees with the plan

It will. The plan was written before the code existed, and the first live
Wikidata run already corrected three of its assumptions.

When that happens:

1. Do the thing that is actually correct.
2. Say clearly that it diverges, in the commit and the PR.
3. Update `tasks.md` for anything downstream that assumed otherwise.
4. Note it in the plan **only** if the plan's reasoning is now wrong — not
   merely because a detail changed.

The plan earns its place by being trustworthy. Silent edits erode that faster
than open contradictions.

## Definition of done, in one line

**Criteria met, tests passing, docs true, queue re-evaluated, PR open.**
