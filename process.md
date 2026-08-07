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

Four agents, defined in [`.claude/agents/`](.claude/agents/), each owning one
step and deliberately unable to do the others' jobs.

- **`task-expander`** (opus) — turns a queue entry into a brief, opens the branch
  and the draft PR. Writes only `tasks/T-0xx-slug.md` and `tasks.md`; never
  source, tests or configuration.
- **`worker`** (inherits the session model) — implements the approved brief on
  that branch. Cannot edit the acceptance criteria.
- **`tester`** (opus) — verifies against the criteria in a fresh session. Cannot
  edit source to make a test pass, and cannot edit the criteria either.
- **`reviewer`** (opus) — judges quality rather than correctness, marks the PR
  ready, merges inside a narrow envelope or escalates, then sweeps and trims the
  queue. Never reviews work it wrote, because it writes none.

The separation is not ceremony. Each agent is prevented from doing the thing that
would let it grade its own work: the expander has no stake in how hard the
criteria are to satisfy, the worker cannot move the goalposts, the tester cannot
move the code, and the reviewer cannot fix what it finds — findings become tasks.

### What each role needs to do its job

Every role in this loop commits and pushes, so every role holds `Bash`. The
separation is enforced by **what each one is allowed to write**, checked against
the diff at step 6, rather than by withholding git from three of the four. Keep
these tool lists and the table in sync — a role told to do something its tool
list forbids stalls silently, which is how the first version of this flow broke.

| Role | Tools | May write | Must never write |
|---|---|---|---|
| `task-expander` | Read, Grep, Glob, Write, Edit, Bash, PR-open | `tasks/`, `tasks.md`, `PROGRESS.md` | source, tests, config |
| `worker` | Read, Grep, Glob, Write, Edit, Bash | source, tests, the brief's Handoff | acceptance criteria |
| `tester` | Read, Grep, Glob, Write, Edit, Bash | test files, the brief's Verdict | source, acceptance criteria |
| `reviewer` | Read, Grep, Glob, Write, Edit, Bash, PR-ready, PR-merge | `tasks.md`, `PROGRESS.md`, deletes the brief | source, tests |

**No row has the Task tool** — see "Sequential sessions, no subagents" below.

**The expander's Bash is for git only** — `checkout -b`, `add`, `commit`, `push`,
and the PR call. It never runs the build, the test suite or the pipeline. It has
nothing to learn from them: it is writing the definition of done, and knowing
whether the current code passes is exactly the influence the role exists to
exclude. This is a written rule where it used to be a missing tool, so it comes
with a check: **the expander's commit touches only `tasks/`, `tasks.md` and
`PROGRESS.md`**, and the reviewer verifies that at step 6 against the diff. See
`decisions.md` D-7.

### Opening and merging the PR

"PR-open", "PR-ready" and "PR-merge" above are capabilities, not one specific
tool — how you get them depends on where the session runs:

1. **GitHub MCP tools** (`mcp__github__create_pull_request`,
   `mcp__github__update_pull_request`, `mcp__github__merge_pull_request`) when the
   GitHub MCP server is configured. This is the case in Claude Code on the web.
2. **`gh` via Bash** — `gh pr create --draft`, `gh pr ready`, `gh pr merge` — on a
   local machine with the CLI authenticated. `gh` does **not** exist in web
   sessions; do not assume it.
3. **Neither.** Push the branch, print the exact PR title and body, and stop with
   `Next step: human opens the draft PR`. Do not silently skip the PR and do not
   carry on as if it exists — a missing PR is a visible stop, not a shrug.

Whichever route, the branch is pushed first. A PR needs a branch on the remote.

### Sequential sessions, no subagents

Each step is its own top-level session, started by a human, running one agent.
Nothing spawns anything: none of the four has the Task tool, so the constraint
is enforced by their tool lists rather than by good intentions.

**The brief in `tasks/` is the shared state, and there is no second handoff
file.** Sessions do not remember each other, so everything one needs from the
last is in that one file, named for its task — `tasks/T-0xx-slug.md`. Each role
appends its own section and none of them rewrites another's:

| Role | Writes into the brief | Which the next role reads as its handoff |
|---|---|---|
| `task-expander` | Goal, Acceptance criteria, Out of scope, Constraints, Context | the whole brief **is** the handoff to the worker |
| `worker` | `## Handoff` | the tester's only account of what was built |
| `tester` | `## Verdict` | what the reviewer judges, and why |

All three roles also update the header's `Status` and `Next step` and add a row
to the Sessions table. Opening the brief should tell you where the task stands
and which agent to start next, without reconstructing anything.

Two steps in the loop have no agent of their own, by design:

- **Pick and sweep** — `task-expander` does both, at the start of its run. It
  clears the merged brief, updates `tasks.md` and `PROGRESS.md`, then picks the
  next task. Sweeping at the *start* of the next cycle rather than the end of the
  last one means it never gets skipped because everyone went home after the merge.
- **Approve** — you, on the draft PR, before any code is written.

### Survey first, and skip what is already done

Every agent reads the codebase before acting. Work in a brief is sometimes
already finished: a previous task landed it, or the brief was written against a
stale picture.

**Then skip it.** Confirm the criterion genuinely holds, record where the
behaviour lives, and move on. Rebuilding something that already works burns a
cycle and risks breaking it.

T-001 is the live example. The pipeline behaviours it names already exist, so
there is nothing for the worker to implement; its whole contribution is the
survey and a handoff saying so, and the tester writes the tests. A task with no
implementation left is a normal outcome, not a failed run.

**Choosing the worker's model.** Mechanical tasks — CI config, a scaffold, a
migration that follows an existing pattern — run fine on Sonnet. Anything
touching data correctness, question quality, or a design with more than one
defensible answer wants Opus. The expander and tester stay on Opus: the first
because its output constrains everything downstream and costs few tokens, the
second because weak adversarial reasoning produces tests that pass no matter
what.

## After an agent finishes

Every agent ends its session the same way, and this is the part that was wrong
until T-002: **commit, push to the task branch, update `Status` and `Next step`,
stop.** No agent opens a second PR, and no agent starts the next role.

| When this finishes | It leaves behind | You start |
|---|---|---|
| `task-expander` | branch created, brief committed, **draft PR opened**, `Status: awaiting approval` | approve on the PR, then `worker` |
| `worker` | implementation committed to the same branch, Handoff written, `Status: awaiting verification` | `tester` — a **fresh** session |
| `tester` | tests committed to the same branch, Verdict written, `Status: pass` / `fail` / `blocked` | `reviewer` on pass · `worker` on fail · `task-expander` on blocked |
| `reviewer` | sweep committed, PR marked ready, merged or escalated | the next task |

**One task, one branch, one PR, several commits.** The PR is opened at expand
time and stays draft until the tester passes, so every role's work lands in the
same reviewable place and the history shows who did what. A task never produces a
second PR — if you find yourself opening one, a step ran out of order.

**The branch is named for the task: `task/T-0xx-slug`**, matching the brief's
filename. A branch that outlives its task is how T-001 and T-002 ended up sharing
`claude/frontend-restructure-openapi-0xp57z` across four PRs, which is the thing
this rule exists to stop. When the task merges, the branch is done — the next
task branches from the default branch, never from the last task's branch.

Each role's commit message says which role wrote it: `T-002 worker: …`. The
history is then a readable record of the loop, and the reviewer can check at a
glance that four roles actually ran.

## The loop

```
tasks.md
   │
   ├─▶ 1. pick          first task whose dependencies are done
   │
   ├─▶ 2. expand        branch, write the brief, commit, push,
   │                    open a DRAFT PR — one task, one branch, one PR
   │                    ── human approves on the PR ──
   │
   ├─▶ 3. work          survey first, skip what is done, implement the rest
   │                    write ## Handoff — always, even if nothing was built
   │
   ├─▶ 4. verify        FRESH SESSION, no working context:
   │                      writes tests from the acceptance criteria
   │                      runs them
   │        │
   │        ├── fail (code wrong) ─────────▶ back to 3
   │        ├── criteria wrong or untestable ▶ back to 2
   │        └── pass ─▶
   │
   ├─▶ 5. ship          mark the PR ready for review
   │
   └─▶ 6. review        reviewer judges quality, then either
                          merges — only inside a narrow envelope — or escalates
                        then sweeps: delete brief, mark done, trim the queue

   one agent per session · nothing spawns anything · the brief carries the state
   every agent ends the same way: commit, push, update Status, stop
```

---

### 1. Pick

Take the **first task in [`tasks.md`](tasks.md) whose dependencies are done**.
Order is a judgement already made — don't re-litigate it per task. Skip a task
only when it is genuinely blocked, and write down what blocks it.

One task at a time. Two half-finished tasks are worth less than one finished one.

### 2. Expand

Run this as the **`task-expander`** agent, in this order:

1. Sweep the last cycle if the reviewer did not — `tasks/` should be empty.
2. Branch from the current default branch: `git checkout -b task/T-0xx-slug`.
3. Write `tasks/T-0xx-slug.md` from [`tasks/TEMPLATE.md`](tasks/TEMPLATE.md).
4. Commit and push: `git push -u origin task/T-0xx-slug`.
5. **Open a draft PR** with the acceptance criteria as its body, by whichever
   route from "Opening and merging the PR" above is available.
6. Set `Status: awaiting approval`, `Next step: worker`, `Approved: pending`, add
   the Sessions row, and stop.

Opening the PR here rather than at the end gives approval somewhere durable to
live — a PR review or comment, rather than a line in a chat log — and gives the
worker and tester one place to push to.

The expander's commit contains the brief and nothing else. If its diff touches
source, tests or configuration, the role has overstepped and the reviewer will
say so at step 6.

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

> **Get the brief approved before writing code, and record it in the brief.** The
> header carries an `Approved:` line — `pending` until a human replaces it with
> their name and the date. The worker refuses to start while it says `pending`.
> Approval that lives only in a chat transcript cannot be checked afterwards by
> anyone, including the people who gave it.
>
> This is the first human gate in the loop, and it is deliberately at the front. Everything downstream —
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

**Write the `## Handoff` section before stopping — always, even when you built
nothing.** The tester starts cold and cannot ask you anything; the handoff is the
entire conversation between the two of you. A missing handoff is a broken loop,
and the tester is told to refuse the run rather than reconstruct one from a diff.

You may write tests as you go — you should, for anything you are unsure of. That
does not replace step 4: your tests know what you built, and the point of step 4
is a check that does not.

### 4. Verify — in a fresh session

Hand off to a **new session with no memory of the work**. That isolation is the
mechanism: a verifier who watched the implementation being written tends to test
what was built rather than what was asked for.

Run this as the **`tester`** agent, **in a session that has not already run
another role on this task.** The brief's Sessions table records which session ran
what; the tester checks it against `$CLAUDE_CODE_REMOTE_SESSION_ID` and refuses if
it finds itself already listed as `worker`.

That check exists because the separation is otherwise invisible. A tester running
in the worker's session produces a verdict that looks exactly like a real one, and
the failure is silent — which is the same shape as every other bug this project
worries about.

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

The PR already exists — it was opened draft at step 2 and has been collecting
commits since. Shipping means **marking it ready for review** and bringing its
body up to date.

The body carries the acceptance criteria **verbatim**, with what verified each.
This is deliberate: step 6 deletes the brief, and the PR then becomes the
permanent record of what "done" meant. Also say what you chose not to do, and why
any decision could reasonably have gone the other way.

### 6. Review, merge, sweep

Run this as the **`reviewer`** agent. It is the only step that both judges and
tidies, and it does them in that order.

**First, check the PR is still open.** If it was merged without waiting for the
reviewer, the sweep cannot ride inside it: branch from the default branch, open
the sweep as its own small PR, and say in it that the review happened after the
merge. Review anyway — findings just become tasks instead of review comments.

**Review** is about quality, not correctness — the tester already settled
correctness. Does it fit the codebase, is it more than the brief asked for, did
anything land outside the Constraints, are the docs still true. Findings that do
not block the merge become new entries in `tasks.md`; the reviewer never fixes
them itself.

**Merge only inside the envelope**: tester passed, suite green, nothing outside
the brief's Constraints, no new dependency, nothing touching `openapi.yaml`, a
migration or the plan, and **no text a child will read**. Anything else escalates
to you, and escalating is a normal outcome rather than a failure. Content for
children always comes to a human — a test can confirm its shape, only a person
can confirm its substance.

**Then sweep — before merging, in the PR's own branch.** The bookkeeping ships
with the work it describes, so `main` never carries a brief for something already
released and there is no follow-up PR for three line changes.

1. **Delete `tasks/T-0xx-slug.md`.** The folder holds only live work. Its history
   is in git and its criteria are in the PR.
2. **Delete the task's entry from `tasks.md`** — do not mark it done. A queue that
   accumulates finished entries is one nobody scrolls to the bottom of. Nothing is
   lost: the criteria are in the PR, the summary goes to `PROGRESS.md`, and git
   holds the rest.
3. **Add a line to `PROGRESS.md` under "Completed tasks"** — the id, one sentence
   on what actually landed, and the PR number. Say where reality differed from
   the brief; that is the part worth reading later.
4. **Re-evaluate the queue.** Read back through `tasks.md`:
   - Did this make a later task smaller, larger, or unnecessary? Delete what no
     longer needs doing and say why. A queue nobody prunes stops being read.
   - Did it uncover work not in the queue? Add it, sized small.
   - Did it invalidate an assumption a later task rests on? Rewrite that task now,
     while you still remember why.
   - Did the order change? Something newly cheap may deserve to come first.
4. **Reconcile upward.** `PROGRESS.md` when a group of tasks lands or a known gap
   opens or closes — not every task needs an entry. `geoquizdataplan.md` only
   when the plan's *reasoning* is now wrong, not when a detail changed.

> Sweeping inside the PR is what removed the old friction: no second PR to delete
> the brief, and no window where `main` carries a brief for work that already
> shipped. See `decisions.md` D-4.
>
> Note the consequence for the merge envelope: a swept PR **always** touches
> `tasks.md` and `PROGRESS.md`, which no brief lists in its Constraints. Those two
> files, plus deleting the brief itself, are expected sweep changes and are not
> the "changed outside Constraints" signal that blocks a merge.

---

## Where the loop stops for a human

Four moments, and only four. Everything else runs to completion.

1. **Brief approval** on the draft PR, before any code — the highest-leverage
   minute you will spend on the task.
2. **A dependency request.** No agent adds one on its own initiative.
3. **A product decision** an agent may not settle: whether to store children's
   data, whether to commit generated output.
4. **An escalation** — from the reviewer when the merge falls outside its
   envelope, or from the tester after two failed verify rounds.

A run that reaches only the first is the normal case: approve at step 2, and the
next thing you hear is that it merged.

## One task at a time

The loop is serial by default. Some tasks have no choice — T-012, T-013 and
T-014 all edit `question-bank/src/curated/us-states.ts`, so running them together
just produces conflicts.

Others genuinely could overlap: T-010 and T-030 touch nothing in common. If
throughput starts to matter, the rule is **parallel only when the briefs'
Constraints sections name disjoint files** — which is another reason to fill that
section in properly.

## The light path, for S-sized tasks

The full loop costs four sessions, a human approval, and a brief, and T-001 spent
all of that to add 19 tests to code that already worked. That ratio is wrong for
small work, and the honest fix is a documented shortcut rather than quietly
skipping steps.

**A task marked `S` may run light**, which means a **shorter brief, not no
brief**. `tasks/T-0xx-slug.md` still exists and is still named for its task —
that file is where every role after the expander looks, and T-002 showed what
happens when it is missing: approval, handoff and the Sessions log each had to be
re-homed mid-task, and the guarantee that the tester ran in a fresh session
quietly lost its only evidence.

A light brief keeps four things and drops the rest:

- **Acceptance criteria** — a short numbered list, four at most.
- **Approved** — the header line, `pending` until a human replaces it.
- **Sessions** — three columns. This is what makes the independent tester session
  checkable, and it was never the expensive part of a brief.
- **Handoff** and **Verdict** — appended by the worker and tester as usual.

Dropped: Goal, Out of scope, Constraints, Context. For work that fits in an hour
and touches one file, those sections restate the title.

**The tester still runs in its own session.** This is the one step the light path
never drops, because it is the only independent signal in the loop.

**The light path is not available** when the task touches `openapi.yaml`, a
database migration, `geoquizdataplan.md`, or any text a child will read — or when
its criteria run past four. Those are exactly the tasks where the brief's Out of
scope and Constraints sections earn their cost.

If a light task turns out to need more than four criteria once you start writing
them, that is the signal to stop and expand it properly.

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
