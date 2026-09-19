# Process tasks

The queue for work on the **loop itself** — `process.md`, `process-decisions.md`,
`CLAUDE.md`, anything under `.claude/`, the workflows. Numbered `P-n`. Kept apart
from [`tasks.md`](tasks.md) on purpose; see `process-decisions.md` D-12.

**A `P` ticket never enters the loop.** No brief, no `task-expander`, no
`worker`/`tester`/`reviewer`, no gates. It is done by hand in an ordinary session
— a person, or an agent a person is sitting with — as an ordinary PR that
Dkaattae reviews and merges. When the choice could reasonably have gone the other
way, it records a `D-n` entry in `process-decisions.md`. `run-loop.sh` G1 is what
makes this a rule rather than a convention: a diff that touches any of those
paths stops the driver before it spawns anything.

**Who writes here.** Anyone. The `reviewer` adds an entry when a task uncovers a
gap in the loop; a role that halts on one says so in its `Fault:` line and the
reviewer carries it over. The `task-expander` **never picks from this file**.

**Status**: `todo` · `doing` · `done` · `dropped` (with a reason). Sizes as in
`tasks.md`. Finished tickets are deleted and logged in `PROGRESS.md` like any
other.

---

### P-1 — A halted role never says who should resume it · S · todo
**Depends on:** —
Found during T-006's orchestrated run, 2026-08-28. When a role halts it writes
`Status: blocked`, `Next step: human`, a one-sentence `Fault:` and the question
itself into the brief, then pushes — and `blocked-run-notice.yml` labels the PR.
All of that works. What is missing is the other half: **which role should pick
the task back up once the question is answered.** The halting role knew, because
it was holding the context at that moment; the person reading the brief hours
later has to infer it from the question. Expander, worker or tester are all
plausible answers and they are not interchangeable — sending an answered
criteria question to the worker instead of the expander is the D-8 failure shape,
where nothing errors and the task drifts.

**The resume protocol is written down exactly once, in the wrong place.**
`.github/workflows/blocked-run-notice.yml` (lines ~146 and ~190) puts *"To
resume: answer in the brief, set `Next step` back to the role that should
continue, commit, and start a run"* into the notice it posts. That is the only
statement of it in the repo: neither `process.md` nor `tasks/TEMPLATE.md` tells a
reader how to restart a blocked task, so the convention is discoverable only by
having already been blocked once, or by grepping a workflow file.

The likely right answer is a **`Resume with:`** header field, written by whichever
role sets `Status: blocked`, naming the role that should continue and nothing
else. **No driver may read it.** `run-loop.sh` and the `orchestrator` keep routing
on `Next step` alone, so G0 is untouched and the orchestrator still never decides
what runs next — that blindness is what D-3 rests on and this must not erode it.
`Resume with:` is a note from the halted role *to a human*, and the human promotes
it into `Next step` when they answer. The tempting version — let the driver read
it and resume by itself — is the one to reject: it would mean the driver
inferring from a question it is forbidden to have read.

**This is a process-file change** (`process.md`, `tasks/TEMPLATE.md`, the four
role definitions under `.claude/agents/`, and `blocked-run-notice.yml` so the
notice surfaces the new field). G1 therefore forbids running it through the loop:
hand-written PR, reviewed by Dkaattae, like the D-11 change before it.
**Done when:** a halted brief names the role that should resume it; the resume
protocol is stated in `process.md` and `tasks/TEMPLATE.md` rather than only in a
workflow's comment text; the blocked notice shows the field; and it is written
down that no driver routes on it.

### P-3 — Two loose ends in `ci.yml` that a `T` task may not reach · S · todo
**Depends on:** —
**New 2026-09-11, carried over by T-058's reviewer (PR #35).** T-058 corrected the
docs that describe `ci.yml` and put them under test. Two things it found are in
`ci.yml` itself, which `process.md` ("Work on the loop itself never enters the
loop") and `run-loop.sh` G1 put out of a `T` task's reach — T-058's criterion 9
made that boundary checkable by requiring `git diff main -- .github/` to stay
empty, and it did. **T-058's brief asked for these in `tasks.md`; they belong
here**, because an entry in `tasks.md` that no `task-expander` may correctly pick
is worse than no entry.

- **Two of the six jobs have no lockfile-drift guard.** `frontend`,
  `question-bank`, `backend` and `e2e` each install from a frozen lockfile *and*
  run `git diff --exit-code` against it; `backend-postgres` (`ci.yml:227`) and
  `integration` (`ci.yml:266`) install with `--frozen` and stop. Two lines each.
  `conventions.md` now states the split accurately, so nothing is *wrong* today —
  the question is whether the guard should be uniform. If it is added, the doc
  sentence collapses back to "each ... checks the lockfile did not move" and
  `conventions-doc.test.ts` fails until it does, which is the behaviour T-058
  built: the test asserts the doc's list equals `ci.yml`'s, in both directions.
- **`ci.yml:279` still says "thirteen full user journeys"** in a comment. The same
  stale count T-058 removed from `conventions.md:66`, in the one file it could not
  touch. It will outlive the next `e2e` task.

**Done when:** it is decided whether all six jobs guard their lockfile — done, or
declined with a reason in the workflow — and no hardcoded journey count survives
in `ci.yml`. Whichever way the first goes, `conventions.md` and the assertions in
`frontend/src/conventions-doc.test.ts` still agree with the workflow afterwards.

### P-4 — A role's last test run has to be made from the state it pushes · S · todo
**Depends on:** —
**New 2026-09-17, found by T-014's reviewer across two rounds (PR #44).** T-014's
tester ran the whole suite, got a green result, wrote "687 pass / 0 fail" into its
Verdict, then committed — and the commit turned the suite red. The new test file
was **untracked** while the suite ran, and the criterion it violated was checked
through `git ls-files`, so the file was invisible to the very assertion it broke.
Nothing errored, the Verdict looked exactly like a true one, and it cost a full
review round.

This is not specific to T-014's criterion. Any check that enumerates files
through `git ls-files` — and this repo has several, because CI checks out at
`fetch-depth: 1` and `origin/main` is not there — sees a different repository
before and after `git add`. The same shape bites a worker that adds a source file,
and a reviewer whose sweep deletes one.

**The likely fix is one sentence in three role files**, not a new gate:
`worker.md`, `tester.md` and `reviewer.md` each end with "commit, push, confirm
the push landed". That sequence should say that the run whose numbers go in the
Handoff, Verdict or PR body is made **after** `git add`/`git commit`, not before —
and that a number in a report has to be reproducible from the pushed commit, which
is what `CLAUDE.md` "Reporting" already asks for and what this failure quietly
broke. `run-loop.sh`'s per-step prompts carry the same ending and would need the
same line. Worth considering alongside it: whether the driver should run
`bun test` itself on the pushed tree, which is a real gate rather than a
reminder — and is what CI already does one step later, which is how this one was
actually caught.

**This is a process-file change** (`.claude/agents/*.md`, `process.md`,
`.claude/loop/run-loop.sh`), so G1 forbids running it through the loop:
hand-written PR, reviewed by Dkaattae.
**Done when:** every role that reports a test count is told to take it from the
state it pushed, and the instruction lives with the commit-and-push sequence
rather than in a paragraph about honesty.

### P-5 — The loop cannot run its only independent step in this environment · M · todo
**Depends on:** —
**New 2026-09-19, carried over by T-061's reviewer (PR #52).** T-061 shipped
without an independent `tester` verdict, and not because anyone skipped a step.
Every `claude -p` subprocess `run-loop.sh` spawned in this workspace was refused
command execution — `bun`, `bun test`, `node -e`, `bash <script>`, `python3`,
`gh`, **and `git add`/`git commit`/`git push`** — each returning `This command
requires approval` with nothing executed, with and without
`dangerouslyDisableSandbox`, foregrounded and backgrounded. It hit
`task-expander`, then `worker`, then `tester`, three roles in a row and each one
wider than the last. D-13 already records the cause — Claude Code ignores
`.claude/settings.json`'s allowlist in a directory the invoking user has never
interactively marked trusted, and that trust is per-machine, so a repo cannot
ship it — and D-13's own last paragraph says a live end-to-end run under the
allowlist "is still the only thing that closes this out for real". T-061 is that
run, and it did not close it.

**What it cost, specifically.** The `tester` is the loop's only independent
signal (`process.md` step 4, D-6: "the one step the light path never drops").
T-061's tester was honest and returned `blocked` having executed nothing, so
`Status: pass` was set by a human on the strength of a suite run made from the
*driving* session — real execution, but a session that had already read the
Handoff, which is the one property step 4 exists to exclude. **No mutation was
ever run**, on the task whose entire subject is whether guards still fire when
broken.

**What is known and what is not.** `bypassPermissions` is refused outright for
root and in web sessions (D-13, 2026-08-28), so `LOOP_PERMISSION_MODE`'s escape
hatch is not available here; the driving session's later attempt to authorise it
for subprocesses (commit `3a6a158`) was followed by a `tester` step that still
exited 1. Against that: a *trusted* top-level session in this same sandbox runs
the suite fine — this reviewer's session ran `bun test` (198 pass), `bun run
lint` (clean) and `bun run typecheck` without a single approval prompt. So the
failure is specific to spawned `claude -p` children, not to the container, and
that is the gap to characterise before designing around it.

**Narrower still, from the same day's run.** The driving session also tried
spawning `orchestrator` as its own `Agent`-tool subagent (one level below the
top-level session), expecting it to relay `worker`/`tester`/`reviewer` per its
own design. It couldn't: at that nesting depth it had no `Agent`/`Task` tool of
its own, so — mirroring what `run-loop.sh` does — it fell back to `claude -p`
and hit the identical "requires approval" wall. But the driving session then
spawned `reviewer` **directly** as its own subagent (not through a nested
orchestrator), and that subagent's `bun test`/`lint`/`typecheck` calls ran with
no prompt at all, same as the top-level session's. A later mutation-testing
subagent, spawned the same direct way, ran eight mutations with full Bash access
and no prompts either. So the trust wall is not "any subagent" — it is
specifically **a `claude` CLI process spawned without this session's inherited
context**, whether that's `run-loop.sh`'s `claude -p` or a nested orchestrator's
`claude -p`. A subagent spawned via `Agent` one level below an already-trusted
session inherits that trust and runs fine; a subagent spawned two levels below
(or a bare CLI invocation at any depth) does not.

**The working fallback, until this is designed properly:** in an environment
that shows this fault, have the top-level session itself relay each role via
`Agent` directly — i.e. act as the orchestrator by hand, one spawn at a time —
rather than spawning an `orchestrator` subagent or running `run-loop.sh`. It is
slower to invoke (a person has to say it explicitly, e.g. "spawn worker/tester/
reviewer yourself instead of using run-loop.sh") and it still needs the gates
`orchestrator.md` describes applied by hand, since nothing enforces them
otherwise, but it is the one path in today's evidence that reliably executes.

Worth weighing, rather than assuming the first is the answer:
- **Make the trust state a documented precondition** of `run-loop.sh` — a
  preflight that spawns one child, runs `git status`, and refuses to start the
  loop rather than running four roles that cannot execute anything. Cheap, and
  turns three silent wasted sessions into one loud refusal.
- **Let the driver run the checks itself** on the pushed tree, which P-4 already
  proposes for a different reason. It does not restore independence — the driver
  is not the tester — but it means "the suite is green" stops depending on a
  child process that may be unable to run it.
- **Say what a `tester` may do when it cannot execute.** Today it returns
  `blocked`, correctly, and the loop then has no defined path except a human
  substituting their own run and recording it honestly, which is what happened.
  Whether that substitution is ever acceptable — and if so, what it must say in
  the Verdict — is a `D-n` decision, not a code change.

**This is a process-file change** (`.claude/loop/run-loop.sh`, `.claude/agents/
tester.md`, `process.md`, and a `D-n` entry), so G1 forbids running it through
the loop: hand-written PR, reviewed by Dkaattae.
**Done when:** a run in this environment either produces a genuinely independent
`tester` verdict, or refuses to start and says why — and the case where it
cannot is written down somewhere a reader of a `pass` can find it, instead of
being reconstructed from a brief's Notes section after the fact.
