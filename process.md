# Process

How work moves through this repo. One task at a time, expanded into a brief,
built, verified by someone who did not build it, then merged and swept up.

The documents this loop runs on:

- [`geoquizdataplan.md`](geoquizdataplan.md) — why the app works the way it does
- [`PROGRESS.md`](PROGRESS.md) — where the project stands, coarse grained
- [`tasks.md`](tasks.md) — the queue of small, independent, ordered tasks
- [`tasks/`](tasks/) — the brief for the task currently being worked
- [`test-guidelines.md`](test-guidelines.md) — how tests get written here
- [`CLAUDE.md`](CLAUDE.md) — the repo's standing rules
- [`conventions.md`](conventions.md) — code conventions and commands

## The loop

```
tasks.md
   │
   ├─▶ 1. pick          first task whose dependencies are done
   │
   ├─▶ 2. expand        write tasks/T-0xx-slug.md:
   │                      goal · acceptance criteria · out of scope · constraints
   │                    ── human approves the brief ──
   │
   ├─▶ 3. work          implement, inside that scope only
   │
   ├─▶ 4. verify        FRESH SESSION, no working context:
   │                      writes tests from the acceptance criteria
   │                      runs them
   │        │
   │        ├── fail (code wrong) ─────────▶ back to 3
   │        ├── criteria wrong or untestable ▶ back to 2
   │        └── pass ─▶
   │
   ├─▶ 5. ship          commit, push, open a PR — human reviews and merges
   │
   └─▶ 6. sweep         delete tasks/T-0xx-slug.md, mark done in tasks.md,
                        re-evaluate the queue, reconcile PROGRESS.md
```

---

### 1. Pick

Take the **first task in [`tasks.md`](tasks.md) whose dependencies are done**.
Order is a judgement already made — don't re-litigate it per task. Skip a task
only when it is genuinely blocked, and write down what blocks it.

One task at a time. Two half-finished tasks are worth less than one finished one.

### 2. Expand

Write `tasks/T-0xx-slug.md` from [`tasks/TEMPLATE.md`](tasks/TEMPLATE.md). This
brief is what the verifier will read, and it is the only thing they will read, so
it has to stand on its own.

| Section | What goes in it |
|---|---|
| **Goal** | One or two sentences. Why this is worth doing, not how |
| **Acceptance criteria** | Numbered, observable, checkable one at a time |
| **Out of scope** | What this task explicitly does not touch |
| **Constraints** | Rules that bind the implementation — files to change, invariants to hold, dependency limits |
| **Context** | Where to look: files, plan sections, the contract |

**Acceptance criteria are the whole game.** They become the tests, so:

- **Observable.** "Ranks are `null` when fewer than 50 states are in the result"
  is checkable. "Ranking is handled sensibly" is not.
- **Behavioural, not procedural.** Say what must be true afterwards, not which
  function to write. The verifier tests outcomes and the implementation is free
  to change.
- **Include the boundary.** "Fewer than 50" implies 49 and 50 are both worth
  stating.
- **Include what must *not* happen** when that is the real risk — no network in
  tests, no unreviewed text in shippable fields, no dependency added.

> **Get the brief approved before writing code.** This is the one human gate in
> the loop, and it is deliberately at the front. Everything downstream —
> implementation, tests, the merge decision — inherits these criteria. Wrong
> criteria produce working software that solves the wrong problem, and the tests
> will happily certify it.

### 3. Work

Implement, inside the brief's scope. Follow [`CLAUDE.md`](CLAUDE.md): `uv` and
`bun` for packages, **ask before adding a dependency**, write tests for behaviour
worth protecting.

Work you notice that is *not* this task becomes a new entry in `tasks.md` — not
an extra commit here. A task that outgrows a few hours is two tasks; split it.

Commit the brief along with the code, so the verifier can fetch the branch and
read it.

You may write tests as you go — you should, for anything you are unsure of. That
does not replace step 4: your tests know what you built, and the point of step 4
is a check that does not.

### 4. Verify — in a fresh session

Hand off to a **new session with no memory of the work**. That isolation is the
mechanism: a verifier who watched the implementation being written tends to test
what was built rather than what was asked for.

**What the verifier gets:** the task brief, the repository at that branch,
[`test-guidelines.md`](test-guidelines.md), and [`CLAUDE.md`](CLAUDE.md).

**What it does not get:** the working session's conversation, reasoning, or
notes. Nothing that says why a choice was made.

It reads the implementation only to find entry points and signatures — never to
decide what the expected values are. Expected values come from the criteria. Test
naming should make the mapping obvious, one criterion at a time.

Three outcomes:

| Outcome | Meaning | Next |
|---|---|---|
| **Pass** | Every criterion has a test and every test passes, including the pre-existing suite | Step 5 |
| **Fail** | A criterion is not met by the code | Back to **step 3**. The failing test stays |
| **Blocked** | A criterion is ambiguous, untestable as written, or wrong | Back to **step 2**. Fix the brief, not the test |

That third row matters. When a test and a criterion disagree, the default is that
the **criterion** gets clarified — silently rewriting the test to match the code
turns the whole loop into theatre.

**Bound the cycle.** After two full fail→fix→verify rounds without a pass, stop
and escalate to a human. Three rounds means the brief is wrong, not the code, and
the loop cannot tell the difference on its own.

Passing includes the whole suite plus typecheck and lint — not only the new tests.

### 5. Ship

Commit, push, open one PR for the task.

The PR body carries the acceptance criteria **verbatim**, with what verified
each. This is deliberate: step 6 deletes the brief, and the PR then becomes the
permanent record of what "done" meant. Also say what you chose not to do, and why
any decision could reasonably have gone the other way.

A human reviews and merges. The loop produces a PR; it does not merge it.

### 6. Sweep

After the merge:

1. **Delete `tasks/T-0xx-slug.md`.** The folder holds only live work. Its history
   is in git and its criteria are in the PR.
2. **Mark the task `done` in `tasks.md`**, with a one-line note of what actually
   happened — especially where reality differed from the brief.
3. **Re-evaluate the queue.** Read back through `tasks.md`:
   - Did this make a later task smaller, larger, or unnecessary? Delete what no
     longer needs doing and say why. A queue nobody prunes stops being read.
   - Did it uncover work not in the queue? Add it, sized small.
   - Did it invalidate an assumption a later task rests on? Rewrite that task now,
     while you still remember why.
   - Did the order change? Something newly cheap may deserve to come first.
4. **Reconcile upward.** `PROGRESS.md` when a group of tasks lands or a known gap
   opens or closes — not every task needs an entry. `geoquizdataplan.md` only
   when the plan's *reasoning* is now wrong, not when a detail changed.

> Deleting the brief in a follow-up commit means a second, tiny PR. If that
> friction gets annoying, delete it in the same PR's final commit instead — the
> brief still reaches the verifier through the branch, and `main` never carries
> a task file at all.

---

## Tasks this loop does not fit

Not every task has testable output, and forcing one to produces green tests that
prove nothing. Three kinds, each verified differently:

| Kind | Examples | How it is verified |
|---|---|---|
| **Decision** | T-010 commit-or-generate the data, T-038 whether to store profiles | A written decision with its reasoning, in `PROGRESS.md` or the plan. Nothing to test |
| **Content and curation** | T-011 review 50 fun facts, T-012–T-014 curated fields | Human reading. A test can check *shape* — every state has a phrase, nothing is empty, no code words like "Köppen" — but not whether the writing is any good |
| **Documentation** | T-002, this file | Human reading, plus a link check |

For these, replace step 4 with an explicit **review checklist** in the brief, and
say in the PR who checked it. Where a shape test is possible, still write it: it
catches the missing fiftieth entry that a human skimming a list will not.

**Decisions that are the user's to make stop the loop.** A task whose criteria
cannot be settled without a product call gets asked, not guessed.

## When reality disagrees with the plan

It will. The plan was written before the code existed, and the first live
Wikidata run corrected three of its assumptions in one afternoon.

1. Do the thing that is actually correct.
2. Say clearly that it diverges, in the commit and the PR.
3. Update `tasks.md` for anything downstream that assumed otherwise.
4. Note it in the plan **only** if the plan's reasoning is now wrong.

The plan earns its place by being trustworthy. Silent edits erode that faster
than open contradictions.

## Definition of done, in one line

**Brief approved, criteria met, independently verified, whole suite green, docs
true, PR merged, brief swept, queue re-evaluated.**
