# T-091 — Climate: record that the "only cold phrase" trade is accepted — run log

**Task:** T-091 · **Branch:** `claude/amazing-ritchie-wwz0je` · **PR:** #111
**Started:** 2026-10-30 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-30
`Next step` on entry: `none (no brief)` → on exit: `worker`

**TL;DR:** I wrote the T-091 brief, pushed it to `claude/amazing-ritchie-wwz0je`, and opened draft PR #111. The task only updates the decision record: Dkaattae chose option (a) on 2026-10-27, so the task writes that into E-25 and closes the open "Owner" line in E-27 (b). No source, bank or level changes. Status is `awaiting approval`, Next step is `worker`, and Approved is `pending`.

**Needed next:** a person approves the brief before the worker runs. Under an orchestrated run, this step is skipped, not done by someone else.

- **Brief:** `/home/user/geo-discovery-zone/tasks/T-091-climate-cold-trade-accepted.md`
- **Branch:** `claude/amazing-ritchie-wwz0je`, recorded in the brief's `Branch:` header. The push landed: `origin/claude/amazing-ritchie-wwz0je` is at `5606ef4`, one commit after `3bef782`.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/111 (draft, into `main`). Its body holds the acceptance criteria.
- **Diff against main (`12d242e`):** only the new brief and `tasks.md`, where T-091 changed from `todo` to `doing`. The expander's write limits hold.

**Why T-091:**
- T-085b comes first in the queue but is blocked: it needs a Census source that a person has not picked yet.
- T-091 has no dependencies, and its option is already chosen.

**The brief's 24 criteria:**
- **E-25 amendment (1–9):** a dated T-091 marker in the `climates_outside_group` bullet. It names Dkaattae, 2026-10-27 and option (a), says the rule is unchanged, and points to E-27.
- **Counts (5–7):** the amendment states three counts — 22, 18 and 8 in E-27 — and each must equal the count computed from the committed bank. "cold" is matched as a substring because Virginia's answer has "colder" and T-090 counted it among the 22.
- **Other names (8–9):** the amendment must name the options not taken, (b) to (d), and the NY, RI and CA questions still read as `too hard`.
- **E-27 (b) (10–12):** the Owner line is replaced by the decision record. The `**47**` / `**0**` strings that an existing test reads must stay.
- **Freezes (13–20):** everything else in E-25 and E-27, every other entry, the bank, and all non-test source stay byte-identical.
- **Boundaries (21–24):** no dependency change, a limited diff scope, no network in tests, and the whole suites green.

**For whoever runs the next steps:**
- **Plan to attend the tester step.** At least five guards hash `engineering-decisions.md` and will go red by design, so a Test change request is near certain. The brief lists them under Constraints: `agriculture-true-wrong-answers-verify`, `map-click-no-candidates-verify`, `test_t089_tester_criteria.py`, `seed-level-loose-ends-verify` and `familiarity-drawn-apart-verify`.
- **Stale queue line:** the T-091 entry still says "Test cost: regenerates both committed files". That stopped applying once option (a) was chosen. The brief says so; I left the queue text alone.
- **Reviewer should escalate the PR:** it records a trade in content children read. This is in Constraints.
- **Not run:** I ran no build, tests or pipeline. Everything above came from reading the committed files.
