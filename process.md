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

## Who does what

Three agents, defined in [`.claude/agents/`](.claude/agents/), each owning one
step and deliberately unable to do the others' jobs.

- **`task-expander`** (opus) — turns a queue entry into a brief. Writes only
  `tasks/T-0xx-slug.md`; has no Bash and cannot implement anything.
- **`worker`** (inherits the session model) — implements the approved brief.
  Cannot edit the acceptance criteria.
- **`tester`** (opus) — verifies against the criteria in a fresh session. Cannot
  edit source to make a test pass, and cannot edit the criteria either.

The separation is not ceremony. Each agent is prevented from doing the thing that
would let it grade its own work: the expander has no stake in how hard the
criteria are to satisfy, the worker cannot move the goalposts, and the tester
cannot move the code.

**Choosing the worker's model.** Mechanical tasks — CI config, a scaffold, a
migration that follows an existing pattern — run fine on Sonnet. Anything
touching data correctness, question quality, or a design with more than one
defensible answer wants Opus. The expander and tester stay on Opus: the first
because its output constrains everything downstream and costs few tokens, the
second because weak adversarial reasoning produces tests that pass no matter
what.

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

Write `tasks/T-0xx-slug.md` from [`tasks/TEMPLATE.md`](tasks/TEMPLATE.md). Run
this as the **`task-expander`** agent.

The brief has to stand on its own — the worker and the tester start from it, not
from this conversation. It does not have to *contain* everything: its **Context**
section points at the plan sections, the contract and the source that define what
correct means, and following those links is required, not optional.

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

> **Get the brief approved before writing code.** This is the first human gate in
> the loop, and it is deliberately at the front. Everything downstream —
> implementation, tests, the merge decision — inherits these criteria. Wrong
> criteria produce working software that solves the wrong problem, and the tests
> will happily certify it.

**Once approved, the criteria are frozen.** They change only by coming back
through the expander and being re-approved — never by an edit during
implementation, and never by the tester. Criteria that can be edited by whoever
they judge are not criteria.

### 3. Work

Run this as the **`worker`** agent. Implement inside the brief's scope, following
[`CLAUDE.md`](CLAUDE.md): `uv` and `bun` for packages, **ask before adding a
dependency**, write tests for behaviour worth protecting.

Read the brief's Context links before starting. When the task's *deliverable* is
tests, [`test-guidelines.md`](test-guidelines.md) is your specification rather
than your style guide.

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

Run this as the **`tester`** agent.

**What the verifier may read:** anything committed to the repository — the brief,
the source, existing tests, `geoquizdataplan.md`, `openapi.yaml`, `PROGRESS.md`,
`conventions.md`, `test-guidelines.md`, `CLAUDE.md`. The brief's Context section
is required reading. "Matches the contract" cannot be verified without opening
the contract.

**What it does not get:** the working session's conversation, reasoning or notes.
Nothing that says why a choice was made. The isolation is about not inheriting
the implementer's justifications, not about withholding information.

It reads the implementation only to find entry points and signatures — never to
decide what the expected values are. Expected values come from the criteria. Test
naming should make the mapping obvious, one criterion at a time.

**When the deliverable is itself tests** — T-001, for instance — writing more
tests to check them is circular. Verify by coverage and then by **mutation**:
break each behaviour on purpose, confirm the matching test goes red, and revert
every mutation before reporting. A test that stays green while its subject is
broken is not a test, and mutation is the only way to tell one from
`expect(result).toBeDefined()`.

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

## Where the loop stops for a human

Four moments, and only four. Everything else runs to completion.

1. **Brief approval**, before any code — the highest-leverage minute you will
   spend on the task.
2. **A dependency request.** No agent adds one on its own initiative.
3. **A product decision** an agent may not settle: whether to store children's
   data, whether to commit generated output.
4. **Either the PR, or an escalation** after two failed verify rounds.

A run that reaches none of these between the brief and the PR is the normal case.

## One task at a time

The loop is serial by default. Some tasks have no choice — T-012, T-013 and
T-014 all edit `question-bank/src/curated/us-states.ts`, so running them together
just produces conflicts.

Others genuinely could overlap: T-010 and T-030 touch nothing in common. If
throughput starts to matter, the rule is **parallel only when the briefs'
Constraints sections name disjoint files** — which is another reason to fill that
section in properly.

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
