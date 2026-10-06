# T-079 — `highest_point_m` is the state's high point, not the mountain's summit — run log

**Task:** T-079 · **Branch:** `claude/great-keller-n8v6cq` · **PR:** #71
**Started:** 2026-10-05 · **Outcome:** ready for merge (escalated — a person must confirm the three values and the criteria)

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

## Round 3 — worker — 2026-10-06
`Next step` on entry: `worker` → on exit: `tester` (`Status: awaiting verification`)

**TL;DR:** I built T-079 and pushed it as commit `185f926` to `claude/great-keller-n8v6cq`. `git log origin/claude/great-keller-n8v6cq -1` shows that commit. CT, OK and VA now ship 727.2, 1516.4 and 1740.6 from a curated override, with one build warning each. In the full suite, 1524 tests pass and **11 fail**. All 11 are old tests that my change breaks on purpose; each is listed by name in the brief's Handoff. Typecheck, lint and format check pass. **Next:** the tester, in a new session, who needs a person to approve changing those 11 tests.

- **Brief:** Status is now `awaiting verification` and Next step is `tester`. I added a worker row to Sessions and filled in the Handoff and Notes.
- **Same session id:** my session id is `cse_01F7wKd4WT75r6pKhzRsTbbB`, the same as the expander's. Please make sure the tester runs under a different one.

**What changed**
- **`question-bank/src/curated/us-states.ts`:** each state can now carry `highest_point_m: { metres, source }`. Only CT, OK and VA have one, and the source text includes revision `1377209854`.
- **`question-bank/src/normalize.ts`:** new `resolveHighestPointMetres`.
  - A state without an override gets exactly what `resolveElevation` gives it.
  - A state with one ships the curated value and gets exactly one `highest_point_m` warning. That warning names the Wikidata value, or says Wikidata has none or one it could not read. It never says "left blank".
- **`question-bank/data/us-states/us-state-{ct,ok,va}.json`:** only the `highest_point_m` line changed, from an offline rebuild. Compared with `323254c`, the other 47 files, both fixtures, and every `package.json` and `bun.lock` are unchanged.
- **`question-bank/src/highest-point-in-state.test.ts`:** new, 14 tests, all passing. They cover criteria 7–15 and use no network.
- **`engineering-decisions.md`:** I added E-19. E-1 to E-18 are unchanged.

**The 11 failing tests.** All of them passed on this branch before my change (1521 pass, 0 fail).
- **Expected by the brief:**
  - `highest-point-metres.test.ts`: criterion 14, which expects no elevation warnings.
  - `highest-point-verify.test.ts`: T-016 criterion 9, which expects zero warnings.
  - Four checks that compare each state file's hash with the main branch. They are in `highest-point-verify.test.ts` (T-016 c6), `climate-kid-verify.test.ts`, `landmarks-verify.test.ts` and `top-crops-verify.test.ts`.
- **Not on the brief's list:**
  - Four T-069 tests in `highest-point-metres-verify.test.ts`: two under criterion 11 and two under criterion 15.
  - `refresh.test.ts`, "criteria 3, 6–9, 11 — a changed refresh". The three new warning lines also start with `  us-state-`, so it now counts 4 such lines instead of 1.

**Where the brief was wrong.** It said the checks at `highest-point-metres-verify.test.ts:385`, `:501` and `:537` would go red. They still pass.

**Calls for the reviewer to confirm or overturn**
- **One message per override:** when an override applies, its single warning replaces Wikidata's own unit warnings, since those describe a value that is not shipped.
- **Neutral wording:** "used curated X (source) instead of Wikidata Y". For VA the Wikidata number is simply wrong, not a summit in another state.
- **Override equal to Wikidata:** it still ships, and the warning says "delete the override". This makes E-19's deletion rule visible in the build output.

**Environment:** `node_modules` was missing in the container, so I ran `bun install --frozen-lockfile`. No tracked file changed.

## Round 4 — tester — 2026-10-06
`Next step` on entry: `tester` → on exit: `human` (`Status: test changes requested`, `Test changes: requested`)

**T-079 tester: all 21 criteria hold, but the task is halted on a Test change request.** 11 older tests are red, and this task's own change made every one of them stale. None of them is a code bug. A person has to approve the request in an attended tester session.

**Status:** `test changes requested` · **Next step:** `human` · **Test changes:** `requested`

**Pushed:** commit `2a1202d` is on `claude/great-keller-n8v6cq`, and I confirmed it there with `git fetch` and `rev-parse`.

**Independence: weaker than a separate session.** My session id `cse_01F7wKd4WT75r6pKhzRsTbbB` is the same one the expander and worker rows list. That is expected in an orchestrated run (`runs/T-079-highest-point-in-state.md` exists), so the id check proves nothing either way. What I can claim is narrower: I was freshly spawned with my own context, and I saw only what is committed, not the worker's reasoning. That depends on the orchestrator having spawned me correctly, which I can't check myself. The Verdict says this.

**What I did**
- **New test file:** `/home/user/geo-discovery-zone/question-bank/src/highest-point-in-state-verify.test.ts`, 114 tests, all green.
  - Every criterion has at least one test.
  - Expected values come from the criteria, plus sha256 digests of the files at `323254c`.
  - Criteria 9–15 call `normalizeUsStates` directly; no network.
  - Only the criteria 1–3 test runs a build, and it runs offline.
- **Whole `question-bank` suite:** 1638 pass, 11 fail.
  - The 11 failures are exactly the worker's "Tests made stale" list. I found no others.
  - Typecheck, lint and format:check are green.
- **Mutations:** 8, each reverted, and `git status` was clean afterwards. Each one turned the matching tests red:
  - ignoring the override
  - keeping Wikidata's own warnings next to the override's
  - dropping the Wikidata value from the warning
  - dropping warnings for states with no override
  - swapping which label wins
  - changing CT's value from 727.2 to 727
  - no warning when Wikidata has no value
  - editing a byte in a data file
- **Stale tests:** I checked each one and confirmed it is red only because of a change the criteria require.
  - The four digest guards stop at the first file that differs, so they can't show whether anything else moved. My criterion 5 test does: the other 47 state files are byte-identical to `323254c`.
  - The `:385/:501/:537` value checks the brief expected to go stale still pass.
  - One test-count floor covers an affected file: `climate-kid.test.ts` requires `landmarks-verify.test.ts` to keep at least 36 tests. All 11 requested changes are modifications, not deletions, so it still holds.

**Brief updates** (`/home/user/geo-discovery-zone/tasks/T-079-highest-point-in-state.md`)
- Header: Status, Next step, Test changes and Fault set as above, plus my Sessions row.
- `## Verdict`: a table mapping each criterion to its evidence, the mutation results, and the independence caveat.
- `## Test change request`: 11 rows, all "modify", each with the commit and task that introduced it, why it went stale, and exactly what it should assert instead.
  - Rows 7–10 (digest guards) share one fix: restore CT 748, OK 1737 and VA 1825 before hashing. The guards that match the raw line need their regex widened from `\d+` to `[\d.]+` so it matches decimals like 727.2.
  - Row 11 (`refresh.test.ts`) should count only change lines, the ones containing ` → `, and assert that the only other matching lines are the three override warnings.

**What happens next**
- A person starts an attended `tester` session for T-079 and approves or refuses each row.
- That tester applies the approved rows, reruns the suite and gives the final verdict.
- No row has been applied, and I changed no source.

**Two things for the reviewer** (both noted in the Verdict; neither fails a criterion):
- **Override warnings print on every build**, by design under criteria 10–11.
- **An override equal to Wikidata's value** still ships and warns "delete the override". No criterion covers that case.

## Halted — test change request — 2026-10-06

Raised in `2a1202d`. The orchestrator did not read the request rows. Under D-15 the request can only be approved by a person, in an attended `tester` session for T-079. That tester applies what is approved and finishes verifying. After it returns, start a new run from the brief's `Next step`, which should be the reviewer.

## Human answer — 2026-10-06

Dkaattae, in the orchestrator session: "start the tester for T-079, I'll approve the changes". The orchestrator did not spawn a tester and did not record an approval (D-15). Meanwhile an attended tester session had already pushed `cd2dc04` (apply approved test change request) and `a337271` (verdict pass after approved test changes). The run resumes from the brief's `Next step`.

## Round 5 — reviewer — 2026-10-06
`Next step` on entry: `reviewer` → on exit: brief deleted by sweep; PR #71 marked ready, escalated

**I approved T-079 and escalated it.** PR #71 is marked ready for review but must not be merged until a person decides on two points: the three numbers children will see, and criteria nobody read. The sweep is in the PR. My commit `28b9850` is pushed to `claude/great-keller-n8v6cq`, and I confirmed the remote head matches. The PR is no longer draft, its head is `28b9850`, and it is not merged.

**Before merging, a person needs to:**
- **Check the numbers.** CT 727.2, OK 1516.4 and VA 1740.6 m become quiz values. They come from en.wikipedia "List of U.S. states and territories by elevation", revision 1377209854. The brief's Constraints require a person to see child-facing data.
- **Read the criteria.** `Approved:` is the orchestrator's stamp, which says "criteria not read". The Q3 values were inferred by the orchestrator and then confirmed by Dkaattae in the orchestrator session. The PR body is the first place a person sees the criteria.

**Review: no blocking findings.**
- **Every role's work is in the PR.** Each Sessions row has a commit on the branch: expander ×2, worker, tester ×2.
- **Each role stayed in its lane.**
  - Expander commits touch only `tasks/` and `tasks.md`.
  - The worker commit touches no pre-existing test.
  - Tester commits touch only tests and the brief.
- **Test changes match what was approved.** The 11 changes are all modify, all in tester commit `cd2dc04`, and match the rows a person approved in attended session `cse_01Lyx9VoiaH1j4L9JD3hZYUG`. That person gave no name. I copied the rows into the PR body, because the sweep deletes the brief.
- **Scope and docs are fine.** Nothing changed outside the Constraints. The code follows the house style, and E-19 and the header comment in `curated/us-states.ts` are accurate.
- **Checks re-run by me on `79f85b8`:** `bun test` gives 1649 pass, 0 fail. Typecheck, lint and format:check are all green.

**The worker's three flags:** all confirmed.
- One override warning replaces Wikidata's own elevation warnings.
- The warning wording stays neutral.
- When Wikidata equals the override, the build warns "delete the override".
- One non-blocking caveat, noted in the PR with no task created: that last check needs exact equality. If Wikidata changed to 727, the "delete" message would not appear, but the normal warning still prints both values.

**What the sweep changed:**
- **Brief deleted:** `tasks/T-079-highest-point-in-state.md`. Its criteria are now in the PR body, word for word, with what verified each one. Because the brief is gone, there is no Status, Next step or Sessions row to update.
- **`/home/user/geo-discovery-zone/tasks.md`:**
  - Removed the T-079 entry.
  - Amended T-070 with two notes rather than opening a new task, since (a) already owns the digest-guard question:
    - T-079 is a seventh neutralisation, of the same "restore a corrected value" kind.
    - Every full build and every changed refresh now prints three override warning lines.
- **`/home/user/geo-discovery-zone/PROGRESS.md`:**
  - Added a T-079 entry under "Completed tasks", including where it differed from the brief.
  - Updated the question-bank `highest_point_m` line, which still said CT, OK and VA were wrong.
- **No other queue task** got larger, smaller or unnecessary.

**Next step: a person** confirms the three values and the criteria, then merges PR #71: https://github.com/Dkaattae/geo-discovery-zone/pull/71

## Ended — 2026-10-06

Roles in order: task-expander → (human answer) → task-expander → worker → tester → (attended tester, outside this run) → reviewer. The run ends at a ready PR, escalated. No role merges (D-4).
