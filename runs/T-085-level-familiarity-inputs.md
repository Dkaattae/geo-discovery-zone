# T-085 — Level inputs the weights cannot reach: drawn apart, and capital is the largest city — run log

**Task:** T-085 · **Branch:** `claude/loving-knuth-umj4pp` · **PR:** #107
**Started:** 2026-10-29 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-29
`Next step` on entry: (no brief) → on exit: `worker`

**TL;DR:** I wrote the T-085 brief, pushed it to `claude/loving-knuth-umj4pp`, and opened draft PR #107 (https://github.com/Dkaattae/geo-discovery-zone/pull/107). The brief is `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. Expect the run to stop at the tester for a person: this change makes many existing pin tests stale by design.

**Push confirmed:** `origin/claude/loving-knuth-umj4pp` is at `c0a76d6`. My two commits touch only `tasks/T-085-level-familiarity-inputs.md` and `tasks.md` (T-085 status changed from `todo` to `doing`).

**Why T-085:** it is the first queue entry whose dependencies are met. Section B is empty, and Dkaattae approved T-085's option, list and accepted risk on 2026-10-27. `tasks/` held no leftover brief.

**What the brief asks for (27 criteria):**
- **Hawaii and Alaska, −2:** applies to identify-on-map, click-the-map and climate. Expected levels are HI 4.5 / 5.5 / 7.5 and AK 4 / 5 / 6. No other state or template changes.
- **Capital is the largest city, −1:** applies to `tpl-capital-of` only, for the states that a named U.S. Census Bureau release confirms out of the approved 17. E-22 must record each state's two populations and say whether it was confirmed or left out. The states that get the reduction must equal the states E-22 marks confirmed.
- **Everything else holds still:** every other question keeps its level. The 0–18 clamp is tested at the 0 boundary. `seedLevels` stays pure. Every new number and state id must come from `LEVEL_SEED_WEIGHTS`. The module's exports do not change.
- **Committed files:** both are regenerated and must match exactly (`question-bank/data/questions/us-states.json`, `backend/app/data/content.json`). The entity bank does not change.
- **E-22:** gets a dated paragraph and a before/after table of the levels that changed. It records the accepted Providence 10 → 9 risk. Its statements that `familiarity_bonus` is 0 must go, and its level-range sentences must be corrected. The T-025 table and every other E-n entry stay unchanged.
- **Negative:** no new dependency, no network in tests, `openapi.yaml` unchanged.

**Calls I made that a person may want to look at:**
- **Amounts pinned at −2 and −1.** The queue says the task "may tune" them. A criterion whose expected value the worker picks cannot be tested, so tuning has to come back through the expander.
- **Census check, no guessing.** If the worker cannot reach a Census release, it must stop as `blocked` for a person. It may not fill the table from memory, and it may not drop all 17 states just to get green.
- **Review checklist:** a person checks the Census figures, at least for TN, WV and WY, which the queue flagged as close calls.

**Already true (from my survey):**
- The `familiarity_bonus` term exists as a scalar 0 in `question-bank/src/seed-level.ts`.
- `levelFor` and `nearDistractorCount` are already unexported.
- `ageBand` depends on the template, not the level, so it will not move.
- I read the starting levels from the committed question file and wrote them into the brief.

**Files:**
- /home/user/geo-discovery-zone/tasks/T-085-level-familiarity-inputs.md
- /home/user/geo-discovery-zone/tasks.md

## Approval — 2026-10-29
Orchestrator wrote the unattended-run `Approved:` stamp (not a certification of the criteria).

## Round 2 — worker — 2026-10-29
`Next step` on entry: `worker` → on exit: `human` (Status `awaiting approval` → `blocked`)

**T-085 is blocked and I built nothing.** The brief requires a U.S. Census Bureau release for the 17 capitals, and the session proxy refuses every Census host with a 403. As the brief's Constraints require, I did not fill the table from memory and did not mark all 17 left out. Status is `blocked`, Next step is `human`.

- **Pushed:** commit `e02fa6f` ("T-085 worker: blocked, Census Bureau hosts refused by the session proxy") is on `origin/claude/loving-knuth-umj4pp`. `git log origin/claude/loving-knuth-umj4pp -1` shows it.
- **Changed:** only `/home/user/geo-discovery-zone/tasks/T-085-level-familiarity-inputs.md` (Status, Next step, Sessions row, Handoff, Notes). No code, data or tests were touched.

**What was refused:** `api.census.gov`, `www.census.gov`, `data.census.gov` and `www2.census.gov`. The proxy status endpoint logs each as `connect_rejected` (403 to CONNECT). Wikipedia and Wikidata are reachable. I made one test query to Wikidata: Memphis's 2020 population cites the 2020 Census, but Nashville's has no `stated in` reference. So Wikidata would be a secondary source with patchy references, and I did not use it.

**Decision needed (proposed owner: Dkaattae)**, one of:
1. **Allow `*.census.gov`** for the worker session, then re-run `worker`. This is the preferred option.
2. **Supply the 17 rows by hand** from one named release, written into the brief's Notes, for the worker to transcribe.
3. **Accept Wikidata figures that cite a named Census release.** This changes how criterion 7 is read, so the brief goes back to `task-expander` for re-approval.

**Not done, on purpose:**
- **The Hawaii/Alaska half was not landed alone.** It needs no external source, but the criteria describe one regenerated bank with both changes. If someone wants it done first, the Handoff proposes splitting it into T-085a (Hawaii/Alaska) and T-085b (largest city). Expander to decide.
- **The Handoff records the planned code shape** (`familiarity_bonus` as an object in `LEVEL_SEED_WEIGHTS`, summed in `levelFor` before the clamp), so the next worker starts fast.

**For the orchestrator to check:**
- **Same session id for both roles.** `$CLAUDE_CODE_REMOTE_SESSION_ID` returned the expander's id, `cse_011oDiJdDaFDaDrfHH2XNp8P`. The tester relies on the Sessions table to confirm it is a different session, so the relay may be passing one id to every role it spawns.
- **Census is outside the web harness's allowed hosts.** Any future task that needs Census figures will hit the same block. I suggested a `process-tasks.md` entry or an allowlist change, owned by Dkaattae.

## Halted — 2026-10-29
`Status: blocked`, `Next step: human`, at branch head `e02fa6f`. The worker asks Dkaattae to choose one of: (1) allow `*.census.gov` and re-run the worker; (2) supply the 17 capital/largest-city rows from one named Census release in the brief's Notes; (3) accept Wikidata figures citing a named Census release, which sends the brief back to the task-expander. Optional: split into T-085a (Hawaii/Alaska) / T-085b (largest city). Shared session id across roles is known (skill §4, P-14).

## Human answer — 2026-10-29
Dkaattae, in the orchestrator's session, answering the halt above: "split it — do T-085a now".
Orchestrator recorded it in the brief header as a `Decision:` line, set `Status: human decision recorded` and `Next step: task-expander`, and re-spawned the task-expander (the split rewrites criteria, which only the expander may do).

## Round 3 — task-expander (split) — 2026-10-29
`Next step` on entry: `task-expander` → on exit: `worker` (Status `human decision recorded` → `awaiting approval`)

**TL;DR: The brief is rewritten as T-085a, which covers only the Hawaii and Alaska "drawn apart" change. The largest-city half is now a new queue entry, T-085b. The push to `claude/loving-knuth-umj4pp` landed at `5b42feb` (local and remote heads match), and PR #107 has the new title and criteria as its body. Next: approval, then `worker`.**

**Header now reads:**
- **Status:** `awaiting approval`
- **Next step:** `worker`
- **Approved:** back to `pending`. The criteria were rewritten (27 became 25), so the earlier unattended stamp no longer covers them. Under an unattended run the orchestrator has to re-stamp before the worker starts.
- **Decision line:** Dkaattae's split decision is kept as it was.

**What T-085a pins (25 criteria):**
- **Six levels drop by exactly 2.** Hawaii: map identify 6.5→4.5, map click 7.5→5.5, climate 9.5→7.5. Alaska: 6→4, 7→5, 8→6.
- **The other 409 questions keep their levels**, including all 50 capital questions.
- **No largest-city data ships**, not even a placeholder at 0 (criterion 6).
- **Clamp at 0 tested on synthetic inputs:** a level of 1.5, 2 or 2.5 before the reduction gives 0, 0 and 0.5.
- **Every value comes from `LEVEL_SEED_WEIGHTS`:** setting the amount to 0 gives back the old levels, and setting it to 3 moves only the six questions.
- **Exports stay the same.**
- **Both committed files are regenerated.**
- **E-22 gets:** a dated paragraph, a table of the six changes, and a note that the largest-city input is not landed and is T-085b's to decide.
- **Negative checks:** no new dependency, no network, `openapi.yaml` unchanged.

**What the brief notes is already true:**
- The `familiarity_bonus` term, a single 0, is at `seed-level.ts:68` and subtracted at line 221. The clamp already exists.
- Baseline levels for every Hawaii and Alaska question are in a table, read from the question file at `5ae564a` (`origin/main`, which is also the merge base). The bank has 415 questions with levels 3 to 10.
- E-22's range sentences will very likely stay true, since 4.5 and 4 are above the lowest map level of 3.5. Criterion 18 checks this anyway.

**A risk I flagged for the worker:** the existing test at `seed-level.test.ts:182` checks the constant against E-22's text, but only reads numbers, arrays and one level of nesting. A deeper shape for `familiarity_bonus` would turn it red. The worker either keeps a shape the test can read or lists the test under Tests made stale.

**Changes in `tasks.md`:**
- The T-085 entry now opens with a "Split 2026-10-29" note and is marked `doing (as T-085a)`.
- New T-085b entry, `todo`. It carries:
  - the 17-capital list approved on 2026-10-27, with the close calls flagged
  - the Census access problem and the three options a person can pick from
  - a pointer to the accepted Rhode Island risk
  - the open question of how two reductions combine on one question
  - its dependency on T-085a being merged first

**Left alone:**
- The worker's round-1 Handoff and Notes. I added an expander note under Notes saying that Handoff was written for the unsplit brief.
- `PROGRESS.md` is unchanged.

**Files in my commit:** only `tasks.md` and `tasks/T-085-level-familiarity-inputs.md`.
- /home/user/geo-discovery-zone/tasks/T-085-level-familiarity-inputs.md
- /home/user/geo-discovery-zone/tasks.md

**PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/107

**Sessions row:** added. `$CLAUDE_CODE_REMOTE_SESSION_ID` gave the same id as the earlier expander and worker rows again (cse_011oDiJdDaFDaDrfHH2XNp8P). The tester must check that its own session id is different.

## Approval — 2026-10-29 (T-085a)
Orchestrator re-wrote the unattended-run `Approved:` stamp for the split brief (not a certification of the criteria). Dkaattae's "do T-085a now" authorised the split, not the 25 criteria, which no person has seen.
