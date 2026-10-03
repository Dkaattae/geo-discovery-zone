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

## Round 2 — worker — 2026-10-03
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** T-069 is built and pushed as commit `e64b016` on `task/T-069-highest-point-metres`; `git log origin/task/T-069-highest-point-metres -1` shows it. The five states shipped in feet now ship metres taken from a real Wikidata recording of each elevation's unit, and nothing else in the bank moved. 70 tests that existed before this task now fail by design. I left them alone, and each one is listed in the brief's Handoff with a proposed fix.
**Next:** the tester runs in a fresh session and raises the Test change request for those 70 reds. A person has to approve it before the suite can go green. Status is `awaiting verification`, Next step is `tester`.

**What changed** (all under `question-bank/`):
- **Bank:** only `highest_point_m` in five files changed:

  | State | Before | After |
  |---|---|---|
  | AZ | 12622 | 3847 |
  | OR | 11237 | 3425 |
  | NE | 5429 | 1655 |
  | KS | 4039 | 1231 |
  | IA | 1670 | 509 |

  The other 45 files, `index.json`, `built_at` and `sample-data/` are byte-identical to `main` at `e10f94d`. An offline rebuild reproduces the bank exactly.
- **New query and recording:** a second query reads each elevation together with its unit, and its answer is recorded in `src/fixtures/us-states-elevation.sparql.json`. That recording is the one live call, made 2026-10-03T21:16:45Z (55 rows, all 50 states). The main fixture and main query are untouched.
- **How a value is chosen** (`src/normalize.ts`, new `resolveElevation`):
  - **Metres:** if a state has metre values, the largest one ships unchanged.
  - **Feet:** otherwise, feet are converted and rounded to whole metres.
  - **Anything else:** an unknown unit, a missing unit, or no unit data at all leaves the field blank and adds a warning.
- **Live paths:**
  - **`build.ts`:** now importable, with an injectable transport, so a test can drive a live build without the network.
  - **`refresh.ts`:** makes both queries and re-records both fixtures.
  - **`src/fixture-transport.ts` (new):** offline builds read the elevation recording from the same folder as the main fixture.
- **Tests:** `src/highest-point-metres.test.ts` adds 23 tests, all passing. Typecheck, lint and `format:check` are clean.
- **Suite:** 1372 pass, 70 fail.

**The 70 stale reds:**
- **Digest guards (4):** the existing bank-guard tests in `landmarks-verify`, `climate-kid-verify`, `top-crops-verify` and `highest-point-verify` (T-016 criterion 6). They fail because five files' bytes changed. The proposed fix is to ignore `highest_point_m` in those five files, or re-pin them under T-070.
- **Main fixture parsed alone (51):** T-016 criterion 9 and all 50 cases in `data-us-states.test.ts` parse only the main fixture, so they now see no units. Each needs a one-line change to also read the elevation recording.
- **Refresh fakes (15):** 6 tests in `refresh.test.ts` and 9 in `refresh-verify.test.ts` use fake transports that answer every query with the main recording.
  - **Basic fix:** the fake should answer the elevation query from the elevation recording.
  - **Extra edit in `refresh-verify`:** its `warningLines` helper must change too, or two tests that pass today go red.

I tried every proposed fix on a throwaway copy and confirmed it works; nothing was committed from that. No test pins a per-file test count that this change moves.

**Cross-check (criterion 17):** the Handoff has a 50-row table against Wikipedia's state-elevation list (revision 1377209854, which cites NGS and Peakbagger rather than Wikidata). The five corrected states are within 0.2% of it. Only Connecticut (+2.9%), Oklahoma (+14.5%) and Virginia (+4.8%) differ by more than 2%. All three are T-079's wrong-point cases, not unit errors, and are left unchanged.

**Calls for others to confirm:**
- **Mixed snapshots** (reviewer): the elevation recording is from October and the main fixture from August. They agree on every state stated in metres, and the next real refresh re-records both together.
- **Rounding and preference** (reviewer):
  - **Metres over feet:** a metre value wins when both exist.
  - **Feet rounding:** converted feet are rounded to whole metres.
  - **Disagreement warning:** a metre and foot pair that disagree by more than 1% raises a warning.
  - **Unknown unit next to a good value:** the good value ships with a warning.
- **Missing elevation recording** (reviewer): an offline build fails outright rather than blanking all 50 elevations.
- **Reading of criterion 11** (tester; if it doesn't hold, it goes to task-expander): Arizona, Oregon and Iowa carry both a metre and a foot value on Wikidata. I count them as "recorded unit is not only metre".
- **Main query still fetches the unitless elevation** (reviewer): changing its text would make the main fixture no longer match its recorded query. Whether to drop it at the next refresh is the reviewer's call.
- **Same session id** (tester): this session's id matches the expander's (`cse_01SUGoHdt5tMKsMnrvhWFDqg`). The tester must run in a different one.
- **Already-known problem:** `sample-data/` was already out of date on `main`. I left it unchanged, and T-064 already owns it.

Files:
- question-bank: README.md, src/queries/us-states-elevation.ts, src/fixtures/us-states-elevation.sparql.json, src/fixture-transport.ts, src/normalize.ts, src/sources/wikidata.ts, src/build.ts, src/refresh.ts, src/highest-point-metres.test.ts
- tasks/T-069-highest-point-metres.md (Handoff, the 50-row table, the stale-test list, Notes)
