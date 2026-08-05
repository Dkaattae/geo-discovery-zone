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
- the sweep friction actually costs something. Today the reviewer deletes the
  brief in the same session as the merge (D-4), which removes most of it.

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
happened if someone came back — now it happens in the same session as the merge.

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

## Known weaknesses

Not decisions — things that are true, that we have chosen to live with, and that
are worth watching.

**The loop has never run.** Five documents describe it; everything in them is a
prediction. `T-001` is its first exercise. Expect the expand step to feel heavy
for a task that small, and treat that as data rather than as a reason to
abandon it. Do not build more process before running it once.

**`tasks.md` will rot faster than expected.** Thirty tasks written before any of
them ran; after `T-021` lands, half of section C will be subtly wrong. The
reviewer's trim step exists for this and is the step most likely to be skipped,
because it feels like bookkeeping when you would rather start the next task. A
queue you trust to twelve items beats one you half-believe to thirty.

**The verifier's independence is only as strong as the discipline around it.**
Nothing technically stops you pasting the worker's reasoning into the tester's
session when it looks stuck. That will be tempting on the first `blocked`
verdict, and it quietly converts the whole design into a slower way of having
one agent do everything.

**Cost per task may not justify the ceremony.** Three or four sessions plus a
human approval, for something like `T-012` — fifty lines of curated data. If the
ratio feels wrong after a few runs, the fix is not abandoning the process but
adding a documented light path for S-sized tasks: expand inline in `tasks.md`,
skip the separate brief, keep the independent verification.

**No content reviewer exists.** `T-011` and `T-014` produce writing for children,
where the real question is "is this right for a nine-year-old" and no test
answers it. Today that is the human's job by default. It may deserve its own
role once there is enough of it.
