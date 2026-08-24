# Decisions

Choices about how this project is built, why they went the way they did, and
what would make them worth revisiting. Kept separate from
[`geoquizdataplan.md`](geoquizdataplan.md), which is about the *product*.

Add an entry when a decision could reasonably have gone the other way. A
decision with no trigger for revisiting is a habit, not a decision.

---

## D-1 — No orchestrator agent

**Decided:** the human starts each session; the brief in `tasks/` holds the state.

An orchestrator would either spawn subagents — ruled out, see D-3 — or read the
brief and announce which agent runs next, which is one line of a file you can
read yourself. It would add a session, a model call, and somewhere for state to
go stale.

The brief's **Status** and **Next step** header is the state machine. A file
beats an agent's memory here for the same reason a queue beats a conversation:
it survives a crashed session.

**Revisit when** you want the loop running unattended. The answer then is not an
agent — it is a shell script that reads `Next step` and invokes
`claude --agent <name>`. Fifteen lines, no model, no drift. Worth building only
after the loop has run manually enough times that the handoffs are trusted.

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

## D-3 — Sequential sessions, no subagents

**Decided:** one agent per top-level session, started by a human. Nothing spawns
anything, enforced by tool lists — none of the four agents has the Task tool.

Subagents would collapse the isolation the loop depends on: a tester spawned by
the worker inherits its framing, which is the exact failure the separation
exists to prevent. Sequential sessions cost wall-clock time and buy a verifier
whose independence is structural rather than promised.

**Revisit when** independence can be preserved some other way, or when the
wall-clock cost outweighs it — for example, running independent tasks in
parallel, which is safe only when their briefs' Constraints name disjoint files.

---

## D-4 — The reviewer may merge, within strict limits

**Decided:** a fourth agent reviews quality, merges when the change falls inside
an explicit envelope, and escalates otherwise. It also sweeps and trims the queue.

Two things drove this. Tests check criteria; **nothing was checking whether the
code was any good**. And sweeping at the start of the *next* cycle meant it only
happened if someone came back — it now happens inside the PR, before the merge,
so the bookkeeping is reviewed alongside the work it describes.

The envelope is deliberately narrow, and "confident" is not part of it, because
an agent's confidence is not evidence. It may merge only when the tester passed,
nothing changed outside the brief's Constraints, no dependency was added,
nothing touched `openapi.yaml`, a migration, or the plan, and **no text a child
will read** is involved. Everything else goes to a human.

That last one is the point. `T-011` is fifty fun facts for seven-year-olds:
exactly the work where a test can confirm the shape and only a person can
confirm the substance.

**Revisit when** you have enough merged tasks to see whether the envelope is too
tight — if the reviewer escalates almost everything, it is doing no work and the
limits should widen; if you find yourself rubber-stamping its escalations, they
should widen too.

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

**Decided:** all four agents get `Bash`. What keeps them from doing each other's
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

**Revisit when** a task runs end to end with all four roles on the same branch.
If the harness stops assigning branches, the header becomes redundant with the
convention and the checks are pure overhead. Until then they are the only thing
standing between a stranded commit and a merged half-task.

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

**No content reviewer exists.** `T-011` and `T-014` produce writing for children,
where the real question is "is this right for a nine-year-old" and no test
answers it. Today that is the human's job by default. It may deserve its own
role once there is enough of it.
