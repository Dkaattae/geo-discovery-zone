# T-070 — Re-pin the bank's digest guards, and let the offline harness return stdout

**Status:** `blocked`
**Next step:** `human` — answer Q1 and Q2 under "Blocked: questions for a human" below, then re-run `task-expander`
**Approved:** `pending`
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-070
**Branch:** `claude/serene-heisenberg-cd5unq`
**PR:** #73, opened draft at expand time against the branch above
**Fault:** the queue entry needs a decision that is not the expander's to make (re-pin vs keep the historical digests), and it is three tasks in one entry.

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-06 | cse_01UvBvo6qodvNQDpFJPANTgN |

## Blocked: questions for a human

TL;DR: **T-070 is the next pickable task** (section A is empty; T-064 depends on
the unbuilt T-040). It cannot be expanded honestly yet. **Q1** is a call the
entry itself says is deliberate. **Q2** is a proposed split. **Note N1**: most of
this work changes tests that already exist, and the worker is not allowed to do
that.

**Q1 — (a): re-pin, or keep the historical pins?** The entry says re-pinning
"discards the 'unchanged since T-013' property those digests exist to hold, so it
is a deliberate call rather than a tidy-up". The criteria for the two answers
share almost nothing:

- **Re-pin.** Every pinned-digest guard is re-pinned against the default branch.
  All per-task neutralisations are deleted: the `climate_kid` delete, the
  `top_crops` reset to `[]`, AK's `highest_point` strip, the `top_livestock`
  strip/delete, `T069_DEFAULT_BRANCH_HIGHEST_POINT_M` and
  `T079_DEFAULT_BRANCH_HIGHEST_POINT_M`. This also removes the `top_crops` blind
  spot. An `E-20` entry records the decision.
- **Keep.** The historical pins stay. The neutralisations move into one shared
  helper instead of four or five hand-copied ones. An `E-20` entry records why,
  and it writes down the `top_crops` blind spot (T-068's reviewer asked for this).

Every reviewer amendment since T-063 has argued for re-pinning, and the
expander's reading agrees. But the entry reserves the choice, so this brief does
not make it. **Whichever answer you give, also say this:** must the guard survive
a refresh where only `sources.built_at` and the fixture moved? T-063's reviewer
says yes, because the monthly refresh routine depends on it.

**Q2 — split T-070 into three?** The entry is sized S. It holds three
independent pieces, and each one has its own "Done when" clause:

| Proposed | Piece | Size | Touches existing tests? |
|---|---|---|---|
| **T-070** (keeps the id) | (a) digest guards, per Q1, plus `E-20` | M | **yes**: four or five verify suites, plus the three "no unexpected key" allow-lists and the five `sample-data` comparisons if Q1 covers them |
| **T-080** | (b) the offline harness returns captured stdout, so a test can assert on `report()`'s printed warnings | S | no, if the new capability is additive |
| **T-081** | the git leftover: `climate-kid.test.ts:598`'s `status === 0 \|\| status === 1`, plus widening `frontend/src/git-baseline-guard.criteria.test.ts`'s scan to `question-bank/src/` | S | **yes**: `climate-kid.test.ts`, and the guard file if it is widened in place |

T-080 can be built by a worker with no test change request, and it does not wait
on Q1. If you approve the split, T-080 is the one to expand first. Its draft
criteria are below.

**N1 — the loop's worker cannot do most of (a) or the git leftover.** A worker
"cannot delete or modify a test that existed before the task". Re-pinning a
digest, deleting a neutralisation table and fixing line 598 are all edits to
existing tests. Under D-14/D-15, each one becomes a tester's Test change request
that a person approves in an attended tester session. An orchestrated run halts
there every time, as T-069 and T-079 did. So **plan to attend the tester step for
T-070 (a) and T-081**, or say if you want those done by hand outside the loop.

## Draft acceptance criteria — not approved, not frozen

Written now so whoever comes back has a starting point. They will be finalised
once Q1 and Q2 are answered.

### (b) — build report stdout through the offline harness (proposed T-080)

1. A test in `question-bank/src/` can run `src/build.ts --offline` through the
   shared offline harness (`src/offline-rebuild.ts`) and read the build's
   captured stdout as a string. The read-back files come from the same run.
2. On the committed fixtures, that captured stdout contains the
   `N warning(s):` line printed by `report()` in `src/build.ts`. It also contains
   one `<entity>.<field>: <message>` line per warning. As of T-079 that includes
   the three `highest_point_m` override warnings, for `us-state-ct`,
   `us-state-ok` and `us-state-va`. A test asserts these lines by their text.
   Wiring a mock or reimplementing `report()` does not count.
3. The harness still sets all six `DEAD_PROXY` spellings to `http://127.0.0.1:1`
   when it spawns the build. It still removes its temp directory whether the
   build succeeds or fails. It still throws when the build exits non-zero.
4. Every existing caller of `rebuildOffline` passes without modification. That
   is `committed-bank`, `climate-kid-verify`, `top-crops-verify` and
   `top-livestock-verify`. So do `climate-kid-verify.test.ts`'s checks on the
   harness's shape (`:966`, `:1013`, `:1219`).
5. No test spawns `src/build.ts` other than through the harness. This is the
   rule `top-crops-verify.test.ts:438` and `climate-kid-verify.test.ts:828`
   enforce, and it still holds. No new dependency.

### (a) — digest guards (proposed T-070)

Not drafted: the criteria depend entirely on Q1. Facts the survey found, for the
brief that follows:

- **More guards than the entry says.** The entry says "three". The pinned-digest
  guards are `landmarks-verify`, `climate-kid-verify`, `top-crops-verify` and
  `highest-point-verify`. `highest-point-in-state-verify.test.ts` (`:135`,
  `:148`, `:463`) also pins digests, of states and of the fixtures. It must be
  inside or explicitly outside the brief.
- **Neutralisation tables:** `T069_DEFAULT_BRANCH_HIGHEST_POINT_M` and
  `T079_DEFAULT_BRANCH_HIGHEST_POINT_M` (e.g. `landmarks-verify.test.ts:462`,
  `:476`, `:531-539`).
- **Pinned timestamp:** `PINNED_BUILT_AT` (`landmarks-verify.test.ts:51`).
- **Highest decision entry:** `engineering-decisions.md` is at `E-19`, so the
  next one is `E-20`.

### Git leftover (proposed T-081)

6. No test in `question-bank/src/` can pass because a spawned `git` failed. In
   particular, the test `"sample-data/us-state-co.json was not touched by this
   task …"` in `climate-kid.test.ts` fails when `git` exits with any non-zero
   status.
7. A test scans `question-bank/src/` with the same rules that
   `frontend/src/git-baseline-guard.criteria.test.ts` applies to
   `frontend/src/`. Every `git` call uses a working-tree subcommand, and every
   one throws on a non-zero exit. The scan finds at least one `git` call under
   `question-bank/src/`, so it cannot pass vacuously.

## Notes

- `tasks/` was empty at start: T-079's reviewer swept it. `tasks.md` and
  `PROGRESS.md` are unchanged by this commit.
- The expander did not run the build or the suite (D-7).
