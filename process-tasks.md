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
