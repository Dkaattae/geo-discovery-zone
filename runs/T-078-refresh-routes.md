# T-078 — Point the other refresh routes at `bun run refresh` — run log

**Task:** T-078 · **Branch:** `claude/loving-darwin-jij761` · **PR:** #78
**Started:** 2026-10-13 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-13
`Next step` on entry: no brief (`tasks/` empty) → on exit: `worker` (`Status: awaiting approval`, `Approved: pending`)

I picked T-078, not T-084, and its brief is written, pushed and open as draft PR #78. It is waiting for approval; the next step is the worker. I skipped T-084 because one of its requirements is blocked behind T-070 (a), and I left a proposed split for a person to decide.

- **Brief:** `/home/user/geo-discovery-zone/tasks/T-078-refresh-routes.md`. It says `Status: awaiting approval`, `Next step: worker`, `Approved: pending`. The `Branch:` header is `claude/loving-darwin-jij761` and the `PR:` header is #78. The Sessions row is added.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/78, a draft against `main`, with the acceptance criteria as its body.
- **Push confirmed:** `git log origin/claude/loving-darwin-jij761` shows `4def7e1` (records PR #78 in the brief) on top of `353eec1` (`T-078 expander: refresh-routes`).
- **Diff against `origin/main`:** only `tasks.md` and the new brief. Nothing in source, tests or config. `PROGRESS.md` needed no change, because the reviewer had already swept T-077 and `tasks/` was empty.

**Why T-084 was skipped:**
- Its entry says it depends on nothing, but its done-condition requires re-recording the fixture and a live refresh that returns Juneau.
- Re-recording the fixture means running a refresh that changes the bank. That rewrites the build timestamp in all 50 state files and turns the four digest-check tests red.
- Fixing those tests is T-070 (a), which is waiting on a person's answer to Q1. The entry itself says to sequence it with T-070 (a).

**The split, for a person to decide:**
- **Now:** the query change, so labels are read as English first and then `mul` (the language-neutral label). This can be tested offline and changes no committed file. The recorded fixture already holds `Juneau` at `question-bank/src/fixtures/us-states.sparql.json:100`, and the offline replay finds the query by identity, not by its text.
- **Later:** the re-record and the live check would wait for the first refresh after T-070 (a).
- **Where it is recorded:** a "Skipped by the expander, 2026-10-13" note on T-084 in `/home/user/geo-discovery-zone/tasks.md`. T-078's queue status is now `doing`.

**What T-078's 18 criteria cover:**
- **Fun-fact drafts:** the live `runBuild` asks Wikipedia for a draft only for states with no fun fact. That is zero requests with today's data, where all 50 states have a curated fact.
- **Edge cases:** exactly one request when one state lacks a fact, none when it has no Wikipedia title, a warning when a request fails, the same rule for a `--states` subset, and `--no-fun-facts` still turning the pass off. Drafts go only to the review file, marked `reviewed: false`.
- **Fixture note:** `regenerate_with` in the main fixture names `bun run refresh`, and nothing else in that file changes.
- **Must not move:** the bank, the offline build's output, refresh behaviour, dependencies, and every existing test. No test reaches the network.

**Where it could stall:**
- **The single-missing-fact cases (3–8) have no ready-made route.** All 50 states have curated facts, so the tester has to blank one. The brief names a way that needs no new test hook: blank one state's curated fact in memory during the test and restore it afterwards (criterion 11). The worker may add a hook instead.
- **No existing test should need to change**, since none drives the live fun-fact pass today. If one does, it goes to a person under D-14 and the run halts at the tester.

## Halted — approval stamp refused — 2026-10-13

The orchestrator tried to write the unattended `Approved:` line into the brief
header, as `orchestrator.md` "Approval" says. The harness's auto-mode classifier
refused it as self-approval. Nothing was written: the header still reads
`Approved: pending`. The orchestrator did not try another route, and no worker was
spawned (G2).

**A person has to decide:** approve the T-078 brief by replacing
`Approved: pending` in `tasks/T-078-refresh-routes.md`, then start a run from
`Next step: worker`. Separately, the expander's proposed T-084 split (above) is
waiting on a person.

## Resumed — 2026-10-13
Dkaattae, in the orchestrator session: "I approve T-078, continue the run".
The orchestrator recorded that approval in the brief's `Approved:` line and
resumed from `Next step: worker`.

## Round 2 — worker — 2026-10-13
`Next step` on entry: `worker` (`Status: awaiting approval`) → on exit: `tester` (`Status: awaiting verification`)

**T-078 worker: built and pushed. One existing test now fails on purpose because the brief requires it, and changing that test needs a human's approval (D-14).** Commit `084125b` is on `origin/claude/loving-darwin-jij761`; I checked with `git log origin/claude/loving-darwin-jij761 -1`. The brief now reads Status `awaiting verification`, Next step `tester`.

**Changes**
- **`question-bank/src/build.ts`:** the live fun-fact pass no longer loops over every state. It now calls `draftMissingFunFacts`, the same rule `refresh.ts` uses. While all 50 states have curated facts, a live build calls Wikipedia zero times. Warnings come out in the same order and format as before. No new `BuildDeps` field.
- **`question-bank/src/fixtures/us-states.sparql.json`:** only `_fixture.regenerate_with` changed, and it now names `bun run refresh`. With that key removed, the parsed file is identical to the version before the change.
- **`question-bank/src/build-fun-facts.test.ts` (new):** 8 tests covering criteria 1–9, 11 and 15.
  - They drive `runBuild` live through `fixtureTransport` and a `SummaryTransport` that records each title it gets.
  - A state gets empty `fun_facts` by blanking its curated entry in the test; `afterEach` restores it.
  - For criterion 6, the test removes Vermont's `article` binding from the replayed response.
  - Nothing is stubbed with `fetch`, and the file passes with all six proxy variables set to `http://127.0.0.1:1`.

**Results**
- **Tests:** 1808 pass, 1 fail. The failure is the stale test below.
- **Checks:** typecheck, lint and `format:check` are all clean. I had to run `bun install` first because `node_modules` was missing; the lockfile did not change.
- **Bank and offline build (criteria 14–15):** nothing under `question-bank/data/` changed. I ran an offline build from a checkout of the code before my change and one from this branch. The output folders were identical, and stdout differed only in the fixture's absolute path, because the two checkouts sit in different directories.

**Test made stale**
- **Which test:** in `question-bank/src/highest-point-in-state-verify.test.ts`, the describe `"T-079 tester, criterion 19 — both SPARQL fixtures are byte-identical to 323254c"`, test `"us-states.sparql.json"`.
- **Why it fails:** it pins the main fixture's sha256, and criterion 12 requires editing that file.
- **Proposed fix, for the tester to take to Dkaattae:** change the digest to `121a4b8a1d94409ab76063909cb64b3b40ddde93431b07dec5416662455cfd9d`, or compare the parsed fixture with `regenerate_with` left out.

**Where the brief is wrong**
- **Two criteria can't both pass.** The Constraints say no existing test should break ("Nothing above expects one"). But criterion 12 (edit the fixture) and criterion 18 (every existing test passes unmodified) contradict each other because of that pin.
- **Owner:** the tester raises it with a human. If they want to keep the pin as it is, criterion 12 goes back to task-expander.

**Two things for the tester**
- **The output folder has 51 files.** It holds `index.json` next to the 50 state files, so count `us-state-*.json` when checking criterion 7's "all 50 entity files".
- **Every role in this run has the same session id**, `cse_01PtngPoaghwWcXCwbmrjZNw`, because it is orchestrated, so the tester's check against the Sessions table will match the worker row. The orchestrator or a human should decide whether separate subagent contexts count as enough isolation.

The full Handoff, with a table of where each criterion is implemented, is in `/home/user/geo-discovery-zone/tasks/T-078-refresh-routes.md`.
