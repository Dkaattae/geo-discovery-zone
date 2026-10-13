# T-078 — Point the other refresh routes at `bun run refresh` — run log

**Task:** T-078 · **Branch:** `claude/loving-darwin-jij761` · **PR:** #78
**Started:** 2026-10-13 · **Outcome:** halted — needs human

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
