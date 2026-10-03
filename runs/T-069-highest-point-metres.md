# T-069 — `highest_point_m` carries feet for some states — run log

**Task:** T-069 · **Branch:** `task/T-069-highest-point-metres` · **PR:** #70
**Started:** 2026-10-03 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-03
`Next step` on entry: (no brief) → on exit: `worker`

**TL;DR:** I wrote the T-069 brief and pushed it to `task/T-069-highest-point-metres`, and draft PR #70 is open (https://github.com/Dkaattae/geo-discovery-zone/pull/70). The brief is `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. A human, or the orchestrator's unattended stamp, approves it next, and then the worker runs.

**Why T-069:** it is the first entry in `tasks.md` whose dependencies are done. T-064 comes earlier but depends on T-040, which has not run.

**Push confirmed:** `origin/task/T-069-highest-point-metres` is at `fbe3db0 T-069 expander: highest-point-metres`. The diff against `origin/main` touches only `tasks/T-069-highest-point-metres.md` and `tasks.md`, so it stays within what my role may write.

**The brief:**
- **Branch header:** `task/T-069-highest-point-metres`, the branch actually pushed. No branch was assigned to this session, so I created one from `origin/main` at `e10f94d`.
- **PR header:** #70, which matches the PR that was opened.
- **Sessions row:** task-expander, 2026-10-03, `cse_01SUGoHdt5tMKsMnrvhWFDqg`.
- **21 criteria in four groups:**
  - **Unit handling (1–7):** metre values pass through; feet are converted; an unknown unit or no unit gives no field plus a warning; mixed units resolve to metres; the live `build` and `refresh` paths apply the same fix.
  - **Committed bank (8–13):** AZ, OR, NE, KS and IA must fall in bounded metre ranges; AK stays 6190; no state exceeds 6190; only the corrected states change, and nothing else changes, `built_at` included; the offline rebuild still matches byte for byte.
  - **Where the unit comes from (14–16):** a real recorded Wikidata response; no hand-typed elevations; a refresh re-records whatever the offline build reads.
  - **Cross-check and guardrails (17–21):** a hand cross-check of all 50 states in the Handoff; no new dependency; no network in tests; nothing outside `question-bank/` changes; the suite is green.

**What the next roles should know:**
- **Re-sized from S to about M.** The unit has to come from one new live call to `query.wikidata.org`. If the worker has no network, the brief tells it to block rather than hand-write the data. Worker model: Opus.
- **A Test change request halt is expected.** Changing five bank files breaks the pinned-digest guards (`landmarks-verify`, `climate-kid-verify`, `top-crops-verify`, `highest-point-verify`), as happened on T-068. Under an unattended run, the tester will halt for a person.
- **A full refresh is ruled out.** Re-recording the main fixture would move all 50 files and would ship Alaska's capital as "Q29445" (T-077). Criterion 12 forbids it.
- **New queue entry T-079.** CT (748), OK (1737) and VA (1825) are metre values, but they look like the mountain's summit rather than the state's high point, or simply wrong. My reference figures for these are from memory and unverified. They are out of scope here, and T-079 depends on T-069.
- **`tasks.md`:** T-069 is marked `doing`, with a pointer to the brief.
- **`PROGRESS.md`:** not touched.

**Files:**
- /home/user/geo-discovery-zone/tasks/T-069-highest-point-metres.md
- /home/user/geo-discovery-zone/tasks.md

### Approval — orchestrator — 2026-10-03
Unattended stamp written to the brief header. The criteria were not read.
