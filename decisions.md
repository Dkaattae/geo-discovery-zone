# Decisions

Choices about how this project is built, why they went the way they did, and
what would make them worth revisiting. Kept separate from
[`geoquizdataplan.md`](geoquizdataplan.md), which is about the *product*.

Add an entry when a decision could reasonably have gone the other way. A
decision with no trigger for revisiting is a habit, not a decision.

---

## D-1 — An orchestrator, and it is a relay rather than a manager

**Superseded 2026-08-24.** This entry used to read "No orchestrator agent".

**Decided:** a fifth agent, `orchestrator`, relays a single task between the
other four. It reads the brief's header, spawns the role that `Next step` names,
copies what that role returned into `runs/T-0xx-slug.md` verbatim, and repeats.

**It judges nothing and reads no work.** Not the diff, not the `## Handoff`, not
the acceptance criteria. Its entire input is the first twenty lines of the brief.

**What the original entry argued**, and what changed:

- *"It would either spawn subagents — ruled out, see D-3."* D-3 is rewritten.
  The isolation it protected survives, and for a sharper reason than expected —
  see there.
- *"It would be a shell script that reads `Next step` and invokes
  `claude --agent <name>`. Fifteen lines, no model, no drift."* **That script was
  written, and it is kept** — `.claude/loop/run-loop.sh`. It came out at 500
  lines because the gates turned out to be the whole value, but the prediction
  was right about the important part: there is no model in it, so there is
  nothing in it to drift. **It is the preferred way to run the loop.** The agent
  exists for the environment the script cannot run in — Claude Code on the web,
  where there is no shell to leave running.
- *"Or read the brief and announce which agent runs next, which is one line of a
  file you can read yourself."* **This is exactly what it does, and the entry was
  right that it is one line.** What it missed is that reading that line is not the
  cost — *being present to act on it* is. The gap being closed is a human waiting
  to type the next command, four times a task, which is neither judgement nor
  work.
- *"Somewhere for state to go stale."* Answered by making `runs/` a record that
  nothing reads back. The brief header stays the only state.
- *"It would add a session and a model call."* It does, and it buys removing
  three waits for a person.

**A first draft of this role judged each agent's output** — read the diff, decided
whether the work was good enough, sent roles back. That was scrapped before it
ran. It was redundant, because the tester already judges the worker and the
reviewer judges everything; a third opinion formed from the same diff is a
correlated one, not an extra check. And it was dangerous, for the reason in D-3.
The role got thinner rather than smarter, which is the direction to keep pushing
it.

**What is genuinely given up:** the human approval gate at step 2. The
orchestrator writes `Approved: orchestrator — <date>, unattended run`, which is
not a certification — it has not read the criteria — but a record that nobody
checked them. That is the honest version of the trade and it is written into the
brief where a reader will find it. See "Known weaknesses".

**What is not given up:** a dependency request and a product decision still stop
for a person. The reviewer's merge envelope (D-4) is unchanged.

**Why one task.** Unattended, the loop has no human checkpoint anywhere in it.
The expensive failure is not one bad task; it is nine built on a misread of the
first, none of which anybody looked at.

**Two implementations, one loop, and that is not duplication.** Both enforce the
same six gates and write the same `runs/` format; they differ in what can enforce
them. The script's gates are `case` statements and cannot be reasoned around; the
agent's are instructions it must apply to itself. Where both can run, run the
script. The place to watch for drift is the pair going out of sync — a gate added
to one and not the other — which is why they are listed side by side in
`.claude/loop/README.md` rather than described separately.

**Revisit when** `runs/` shows how often a run halts for a human. If it halts
constantly, the gate was load-bearing and belongs back at step 2. If it never
halts, check that the roles are actually raising questions rather than guessing
past them — a run that never needs anyone is the outcome to be most suspicious
of, not the one to celebrate.

---

## D-2 — The queue stays in `tasks.md`; briefs stay in `tasks/`

**Decided:** markdown, not Jira, not GitHub Issues — for now.

The queue and the brief have different needs, and it is worth separating them
before choosing a tool.

**The queue is a planning artifact.** You want to see all of it at once, reorder
it, prune it, and diff it. A markdown list is genuinely good at that; issue
trackers are not. Thirty open issues with no order and no diff is how a queue
stops being re-evaluated — and re-evaluation is the step that keeps it honest.

**The brief is a work artifact** with a lifecycle: created, worked, verified,
closed. That *is* what an issue tracker is for, and moving briefs to GitHub
Issues would buy real things: `Closes #12` makes the sweep automatic, comments
give handoff and verdict a timestamped append-only home, and the brief stops
being tied to a branch checkout.

It would also cost real things: every agent needs GitHub access, so the loop
gains a network dependency and behaves differently in environments where that
access is uneven; the brief leaves the repo, so it no longer appears in a PR
diff for review; and "criteria frozen once approved" becomes a convention rather
than something visible in git history.

**Revisit when** either of these becomes true:

- more than one person or session works the queue concurrently — file-based
  state is single-writer and will bite;
- the sweep friction actually costs something. Today the reviewer sweeps inside
  the PR, before merging (D-4), which removes most of it.

The migration is cheap when you want it: the brief template maps one-to-one onto
an issue body, and `tasks.md` can keep the ordering as a list of issue links.
Do not pay for it before the loop has run.

---

## D-3 — One agent per step; only the orchestrator spawns, and it spawns blind

**Amended 2026-08-24.** This entry used to read "Sequential sessions, no
subagents" and forbade the spawn tool outright.

**Decided:** the four step roles still spawn nothing. The `orchestrator` (D-1)
has the `Agent` tool and is the only role that does.

**What the original entry got right and kept:** "a tester spawned by the worker
inherits its framing, which is the exact failure the separation exists to
prevent." Still true, still forbidden.

**Verified 2026-08-25, and it constrains how the orchestrator can be launched.**
Spawning was probed directly rather than assumed:

| The orchestrator is… | Spawn tool it receives | Result |
|---|---|---|
| **spawned as a subagent** by another session | **none — stripped** | cannot run at all |
| **the top-level session** (`claude -p --agent orchestrator`) | `Agent` | a real `worker` spawn returned |

So **the orchestrator has to be the session, not something a session spawns.**
Nesting is one level deep in this harness: a top-level agent may spawn, and what
it spawns may not. That is the same limit that stops a worker calling a tester,
arriving from the harness rather than from our rules — convenient here, but not
ours to rely on staying.

The tool is named **`Agent`**, not `Task`; the frontmatter accepted `Task` and
granted `Agent` anyway, which is the kind of quiet mismatch worth writing down
rather than leaving for whoever reads the file next.

**Still unverified:** whether a Claude Code *web* session can be started as the
orchestrator at all. If it cannot, the agent is unusable in the one environment
it was written for, and `run-loop.sh` is not merely preferred but the only path.
Test that before relying on an unattended web run.

**What the original entry missed:** a spawned agent gets a **fresh context
window**. The tester does not see the worker's transcript; it inherits exactly
and only the text of its prompt. Worker-spawns-tester leaks because the worker's framing is the only
thing it can write. An orchestrator that has never read the work has nothing to
leak.

So the protection is not a rule about what the orchestrator may pass on — rules
like that are obeyed until the one time a sentence seems genuinely helpful.
It is **structural ignorance plus a fixed template**:

- The orchestrator reads the brief's header and nothing else. It never loads the
  diff, the Handoff, or the criteria.
- Its spawn prompt has **four substitution slots** — role, task id, brief path,
  branch — and no free-text field. There is nowhere for a helpful sentence to go.
- What a role returns is copied into `runs/` verbatim and never quoted into a
  prompt. One-way valve.
- Fresh agent every round, including a re-verify after `fail`.

**What this costs, and it is not nothing.** The Sessions-table check stops
working. Every role in an orchestrated run shares one `$CLAUDE_CODE_REMOTE_SESSION_ID`,
so the tester finds its own id listed as `worker`. It is told not to refuse on
that and not to claim the check passed — instead to say in the Verdict that its
independence came from being a freshly spawned agent rather than a separate
session. That is real independence and weaker evidence, and conflating the two
would be the actual danger.

**Revisit when** a Verdict comes back that reads as though it tested the
implementation rather than the criteria. The fix would be the prompt or the
spawn, not the tester.

---

## D-4 — The reviewer marks ready; a person merges

**Amended 2026-08-25.** This entry used to read "The reviewer may merge, within
strict limits", and the reviewer held `mcp__github__merge_pull_request`.

**Decided:** a fourth agent reviews quality, sweeps, trims the queue, and marks
the PR **ready for a person to merge**. It never merges. The tool is gone from its
frontmatter, which is the version of the rule that does not depend on an agent
remembering it.

**Why the change, from Dkaattae:** there is no ops dashboard, and the test
coverage is not yet complete enough that a green suite means what a green suite
should mean. Automatic merge assumes you can see the consequences of a bad one
quickly. Until that is true, the last step before `main` is a person.

**The envelope did not go away — it changed what it decides.** It used to gate
*merge*; it now gates *escalation*. Inside it, the PR is marked ready with no
note: routine, merge when you get to it. Outside it — a dependency,
`openapi.yaml`, a migration, the plan, a product decision, or any text a child
will read — the PR is still marked ready, but the body says at the top that it
must not be merged without a decision. Both outcomes end at a person; what
differs is what they are being told.

**What this costs:** the loop no longer closes without you, so an unattended run
now ends at a finished PR rather than at a merged `main`. That is the intended
trade, not a regression. **What it does not cost** is the sweep: the reviewer
still sweeps *before* marking ready, in the PR's own branch, so what reaches you
is complete — work, tests, brief deleted, queue trimmed, `PROGRESS.md` written.
One click, no follow-up.

**Revisit when** there is somewhere to watch a bad merge from, and the suite
covers enough that green is load-bearing. This is the entry to reopen first once
both are true; the machinery to merge automatically is one tool grant away and
the envelope is already written.

---

## D-4a — The original envelope, kept for reference

Two things drove the reviewer role. Tests check criteria; **nothing was checking
whether the code was any good**. And sweeping at the start of the *next* cycle
meant it only happened if someone came back — it now happens inside the PR,
before the hand-off, so the bookkeeping is reviewed alongside the work it
describes.

The envelope is deliberately narrow, and "confident" is not part of it, because
an agent's confidence is not evidence. A change passes it only when the tester
passed, nothing changed outside the brief's Constraints, no dependency was added,
nothing touched `openapi.yaml`, a migration, or the plan, and **no text a child
will read** is involved. Everything else is flagged for a person explicitly.

That last one is the point. `T-011` is fifty fun facts for seven-year-olds:
exactly the work where a test can confirm the shape and only a person can
confirm the substance.

**The `orchestrator` (D-1) does not widen this.** It holds the *approval* gates,
not this envelope: the reviewer still applies these limits itself. Since the
amendment above, an unattended run and a manual one merge exactly the same set of
changes without a human, which is now none.

**Revisit when** you have enough finished tasks to see whether the envelope is too
tight — if the reviewer flags almost everything, it is doing no work and the
limits should widen; if you find yourself waving its flags through, they should
widen too.

---

## D-5 — Alembic owns the database schema

**Decided:** the pipeline emits JSON; a Python loader writes Postgres. `DbSink`
in `question-bank/` stays a seam for standalone use, not the path that defines
tables.

With a TypeScript pipeline and a Python backend, something has to own the
schema, and two authors will disagree. Recorded in full in plan §5.3.

---

## D-6 — A light path for S-sized tasks

**Decided:** tasks marked `S` get a **shorter brief, not no brief**.
`tasks/T-0xx-slug.md` still exists and still carries the acceptance criteria, the
`Approved:` line, the Sessions table, the Handoff and the Verdict. Goal, Out of
scope, Constraints and Context are dropped. **The independent tester session is
never skipped.**

*Amended after T-002, its first and only use.* As originally decided, the light
path dropped the brief file entirely and scattered its contents — criteria into
`tasks.md`, approval into the PR description, handoff into the PR body. That
produced three defects inside one task:

1. **Approval** had nowhere to live, because it happens before any code.
2. **The handoff** had nowhere to live, because the tester reads it before the
   reviewer touches the PR.
3. **The Sessions table went with the brief**, so the light path promised an
   independent tester session while deleting the only evidence that one happened
   — and T-002's tester was in fact not independent.

Each was patched separately, into `tasks.md`, and the T-002 entry grew to ninety
lines: longer than the brief it was avoiding, in the file that is supposed to be
a scannable queue. The patches were treating a symptom. **The root cause is that
five roles across four sessions need one place to read and write, and `tasks.md`
is not it** — it is shared by every task, so a light task's state ends up
interleaved with the queue.

Keeping the file and shortening its contents gets the saving that was actually
wanted. The expensive part of a brief was never the file; it was writing Out of
scope and Constraints for work that touches one file.

T-001 spent four sessions, three PRs and a human approval to add 19 tests to code
that already worked. The catch it produced was real, but that ratio will not
survive contact with a queue of S-sized tasks, and a process people quietly stop
following is worse than a lighter one they keep.

The line is drawn at what the brief's Out of scope and Constraints sections are
actually for. A task that touches `openapi.yaml`, a migration, the plan, or text
a child reads gets the full treatment regardless of size; so does anything whose
criteria run past four, because that is a task pretending to be small.

**Revisit when** a light-path task goes wrong in a way the full path would have
caught. That is the evidence that the line is in the wrong place — and note it
honestly, because the temptation will be to conclude the light path is fine and
the task was unlucky.

---

## D-7 — Every role holds Bash; separation moves to the diff

**Decided:** every agent gets `Bash` — the four step roles, and the
orchestrator. What keeps them from doing each other's
jobs is **what each is allowed to write**, checked against the commit diff by the
reviewer at step 6 — not the absence of a tool.

The old arrangement gave the `task-expander` no Bash, which enforced "the
expander cannot implement anything" for free. That guarantee was real and it is
worth naming what replaces it, because the replacement is weaker.

It had to change because the flow changed. The PR now opens at expand time, so
approval has a durable home instead of living in a chat log — and opening a PR
means creating a branch, committing and pushing. The first version of that change
(PR #9) instructed the expander to do all four while leaving its tool list
untouched, so every task would have stalled at step 2. The instruction and the
tool list have to move together; that is now stated at the top of `process.md`'s
"What each role needs to do its job".

**Why not keep Bash away from the expander and have the human open the PR?** It
works, and it was the alternative. It was rejected because it puts a manual step
between "brief written" and "brief approvable" — exactly where a loop that
already costs four sessions can least afford friction, and exactly the kind of
step that gets skipped, which is how approval ended up in a chat log the first
time.

**The compensating check:** the expander's commit must touch only `tasks/`,
`tasks.md` and `PROGRESS.md`. That is mechanically checkable from the diff, the
reviewer is told to check it, and the commit-message convention
(`T-0xx expander: …`) makes the commits attributable. A written rule with a check
is not as strong as a missing tool, but it is much stronger than a written rule
alone.

**The drift recurred once inside this same PR.** The second review of #9 found
`reviewer.md` telling the reviewer to open a sweep PR on the merged-early path
while its tool list carried no `create_pull_request` — the identical shape as the
expander defect, in the role that is supposed to catch it, introduced by the very
commit that fixed the first one. Both are now fixed, and the lesson is narrower
than "be careful": **an instruction that names a git or PR action has to be read
against the agent's `tools:` line in the same pass**, which is what the table in
`process.md` exists to make cheap.

**Revisit when** an expander commits something outside those three paths. One
occurrence means the check is load-bearing and working; a second means the rule
is not holding and the tool should come back off.

---

## D-8 — The brief's `Branch:` header is the authority, not the branch name

**Decided:** the task branch is whatever the expander pushed and pointed the PR
at, recorded in the brief's `Branch:` header. `task/T-0xx-slug` is the default
when a session may name its own branch, not a requirement.

The loop was written assuming each agent checks out the branch it wants. Claude
Code on the web does not work that way: it **assigns a branch per session** and
forbids pushing anywhere else. Four sequential sessions therefore get four
different branches, and "the worker and tester push to the expander's branch"
becomes impossible rather than merely inconvenient.

**T-003 is what that costs.** The expander ran on
`claude/t002-sweep-t003-expand-ibrpor` and opened PR #11 there. The worker ran on
`claude/worker-t003-i1kbih` and pushed a complete, working CI workflow to it. PR
#11 never saw the commit. Nothing errored and no rule was broken — `worker.md`
told it to check whether the task branch existed, and the branch it was standing
on did exist. The task stalled with its implementation one branch from its own
PR, and since T-003's criteria are verified by watching workflow runs, the tester
could not have run even if someone had started it.

**Why not require the `task/` name and have the human create the branch?** It
works, and it was the alternative. It was rejected for the same reason D-7
rejected a human-opened PR: it puts a manual step in the middle of a loop that
already costs four sessions, and manual steps in the middle are the ones that get
skipped.

**Amended 2026-08-08.** This decision originally added "it would also not have
helped here — the harness forbids the *push*, not just the name." That is
stronger than the facts. The harness forbids it **by default**: the restriction
is an instruction in the session's prompt, not a credential limit, so nothing
errors on a push elsewhere — which is exactly why T-003's failure was silent —
and a human can lift it. T-003's tester proved this, stopping to ask and being
authorised to push to the header's branch, which is the only reason PR #11 has
workflow runs to verify against at all.

So the permission is grantable, and granting it once beats granting it four
times. `CLAUDE.md` "Branches" now carries it as a **standing** grant covering the
brief's `Branch:` header, and the role files point there instead of stopping.
Note what this is: an instruction that a harness instruction should be overridden
in one narrow case. It is persuasion, not enforcement — a cautious session may
still stop and ask, and the checks below stay in place for when it does.

**The compensating checks**, since a header field is weaker than a convention
everyone can derive:

- every role after the expander compares `git branch --show-current` against the
  header and **stops** on a mismatch rather than pushing where it stands;
- the tester additionally opens the files the handoff names, so work that is
  missing from the branch surfaces as `blocked` rather than as a mysterious
  empty diff;
- the reviewer checks the PR's commits against the Sessions table, which is the
  last point where a half-task can be caught before it merges.

Three checks for one failure is deliberate. The failure is silent at every layer
— no error, no red test, just a PR quietly missing a commit — and the earlier two
only fire if an agent is paying attention to something it has no other reason to
look at.

**Amended 2026-08-25.** Both unattended drivers put all four roles on one branch,
which is what this entry was waiting for — though neither has yet run a task end
to end, so the condition is *addressed*, not *met*.

- `run-loop.sh` owns the checkout and **checks out the header's branch itself**
  (G4). There is no per-session branch to diverge from.
- The `orchestrator` spawns subagents, which share its working tree. Four
  roles, one branch, one PR, with the header's value passed in the spawn prompt.

**The harness still assigns the driving session its own branch**, so exactly one
mismatch survives — the orchestrator's assigned branch versus the header's — and
the standing grant in `CLAUDE.md` "Branches" is what covers it. One mismatch
handled by an existing permission, instead of four silent ones.

**What this rules out: encoding lineage in the branch name.** A scheme like
`T-003-<parent>-worker-<child>` was considered and rejected. It creates a second
place the parent branch is recorded, which can disagree with the `Branch:` header
— and when they disagree there is no rule for which wins. It also cannot be
derived from a harness-assigned name: `claude/worker-t003-i1kbih` looks composed
but is not, the slug coming from the session's prompt and the suffix being
random. **The fix for a branch that cannot be found is not a better name; it is
not making a second branch.**

**Revisit when** a task actually runs end to end under either driver, or if the
harness stops assigning branches — at which point the header becomes redundant
with the convention and the checks are pure overhead. Until then they are the
only thing standing between a stranded commit and a merged half-task.

---

## D-9 — Frontend test files are typechecked, and `@types/bun` pays for it

**Decided:** `frontend/tsconfig.json` no longer excludes `src/**/*.test.ts(x)`.
`@types/bun` is a devDependency of `frontend/` (`^1.3.14`, the version
`question-bank/` already uses) and `"types"` carries `"bun"`, so `bun run
typecheck` covers test files exactly as it covers everything else.

The exclusion was never a decision. It was written during PR #17 to get past a
`tsc` that could not resolve `bun:test`, with a comment saying as much, and it
meant **the only frontend test file was not typechecked at all** — in a
`"strict": true` package with `exactOptionalPropertyTypes` and
`noUncheckedIndexedAccess` on. Tests are the code most likely to be written
against a stale idea of a signature, and they were the one part of `frontend/`
the compiler never read.

**The two alternatives, and why they lost:**

- **Keep the exclusion and write down why.** Free, and honest, but it leaves the
  hole open: a test can call `createApiClient({ baseUrl: 42 })` and nothing says
  so until someone runs it. The cost of closing it turned out to be one
  devDependency.
- **A separate `tsconfig.test.json` and a second `tsc` invocation.** No new
  dependency in the main config, but it needs `@types/bun` anyway to resolve
  `bun:test`, so it buys nothing and costs a second config to keep in step.
  `question-bank/tsconfig.json` already does the simple thing and has since its
  first test.

Dkaattae approved the dependency on 2026-08-24 with those alternatives stated,
per `CLAUDE.md` "Packages". It is types only: nothing it contains reaches a
build, a bundle or a browser.

**Revisit when** `@types/bun` starts costing something real — it conflicts with
`@types/node` or `vite/client` in a way `skipLibCheck` cannot absorb, or it
drags the frontend's TypeScript version forward before the app is ready. The
answer then is `tsconfig.test.json`, not the exclusion: what must not come back
is untypechecked test files.

---

## D-10 — CI requires frontend tests to exist

**Decided:** `--pass-with-no-tests` is gone from the frontend `Test` step in
`.github/workflows/ci.yml`. `bun test` runs bare, in both TypeScript jobs, and
bun's exit code is the step's.

The flag was added by T-003 for a true reason that has expired: `frontend/` had
no test files, `bun test` exits 1 on a package with none, and the job would
otherwise have been red for a reason nobody was going to fix that week. It is
now 65 tests across two files, and the flag's only remaining effect is that
**deleting every one of them leaves CI green** — a check that certifies nothing
in exactly the state where you would most want it to shout. That is the same
shape of failure T-003 spent three verify rounds on: run 31270170161 was green
with a failing test in the tree.

Removing it makes "the frontend has tests" a thing CI asserts rather than a
thing that happens to be true.

**What this does not do:** it is not a coverage threshold and it is not a
guarantee the tests are any good. One trivial test file satisfies it. It closes
the one failure mode that is silent — a package quietly losing its whole suite —
and nothing more.

**Revisit when** a legitimate package in this repo has no tests and should not
be forced to grow one. The fix then is to drop the `Test` step for that package
with a comment, not to bring the flag back: a step that cannot fail is worse
than a step that is absent, because it reads as coverage.

---

## Known weaknesses

Not decisions — things that are true, that we have chosen to live with, and that
are worth watching.

**The loop has run once.** `T-001` went through it end to end and produced one
genuine catch: the expander wrote a criterion whose example — Colorado — could
not demonstrate what the criterion required, and only the worker's survey exposed
it. It also cost four sessions and three PRs for 19 tests against working code,
which is what D-6 exists to address. Everything beyond that first run is still
prediction.

**`tasks.md` will rot faster than expected.** Thirty tasks written before any of
them ran; after `T-021` lands, half of section C will be subtly wrong. The
reviewer's trim step exists for this and is the step most likely to be skipped,
because it feels like bookkeeping when you would rather start the next task. A
queue you trust to twelve items beats one you half-believe to thirty.

**The verifier's independence is only as strong as the discipline around it —
and it broke on the first run.** T-001's expander, worker and tester were all the
same session. It produced an honest result, because expected values were taken
from the brief rather than the code, but "was careful" is not a mechanism.

The brief now carries a Sessions table and the tester checks
`$CLAUDE_CODE_REMOTE_SESSION_ID` against it, refusing to run in a session already
listed as `worker`. That makes the violation visible rather than impossible,
which is the most a file-based process can do. The remaining hole is the same one
as before: nothing stops a human pasting the worker's reasoning into the tester's
session, and it will be tempting on the first `blocked` verdict.

**A merge can outrun the loop.** PR #6 was merged before the reviewer ran, so the
sweep could not ship inside it and needed its own PR. Nothing was violated — the
brief still said `Next step: reviewer` — but the intended state became
unreachable. The reviewer now checks whether the PR is already merged and sweeps
separately when it is. The loop has no way to *prevent* this, only to notice.

**The verifier's independence is no longer *checkable* in an orchestrated run.**
It is still real — the tester is a freshly spawned agent that never saw the work
— but the mechanism that made it auditable was the Sessions table, and every role
in an orchestrated run shares one session id. The tester now says in its Verdict
which kind of independence it had. That is a downgrade from evidence to
attestation, and it is the honest name for it.

This is the sharpest reason to prefer `run-loop.sh` where a shell is available:
it mints a `--session-id` per step, so the Sessions table fills with distinct ids
and the check goes back to being evidence. **The weakness is the orchestrator
agent's, not the loop's** — and it is a property of the environment that forced
the agent, not a decision anyone made.

**The two drivers can drift apart.** `run-loop.sh` and `orchestrator.md` enforce
the same six gates, one in `bash` and one in prose, and nothing checks that they
still match. A gate tightened in one and forgotten in the other produces two
loops that behave differently while both claiming to be the loop — and the
failure is silent in the familiar way, since neither errors. They are documented
side by side in `.claude/loop/README.md` to make a divergence visible on read;
that is weaker than a test, and there is no test to be had for prose.

**Nobody sees the brief before it is built, in an orchestrated run.** The step-2
gate was described here as "the highest-leverage minute you will spend on the
task", and an unattended run spends it on nothing at all: the orchestrator writes
`Approved: orchestrator — <date>, unattended run` without having read the
criteria, because reading them is what D-3 forbids. The brief says so plainly
rather than forging a name, and `runs/T-0xx-slug.md` is where you catch it
afterwards — but afterwards is after the work. **This is the whole cost of the
orchestrator and it should be re-examined the first time a run produces something
that satisfies its criteria and is not what anyone wanted.**

**A spawned role cannot ask a question.** Run manually, an agent that needs a
human decision simply asks the session it is running in. Spawned, it has no way
to reach anybody: it can only return text. So the orchestrator's template tells
every role to write the question into the brief, set `Status: blocked`, and stop
— and tells the orchestrator to halt rather than answer on the human's behalf.
The behaviour is preserved; the latency is not. A question that would have taken
a human ten seconds to answer mid-session now costs a full stop and a restart,
which creates real pressure on a role to guess instead of asking. Watch for a
Handoff that resolves an ambiguity confidently and does not say who decided.

**No content reviewer exists.** `T-011` and `T-014` produce writing for children,
where the real question is "is this right for a nine-year-old" and no test
answers it. Today that is the human's job by default. It may deserve its own
role once there is enough of it.

---

## D-11 — A role that cannot ask must halt where the question will be found

**2026-08-28.** D-1 accepted that an unattended run loses the step-2 approval
gate, and D-3 recorded that a spawned role cannot reach a person. Both are still
true and neither is being reopened here. What this fixes is narrower and was a
real hole rather than a known cost: **the halt itself could be silent.**

Three gaps, found while setting T-006 up to run unattended:

1. **`run-loop.sh` never told a role what to do when it needed a human.** The
   `orchestrator`'s spawn template carries that instruction; the driver's did
   not, and the driver is the one `process.md` says to prefer. A role running
   under `claude -p` cannot ask and was not told to halt, which leaves guessing
   as the path of least resistance.
2. **The `task-expander` had no unattended blocked path at all.** Its "stop and
   ask rather than guessing" list is written for a manual session, where asking
   works.
3. **A cold-start halt was announced to nobody.** `blocked-run-notice.yml` needs
   an open PR to label and comment on. The expander opens that PR at the *end*
   of its run, so an expander that halted while writing the brief had no PR —
   and the workflow logged "there is nowhere to say so" and exited 0. The task
   stopped, correctly, and no one was told.

**The fix is not "let the role ask".** It cannot, and the orchestrator answering
on the human's behalf is the worst available outcome — D-3 already says so.
Instead the halt is made loud:

- the driver's prompt now carries the same blocked protocol as the orchestrator's
  template;
- `task-expander.md` gains an explicit sequence — **open the branch and draft PR
  first**, even with the brief unfinished, then block — so there is always
  somewhere for the notice to land;
- `blocked-run-notice.yml` opens an **issue** when no PR exists, idempotent on
  title, as the backstop for when it could not.

**What this deliberately does not do.** It does not close the approval gap. Nobody
still reads the criteria before the code is built in an unattended run, and the
`reviewer` does not count — it reads them at step 6, after the work. D-1's
sentence stands: that gap should be re-examined the first time a run produces
something that satisfies its criteria and is not what anyone wanted. This change
only means that a run which *knows* it needs a person now says so where a person
will see it.

**Why it was a hand change.** Gate G1 stops any task touching `process.md`,
`decisions.md`, `CLAUDE.md` or `.claude/` from running through the loop. A change
to the loop does not go through the loop, so this one was made directly and
reviewed as an ordinary PR.
