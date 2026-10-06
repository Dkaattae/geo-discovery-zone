# T-079 — `highest_point_m` is the state's high point, not the mountain's summit — run log

**Task:** T-079 · **Branch:** `claude/great-keller-n8v6cq` · **PR:** #71
**Started:** 2026-10-05 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-05
`Next step` on entry: no brief (`tasks/` empty) → on exit: `human` (`Status: blocked`, `Approved: pending`)

**I've halted T-079 for a human. The brief is written but blocked: `Status: blocked`, `Next step: human`, `Approved: pending`.** It is on draft PR #71, and the push is confirmed: `origin/claude/great-keller-n8v6cq` is at `e2b17b7`.

The brief can't be frozen yet. Before writing bounded criteria, someone has to pick a rule for numbers a child will read, and `tasks.md` and `CLAUDE.md` leave that to a person.

**What needs deciding** (all in the brief, with my recommendation for each):
- **Q1: what `highest_point_m` means.**
  - (a) The highest point inside the state. Recommended.
  - (b) The summit of the feature named in `highest_point`.
- **Q2: how CT, OK and VA get a correct value.**
  - (i) A curated override that wins over Wikidata, recorded as a new E-19. Recommended. This reverses E-8's "never overrides" rule, but only for this one field.
  - (ii) Leave the three blank, with a warning.
  - (iii) Fix Wikidata and re-record the fixture. No role in the loop can do this.
- **Q3: which source and how precise.** T-069 used en.wikipedia revision 1377209854, which gives CT 727.2, OK 1516.4 and VA 1740.6. I did not pick the numbers.

To resume: answer Q1–Q3 in the brief and set `Next step: task-expander`. If the recommended answers are accepted, the 15 draft criteria already in the brief stand, with the Q3 numbers filled in. After that the brief needs approval as usual.

**What the survey found:**
- **All three values are metre statements on Wikidata**, so this is not a unit problem.
  - CT's value is from Q1950492 (748), OK's from Q880398 (1737) and VA's from Q688645 (1825).
  - For CT and OK, Wikidata is right about the mountain. A query change cannot fix them under rule (a).
  - VA is a plain data error.
- **Changing these values will make existing tests stale.** `highest-point-metres-verify.test.ts:385/501/537` and the four digest guards owned by T-070 pin the current values. Those changes will have to go through the tester's Test change request.

**Picking and committing:**
- **Why T-079:** section A is empty, and T-064 depends on T-040, which is not done, so T-079 was the next task in the queue.
- **The last cycle was clean:** `tasks/` was empty when I started.
- **What I committed:** the brief, plus T-079's status in `tasks.md` changed from `todo` to `doing`. Nothing else, and no source, tests or config.

Files:
- /home/user/geo-discovery-zone/tasks/T-079-highest-point-in-state.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/71

## Halted — 2026-10-05

Gates: G5 passed (a brief now exists with `Status: blocked`). The halt is `Next step: human` with `Status: blocked`, which the expander wrote. The brief was not stamped `Approved:`. That stamp comes only after the expander's criteria are final, and nothing was built.

What a human has to decide is the expander's list, quoted above: **Q1 to Q3**. Answer them in the brief, set `Next step: task-expander`, commit, and start a new run.

Orchestrator note: this brief's `Fault:` line falls inside the first 20 header lines, so a `head -20` read it. No spawn followed the read, so nothing could carry it forward.

## Human answer — 2026-10-06

Dkaattae, in the orchestrator session: "accept the recommended answers and resume the run". The orchestrator wrote it into the brief as `### Answers` (`e6d9b11`): Q1 (a), Q2 (i), and labels unchanged. Q3 had no recommendation, so the orchestrator recorded T-069's reference (revision 1377209854): CT 727.2, OK 1516.4, VA 1740.6. `Next step` was set to `task-expander`.

## Round 2 — task-expander — 2026-10-06
`Next step` on entry: `task-expander` → on exit: `worker` (`Status: awaiting approval`, `Approved: pending`)

**TL;DR:** The T-079 brief is final, committed and pushed (`ba8cef4` on `claude/great-keller-n8v6cq`; I confirmed the remote head matches). PR #71's body now holds the 21 frozen-on-approval criteria. The brief is `Status: awaiting approval`, `Next step: worker`, `Approved: pending`.
**Before approval:** the numbers CT 727.2, OK 1516.4, VA 1740.6 come from an inferred answer, not an explicit one. Q3 had no recommended answer, and the recorded answer was "accept the recommended answers". The orchestrator took T-069's reference (revision 1377209854) at one decimal. Whoever approves is confirming those numbers. If the orchestrator records the approval unread, the first person to see them is at the reviewer's escalation.

**What the criteria encode** (the answers recorded in the brief: Q1 (a), Q2 (i), Q3 = T-069's reference, labels unchanged)
- **Shipped data (1–6):** CT, OK and VA get the new `highest_point_m` values. Only that line changes in those three files; an offline build keeps `built_at` stable (`build.ts:148`). The other 47 files are byte-identical to `323254c`. The `highest_point` labels are unchanged.
- **Curated override (7–8):** exactly CT, OK and VA carry one. Each records its source as data a test can read, containing `1377209854`.
- **Normalisation (9–16):**
  - When an override exists, it ships, and exactly one `highest_point_m` warning fires.
  - When Wikidata has a value, that warning contains both values. When the only elevation statements are in an unreadable unit, no warning says "left blank".
  - States without an override behave exactly as `resolveElevation` does today.
  - E-8 label precedence is unchanged. No network, and no spawning `build.ts`.
- **Decision record (17–18):** a new E-19 covering the rule, the mechanism, the reversal of E-8 for this one field, the three values with their source, and when to delete an override. E-1 to E-18 stay unchanged.
- **Must not happen (19–21):** the fixtures and lockfiles stay unchanged, and the full suite, typecheck, lint and format:check pass. Stale tests change only through an approved Test change request.

**One call I made from the answers:** criterion 11 makes an override warn even when Wikidata has no value at all. I read Q2's "each override raises a build warning" as covering that case. This is noted in the brief's Notes.

**Expected Test change request:** the brief lists the pre-existing tests this change makes stale. They are the 748/1737/1825 pins in `highest-point-metres-verify.test.ts`, the two "full build emits no warnings" tests (`highest-point-metres.test.ts:406`, `highest-point-verify.test.ts:458`), and T-070's digest guards. That makes a Test change request (moment 5, which needs an attended tester session) very likely.

**Files**
- /home/user/geo-discovery-zone/tasks/T-079-highest-point-in-state.md (the only file in my commit)
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/71

**Not touched:** `tasks.md` and `PROGRESS.md`. Nothing to sweep, since the queue entry is already marked `doing`.

## Approval — 2026-10-06

The orchestrator asked Dkaattae whether the worker should build with the Q3 values: T-069's reference, revision 1377209854, giving CT 727.2, OK 1516.4 and VA 1740.6. Answer: "Use these numbers". `Approved:` was then stamped as an orchestrator line, because no human has read the criteria.
