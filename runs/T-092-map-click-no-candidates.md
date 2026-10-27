# T-092 — Stop generating candidates for `map_click` — run log

**Task:** T-092 · **Branch:** `claude/funny-mendel-s8b39y` · **PR:** #98
**Started:** 2026-10-27 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-10-27
`Next step` on entry: none (no brief) → on exit: `human` — answer **Q1** below, then `task-expander` finalises the criteria

**TL;DR: T-092 is expanded but blocked.** A person has to answer Q1 before any code is written. The brief, branch and draft PR #98 are all pushed. The brief is set to `Status: blocked`, `Next step: human`.

**Why it is blocked:** each `map_click` question's `level` is worked out from its four candidates. The level stage (`question-bank/src/seed-level.ts`) adds 0.5 for each nearby candidate, and on map questions that is nearly always +1.5 (E-22). The served bank includes `level`, and the server picks questions by level. So the queue entry asks for two things that cannot both hold:
- **Its goal:** stop picking candidates for `map_click`.
- **Its Done-when:** "`content.json` is unchanged".

Which one gives way changes the difficulty a child is served, so it is a person's call.

**Q1, the options:**
- **(A) Levels unchanged.** No candidates in the question file, `content.json` byte-identical. The would-be candidates are still worked out, but only inside the level calculation.
- **(B) Drop the term for `map_click`.** Nearly all 50 levels fall by 1.5.
- **(C) Replace it with a new input** that needs no candidates, e.g. how many states border this one, capped at 3.
- **(D) Don't do T-092.** Record in E-29 why the candidates stay.

**Draft criteria:** 18 are written, not approved. Criteria 10–12 depend on Q1. Criterion 8 (a state with no centroid) also needs the person to confirm it.

**What was done:**
- **Sweep:** none needed. `tasks/` held no brief, and T-051's reviewer had already done the sweep.
- **Pick:** T-092 by queue order. T-070, T-084, T-085, T-088, T-091 and T-056 are all waiting on a person.
- **`tasks.md`:** T-092 is marked `doing — waiting on a person`, and T-084 has a new "skipped again" line.
- **Commits:** `T-092 expander: map-click-no-candidates (blocked on Q1)` and `T-092 expander: record PR #98`. They touch only `tasks/` and `tasks.md`.
- **Push confirmed:** `origin/claude/funny-mendel-s8b39y` is at `7c3ab08`. It differs from `main` in those two files only.
- **Sessions row:** added. The session id is shared with the other subagents because this run is relayed.
- **Nothing was run:** no build, tests or pipeline. The findings come from reading the source and the committed question file.

**To unblock:** write the chosen letter in the brief's Q1 section or on PR #98, then start `task-expander` again. It will finalise criteria 10–12 and set `Status: awaiting approval`.

Files:
- /home/user/geo-discovery-zone/tasks/T-092-map-click-no-candidates.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/98

## Orchestrator notes
- **G5:** Status moved (no brief → `blocked`), Next step moved (none → `human`). Not a stall.
- **`Approved:` not stamped:** the run halted on `Next step: human` before any build step; the stamp is left `pending` for the resumed expander/approval.
- **Process slip:** the orchestrator's header read used `head -20`, which on this brief includes the `Fault:` line (line 11). No role was spawned after it, so nothing it says reached a prompt. Next run should cap the read above `Fault:` or grep only the header fields.

## Halted
The expander asks a person to answer **Q1**: "the queue entry's Done-when ('`content.json` is unchanged') and its motivation ('E-21's distractor code still picks them') cannot both hold, because every served `map_click` `level` is computed from those candidates; which one gives way is a person's call." Choose (A) levels unchanged, (B) drop the term, (C) replace with a candidate-free input, or (D) don't do T-092 — and confirm criterion 8 (state with no centroid). Then start `task-expander` again.
