# Process

How work moves through this repo. One task at a time, expanded into a brief,
built, verified by someone who did not build it, swept up, and handed to a
person to merge.

The documents this loop runs on:

- [`geoquizdataplan.md`](geoquizdataplan.md) — why the app works the way it does
- [`PROGRESS.md`](PROGRESS.md) — where the project stands, coarse grained
- [`tasks.md`](tasks.md) — the queue of small, independent, ordered tasks
- [`tasks/`](tasks/) — the brief for the task currently being worked
- [`test-guidelines.md`](test-guidelines.md) — how tests get written here
- [`CLAUDE.md`](CLAUDE.md) — the repo's standing rules
- [`conventions.md`](conventions.md) — code conventions and commands
- [`runs/`](runs/) — the run log for each orchestrated task

## Who does what

Five agents, defined in [`.claude/agents/`](.claude/agents/). Four own one step
each and are deliberately unable to do the others' jobs; the fifth drives them.

- **`task-expander`** (opus) — turns a queue entry into a brief, opens the branch
  and the draft PR. Writes only `tasks/T-0xx-slug.md`, `tasks.md` and
  `PROGRESS.md`; never source, tests or configuration.
- **`worker`** (inherits the session model) — implements the approved brief on
  that branch. Cannot edit the acceptance criteria.
- **`tester`** (opus) — verifies against the criteria in a fresh session. Cannot
  edit source to make a test pass, and cannot edit the criteria either.
- **`reviewer`** (opus) — judges quality rather than correctness. On approve it
  sweeps, then marks the PR ready for a person to merge, flagging it when the
  change falls outside a narrow envelope;
  otherwise it leaves the PR draft and names the agent that has to come back.
  Never reviews work it wrote, because it writes none.
- **`orchestrator`** (inherits) — optional, and a **relay rather than a
  manager**. Reads the brief's `Next step`, spawns that role with a fixed
  prompt, copies what it returned into `runs/T-0xx-slug.md` verbatim, repeats.
  It judges nothing and **reads no work** — not the diff, not the Handoff, not
  the criteria. Runs one task and never picks the next. See `decisions.md` D-1.

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
| `reviewer` | Read, Grep, Glob, Write, Edit, Bash, PR-ready, PR-open | `tasks.md`, `PROGRESS.md`, deletes the brief | source, tests, **the merge** |
| `orchestrator` | Read, Write, Edit, Bash, **Task** | `runs/`, the brief's `Approved:` line | source, tests, criteria, any role's signed section |

**Only the orchestrator has the `Agent` tool**, and only so it can spawn the other
four — see "Spawning, and the isolation it must not cost" below. The four step
roles still cannot spawn anything, so a worker can never call a tester.

**The orchestrator's list is short on purpose.** No `Grep`, no `Glob`, no PR
tools: it has no business searching the codebase or touching a PR, and a tool it
does not hold is a temptation it does not have.

**The expander's Bash is for git only** — `checkout -b`, `add`, `commit`, `push`,
and the PR call. It never runs the build, the test suite or the pipeline. It has
nothing to learn from them: it is writing the definition of done, and knowing
whether the current code passes is exactly the influence the role exists to
exclude. This is a written rule where it used to be a missing tool, so it comes
with a check: **the expander's commit touches only `tasks/`, `tasks.md` and
`PROGRESS.md`**, and the reviewer verifies that at step 6 against the diff. See
`decisions.md` D-7.

### Opening and merging the PR

"PR-open" and "PR-ready" above are capabilities, not one specific
tool — how you get them depends on where the session runs:

1. **GitHub MCP tools** (`mcp__github__create_pull_request`,
   `mcp__github__update_pull_request`) when the
   GitHub MCP server is configured. This is the case in Claude Code on the web.
2. **`gh` via Bash** — `gh pr create --draft`, `gh pr ready` — on a
   local machine with the CLI authenticated. `gh` does **not** exist in web
   sessions; do not assume it.
3. **Neither.** Push the branch, print the exact PR title and body, and stop with
   `Next step: human opens the draft PR`. Do not silently skip the PR and do not
   carry on as if it exists — a missing PR is a visible stop, not a shrug.

Whichever route, the branch is pushed first. A PR needs a branch on the remote.

The reviewer holds "PR-open" as well, for one case only: a PR merged before it
ran, where the sweep cannot ride inside the merge and needs its own small PR.

**No role holds PR-merge.** Merging is Dkaattae's — `decisions.md` D-4.

### Spawning, and the isolation it must not cost

**Three ways to run the loop, and the brief is the shared state in all of them.**
[`.claude/agents/README.md`](.claude/agents/README.md) charts all three side by
side, along with what a subagent does and does not isolate.

**Manually** — each step is its own top-level session, started by a human,
running one agent. None of the four step roles has the `Agent` tool, so a worker
cannot call a tester. This is the default, and the only way that keeps a person
at the step-2 gate.

**Driven** — [`.claude/loop/run-loop.sh`](.claude/loop/run-loop.sh) invokes
`claude -p --agent <role>` once per step, on a local machine. **There is no model
in the driver**, so there is nothing in it to drift, and it mints a fresh
`--session-id` per step.

**Relayed** — one `orchestrator` session spawns the four in order with the Task
tool. It is the only role that has it, and the only option where no shell is
available to leave running — Claude Code on the web.

**Prefer the driver where you have the choice.** Same six gates, but enforced by
`bash` rather than by an agent's willingness to enforce them against itself, and
two things the agent cannot offer: a per-step spend cap the CLI enforces, and the
independence check below working on evidence rather than on a claim. See
[`.claude/loop/README.md`](.claude/loop/README.md), "Which one to use".

What has to survive is the **tester's independence**, and it survives differently
in each. Run manually or under the driver, the tester is a separate session and
can inherit nothing — and under the driver the session ids differ, so the
Sessions-table check still *proves* it. Spawned by the orchestrator, it gets a
**fresh context window** — it never sees the worker's transcript — so it inherits
exactly and only the text of its prompt, but every subagent shares one session id
and the check degrades to attestation.

**Which makes the orchestrator's prompt the only attack surface, and the answer
is to keep it empty.** Not a rule about restraint — rules like that hold until
the one time an extra sentence looks genuinely helpful. Instead:

- **The orchestrator reads the brief's header and nothing else.** No diff, no
  Handoff, no criteria. It cannot leak an opinion about the implementation
  because it never forms one.
- **The spawn prompt is a template with four slots** — role, task id, brief path,
  branch — and no free-text field. There is nowhere for a helpful sentence to go.
- **What a role returns is copied to `runs/` verbatim and never quoted into a
  prompt.** One-way valve.

**Two things break under a relayed run, and both are named rather than papered
over.** The Sessions-table check stops working, because every spawned role shares
one session id — the tester is told not to refuse on that, not to claim the check
passed, and to say in its Verdict which kind of independence it actually had. And
a spawned role **cannot ask a human a question**; it can only return text. So it
writes the question into the brief, sets `Status: blocked`, and stops, and the
orchestrator halts rather than answering on anyone's behalf. See `decisions.md`
D-3 and "Known weaknesses".

**The brief in `tasks/` is the shared state, and there is no second handoff
file.** The orchestrator's `runs/T-0xx-slug.md` is a record of what happened, not
state: nothing reads it to decide what runs next. Sessions do not remember each
other, so everything one needs from the last is in that one file, named for its
task — `tasks/T-0xx-slug.md`. Each role
appends its own section and none of them rewrites another's:

| Role | Writes into the brief | Which the next role reads as its handoff |
|---|---|---|
| `task-expander` | Goal, Acceptance criteria, Out of scope, Constraints, Context | the whole brief **is** the handoff to the worker |
| `worker` | `## Handoff` | the tester's only account of what was built |
| `tester` | `## Verdict` | what the reviewer judges, and why |

All three roles also update the header's `Status` and `Next step` and add a row
to the Sessions table. Opening the brief should tell you where the task stands
and which agent to start next, without reconstructing anything.

Three steps in the loop have no agent of their own, by design — two fold into a
neighbouring role's session, and one is yours:

- **Ship** — `reviewer` marks the PR ready, but only on approve, at the end of
  its run rather than the start.
- **Pick and sweep** — `task-expander` does both, at the start of its run. It
  clears the swept brief, updates `tasks.md` and `PROGRESS.md`, then picks the
  next task. Sweeping at the *start* of the next cycle rather than the end of the
  last one means it never gets skipped because everyone went home after the merge.
- **Approve** — you, on the draft PR, before any code is written. Under the
  `orchestrator` this step is not delegated, it is skipped, and the brief says so.

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

**Pushing is not the last step — confirming the push landed is.** The branch you
pushed to has to be the one in the brief's `Branch:` header, which is the one the
PR is built from. Check it (`git log origin/<brief-branch> -1`, or read the PR's
file list) and say so when you stop. "Committed and pushed" was true of T-003's
worker and still left the work invisible to everyone downstream.

| When this finishes | It leaves behind | You start |
|---|---|---|
| `task-expander` | branch created, brief committed, **draft PR opened**, `Status: awaiting approval` | approve on the PR, then `worker` |
| `worker` | implementation committed to the same branch, Handoff written, `Status: awaiting verification` | `tester` — a **fresh** session |
| `tester` | tests committed to the same branch, Verdict written, `Status: pass` / `fail` / `blocked` | `reviewer` on pass · `worker` on fail · `task-expander` on blocked |
| `reviewer` — approve | PR marked ready, sweep committed, flagged if outside the envelope | a person merges |
| `reviewer` — changes needed | PR left draft, findings commented, `Status: changes requested` and `Next step:` naming the agent | that agent, on the same branch |
| `orchestrator` | run log committed, whichever of the above it last relayed | nothing — it stops. The next task is a new run |

**Under the orchestrator, "you start" in the table above means it spawns that
role** — every one of them fresh, with the brief path and the branch and nothing
else. It does not read what the last role left behind; it reads `Next step` and
relays.

**One task, one branch, one PR, several commits.** The PR is opened at expand
time and stays draft until the reviewer approves it, so every role's work lands in the
same reviewable place and the history shows who did what. A task never produces a
second PR — if you find yourself opening one, a step ran out of order.

**The branch is named for the task: `task/T-0xx-slug`**, matching the brief's
filename. A branch that outlives its task is how T-001 and T-002 ended up sharing
`claude/frontend-restructure-openapi-0xp57z` across four PRs, which is the thing
this rule exists to stop. When the task merges, the branch is done — the next
task branches from the default branch, never from the last task's branch.

### When the environment names the branch for you

Some sessions run under a harness that **assigns a branch per session** and
forbids pushing anywhere else — Claude Code on the web does exactly this. Then
`task/T-0xx-slug` is not available, and the harder problem is that **each role
gets a different branch**, so "the worker and tester push to the expander's
branch" quietly stops being possible.

**The brief's `Branch:` header is the authority — not the naming convention.**
Whatever branch the expander actually pushed and pointed the PR at *is* the task
branch, whatever it happens to be called. The `task/T-0xx-slug` name is the
default when the session is free to choose one, not a requirement.

So, in order:

1. **The expander records the real branch.** Whatever it ended up on, that name
   goes in the brief's `Branch:` header, and the PR is opened against it.
2. **Every later role checks before it starts.** Compare
   `git branch --show-current` against that header. Matching is the normal case
   and needs no comment.
3. **If they differ, push to the header's branch anyway.** `CLAUDE.md`
   "Branches" carries a standing permission from Dkaattae covering exactly this,
   so the harness's "not without explicit permission" is already satisfied and
   nobody has to grant it again per session. The header is where the PR looks.
4. **Stop only if that push is refused**, or the header is missing or ambiguous.
   Then say which two branches disagree, set `Status: blocked` and
   `Next step: human`, and do not push anywhere else. Committing work to a
   session branch and hoping somebody finds it is the failure mode this rule
   exists to prevent — see below.

**T-003 is the worked example.** The expander ran on
`claude/t002-sweep-t003-expand-ibrpor` and opened PR #11 against it. The worker
ran on `claude/worker-t003-i1kbih`, a different branch, and pushed a complete,
working CI workflow there. PR #11 never saw it. Nothing errored: the worker's own
check was "does the task branch exist?", and the branch it was standing on did
exist — just not the right one. The task stalled with its code one branch away
from its own PR, and because criteria 1–6 are verified by observing workflow
runs, the tester could not run at all.

Recovery is cheap the moment it is noticed — cherry-pick onto the brief's branch
and force the PR to catch up. It is expensive when it is not, because every
downstream role reads a PR that is missing the work and draws conclusions from
the gap.

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
   ├─▶ 5. ship          on approve, reviewer marks the PR ready
   │                    (same session as step 6 — its outcome, not its start)
   │
   └─▶ 6. review        reviewer judges quality, then either
                          changes needed ─▶ PR stays DRAFT, comment,
                          │                 brief names the agent to fix it
                          │                 ──▶ back to 3, 4 or 2
                          └ approve ──────▶ sweep, PR marked READY,
                                            flagged if outside the envelope
                                            ──▶ a person merges

   the brief carries the state · every agent ends the same way:
   commit, push, update Status, stop
   run manually, one agent per session — or relayed by the orchestrator,
   which reads Next step, spawns that role blind, and runs ONE task
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
2. Branch from the current default branch: `git checkout -b task/T-0xx-slug` —
   or use the branch this session was assigned, where the environment assigns
   one. See "When the environment names the branch for you" above.
3. Write `tasks/T-0xx-slug.md` from [`tasks/TEMPLATE.md`](tasks/TEMPLATE.md), and
   **put the branch you actually used in its `Branch:` header**. That line is how
   every later role finds where to push.
4. Commit and push: `git push -u origin <that branch>`.
5. **Open a draft PR against that branch**, with the acceptance criteria as its
   body, by whichever route from "Opening and merging the PR" above is available.
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

Run this as the **`reviewer`** agent, in the same session that does step 6. Step
5 has no session of its own, and it is **not** the first thing that session does:
the PR stays draft through the review and is marked ready only if the review
approves it. Draft is how the loop shows, at a glance, that a PR still owes
somebody work.

Shipping is therefore the *outcome* of step 6's judgement, not a precondition
for it: **approve → mark ready for review** and bring the body up to date.

The body carries the acceptance criteria **verbatim**, with what verified each.
This is deliberate: step 6 deletes the brief, and the PR then becomes the
permanent record of what "done" meant. Also say what you chose not to do, and why
any decision could reasonably have gone the other way.

### 6. Review, sweep, hand over

Run this as the **`reviewer`** agent. It is the only step that both judges and
tidies, and it does them in that order.

**First, check the PR is still open.** If it was merged without waiting for the
reviewer, the sweep cannot ride inside it: branch from the default branch, open
the sweep as its own small PR, and say in it that the review happened after the
merge. Review anyway — findings just become tasks instead of review comments.

**Second, check the PR actually contains every role's work.** Read the brief's
Sessions table, then the PR's commits: a role that has a row but no commit means
its work is stranded somewhere else, and reviewing the PR in front of you would
be reviewing an incomplete task. This is the backstop for the branch mismatch
above — the reviewer is the last role that can catch it before a half-task
merges. Send it back to that role, naming the branch its commit is actually on.

**Review** is about quality, not correctness — the tester already settled
correctness. Does it fit the codebase, is it more than the brief asked for, did
anything land outside the Constraints, are the docs still true. The reviewer
never fixes what it finds.

**Then the review ends one of two ways**, and the PR's draft flag says which:

| Verdict | The PR | The record | The brief |
|---|---|---|---|
| **Approve** | marked **ready for review** | body updated with the criteria and what verified each | swept, then handed to a person |
| **Changes needed** | **stays draft** | a comment listing the findings, each with file, line, and what would make it acceptable | `Status: changes requested`, `Next step:` the agent that must fix it, findings in a `## Review` section |

Sending it back names an agent — `worker` for the implementation, `tester` for
the tests, `task-expander` for the criteria — because the next session starts
cold and the brief is the only thing it reads. **Do not sweep a PR you sent
back**: the task is not done, and deleting the brief would take the findings with
it. Findings that do *not* block become entries in `tasks.md` instead.

Sending back is not the same as escalating. Sent back means an agent still owes
the work; escalated means the work is fine but the merge is not the reviewer's to
make. Escalation happens on an approved, ready PR.

**Flag for a decision outside the envelope**; inside it, mark ready with no note.
The envelope: tester passed, suite green, nothing outside
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
5. **Reconcile upward.** `PROGRESS.md` when a group of tasks lands or a known gap
   opens or closes — not every task needs an entry. `geoquizdataplan.md` only
   when the plan's *reasoning* is now wrong, not when a detail changed.

> Sweeping inside the PR is what removed the old friction: no second PR to delete
> the brief, and no window where `main` carries a brief for work that already
> shipped. See `decisions.md` D-4.
>
> Note the consequence for the envelope: a swept PR **always** touches
> `tasks.md` and `PROGRESS.md`, which no brief lists in its Constraints. Those two
> files, plus deleting the brief itself, are expected sweep changes and are not
> the "changed outside Constraints" signal that flags a PR for a decision.

---

## Where the loop stops for a human

Four moments, and only four. Everything else runs to completion.

**Under the `orchestrator`, moment 1 does not move — it disappears.** Nobody
approves the brief; the orchestrator records `Approved: orchestrator — <date>,
unattended run` without having read the criteria, because reading them is exactly
what keeps it safe (D-3). That is the entire cost of a relayed run, and it is
written into the brief rather than disguised.

**Moments 2, 3 and 4 are unchanged**, but they arrive differently: a spawned role
cannot ask you anything, so instead of a question it writes the question into the
brief, sets `Status: blocked`, and stops. The orchestrator halts and quotes it.
You answer, and restart the run. The reviewer's envelope (D-4) does not widen — a
relayed run merges exactly the same set of changes unattended as a manual one,
which since D-4's amendment is none: **every run ends at a PR waiting for you.**

1. **Brief approval** on the draft PR, before any code — the highest-leverage
   minute you will spend on the task.
2. **A dependency request.** No agent adds one on its own initiative.
3. **A product decision** an agent may not settle: whether to store children's
   data, whether to commit generated output.
4. **An escalation** — from the reviewer when the change falls outside its
   envelope, or from the tester after two failed verify rounds.

A run that reaches only the first is the normal case: approve at step 2, and the
next thing you hear is that a PR is ready for you.

### When a run stops for you

**Nothing is left running, and that is the thing to understand.** A subagent that
returns has ended and its context is gone; a driver that halts has exited. There
is no process waiting on your answer, no timer counting how long you took, and
nothing that will nudge you on its own.

So the notice is raised by the last thing that happens by itself: **the push.**
[`.github/workflows/blocked-run-notice.yml`](.github/workflows/blocked-run-notice.yml)
reads the pushed brief's header, and when a task is waiting on a person it labels
the PR **`waiting on a human`** and comments once. GitHub's normal notifications
do the rest.

- **The label is the state**, so later pushes while still blocked stay quiet. The
  comment fires on the transition in, and the label clears itself on the way out.
- **The comment links to the brief; it does not repeat the question.** One copy,
  in the file the next agent will read. Two copies is how they come to disagree.
- **It is a `grep`, not a judge.** It reads `Status`, `Next step` and `Fault:` and
  never the work — the same rule the orchestrator follows, for the same reason.

**Answering does not resume anything**, because there is nothing to resume. The
brief is the resume point:

1. Answer in the brief, where the question is.
2. Set `Next step` back to the role that should carry on.
3. Commit, and start a run.

A **fresh** agent reads the brief including your answer. It never saw the session
that asked, which is exactly the property that makes the tester's verdict worth
something — see [`.claude/agents/README.md`](.claude/agents/README.md).

## One task at a time

**The `orchestrator` runs exactly one task and stops** — it never picks the next
one, however obvious the queue looks. Unattended, the loop has no human
checkpoint anywhere in it, and nothing here is built to catch what that gets
wrong on the ninth task.

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
- **The header**, whole — `Status`, `Next step`, `Approved` (`pending` until a
  human replaces it), `Branch` and `PR`. None of it is prose and all of it is
  load-bearing: `Branch` is where the next role pushes, and getting it wrong
  strands a commit (D-8).
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
true, PR ready and swept, queue re-evaluated, waiting on your merge.**
