# T-064 — Purge `question-bank/sample-data/` now the full bank is proven

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** a person — 2026-10-20, in the orchestrator session ("approved, start the worker"). See `runs/T-064-purge-sample-data.md`.
**Test changes:** `approved — Dkaattae, 2026-10-20`
**From:** [`tasks.md`](../tasks.md) T-064
**Branch:** `claude/optimistic-pascal-wk81ey`
**PR:** #89, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-20 | cse_0155zx41KsbKu7xBvuZNrYFV |
| worker | 2026-10-20 | cse_0155zx41KsbKu7xBvuZNrYFV (orchestrated subagent; the remote session id is shared with the expander's, so the tester must check isolation by its own spawn, not this id) |
| tester | 2026-10-20 | cse_0155zx41KsbKu7xBvuZNrYFV (orchestrated subagent, freshly spawned; same shared id, so its independence rests on the spawn, not the id) |
| tester (attended) | 2026-10-20 | cse_015g2kHcuVVqxLfCPu3KuyUZ (a separate session started by a person, to settle the Test change request) |

> **Not a light brief.** `tasks.md` sizes this `S`, but it needs more than four
> criteria, and the deletion makes pre-existing tests stale in at least eleven
> files (see Context). Every one of those edits needs an approved Test change
> request (D-14, D-15). **Plan to attend the tester step.** M is the honest size.

## Goal

`question-bank/sample-data/` was a one-state teaching copy of the entity shape,
kept "until the committed bank is shown to work end to end". T-040 (PR #88) made
the committed 50-state bank the bank the app serves, so the condition has been met.
The sample is now a frozen, drifting duplicate. It lacks `top_crops` and
`top_livestock`, and its README claims `build:sample` gives the "same output".
Every curation task since T-010 has had to add an exception for it in five
tests. Delete it, and every live claim that it exists.

## Acceptance criteria

**Frozen once approved.** "Base" below means `origin/main` at `97780b5`, the
commit this branch was cut from.

**The directory and its script**

1. No path under `question-bank/sample-data/` is tracked, so
   `git ls-files question-bank/sample-data` prints nothing. The directory also
   does not exist in a fresh checkout of the branch.
2. `question-bank/package.json` has no `scripts` key named `build:sample`.
3. No value in `question-bank/package.json`'s `scripts` contains the string
   `sample-data`.
4. Apart from removing the `build:sample` line, `question-bank/package.json`
   is byte-identical to base. The other script keys and values,
   `devDependencies`, and every other field are unchanged.

**Live docs stop describing it**

5. None of these files contains the string `sample-data` or `build:sample`:
   `README.md`, `conventions.md`, `test-guidelines.md`,
   `question-bank/README.md`, and every non-test `.ts` file under
   `question-bank/src/`. Non-test means a name not ending in `.test.ts`.
   `question-bank/src/build.ts`'s header comment is the one known instance.
6. In `PROGRESS.md`, the text above the `## Completed tasks` heading does not
   contain `sample-data` or `build:sample`. `PROGRESS.md:118` is the one known
   instance. Text from `## Completed tasks` down is history and is exempt.
7. `question-bank/README.md` still gives a reader a single entity record to
   look at. It names the path `data/us-states/us-state-co.json`, or another
   specific `data/us-states/us-state-<xx>.json` file, as an example of one
   entity's shape. Naming only the directory does not satisfy this.

**Nothing else moves**

8. Every tracked file under `question-bank/data/` (both `us-states/` and
   `questions/`) and under `question-bank/src/fixtures/` is byte-identical to
   base. No file is added there and none is removed.
9. No file under `frontend/`, `backend/`, `e2e/`, `.github/` or `.claude/`
   changes, and neither do `openapi.yaml`, `Dockerfile`, `docker-compose.yml`,
   `geoquizdataplan.md` or `process*.md`.
10. No dependency is added, removed or re-versioned. Every lockfile
    (`question-bank/bun.lock`, `frontend/bun.lock`, `e2e/bun.lock`,
    `backend/uv.lock`), `backend/pyproject.toml`, and the `dependencies` and
    `devDependencies` of every `package.json` are byte-identical to base.
11. In the diff to non-test `.ts` files under `question-bank/src/`, every
    changed line is a comment line. The pipeline's behaviour does not change.

**The guarantees the sample tests carried, kept where they still mean something**

12. The suite still contains a passing test that fails when a file tracked
    under `question-bank/data/` contains `"reviewed": false`. A mutation check
    must turn it red: add `"reviewed": false` to one tracked file under
    `question-bank/data/us-states/` and the test fails. Removing
    `sample-data/` from such a test's scan is allowed. Removing the test
    outright is not, unless another test still meets this criterion.
13. No test in the suite reads, hashes, lists or stats a path under
    `question-bank/sample-data/`. A string literal that is never resolved
    against the filesystem does not count, such as the source snippets in
    `git-exit-guard.criteria.test.ts:623` and `:687`.

**Suite and process**

14. These all pass on the branch: `bun test`, `bun run typecheck`,
    `bun run lint` and `bun run format:check` in `question-bank/`, and
    `bun test` in `frontend/`. The frontend suite is in the list because
    `frontend/src/conventions-doc.test.ts` reads `conventions.md` and
    `question-bank/package.json`.
15. A pre-existing test is deleted or modified only under a Test change request
    row in this brief that a person has approved, as `.claude/agents/tester.md`,
    D-14 and D-15 require. A pre-existing test means one present at base. The
    worker changes none of them. It lists them under **Tests made stale** in its
    Handoff.

## Out of scope

- **The digest-guard question (T-070, Q1).** Re-pinning, a shared
  neutralisation helper and the `top_crops` blind spot all stay in T-070. This
  task changes a guard only where `sample-data/` is the thing it reads. It
  does not tidy the guard's other exceptions in passing, even in a file it is
  already editing.
- **The historical record.** `engineering-decisions.md` (E-6 at `:243`, the
  prettier entry at `:772`), `PROGRESS.md` from `## Completed tasks` down,
  `runs/`, `archive/`, and `tasks.md` are left as they are. `tasks.md` is
  updated in the reviewer's sweep.
- **The committed bank's content.** No field, value or curation change.
- **The question file.** `data/questions/us-states.json` and
  `write-questions.ts` stay as they are.
- **Any replacement sample or fixture.** The committed bank is the example now.
  Do not create a new example directory.
- **The `--out` flag and `--states` subsetting in `build.ts`.** They stay. Only
  the script that pointed them at `sample-data/` goes.
- **`.gitignore` files.** None of them names `sample-data/` at base, so none
  needs to change.

## Constraints

- **Files expected to change:**
  - deleted: `question-bank/sample-data/README.md`,
    `question-bank/sample-data/index.json`,
    `question-bank/sample-data/us-state-co.json`
  - edited: `question-bank/package.json` (one script line),
    `question-bank/README.md`, `conventions.md`, `PROGRESS.md` (the "Done"
    claim at `:118`), and `question-bank/src/build.ts` (comment only)
  - the tester alone, under approved rows: the stale test files listed in
    Context
- **Worker:** must not edit any test file that existed at base (criterion 15).
  If no new test is needed, write none.
- **Dependencies:** none (criterion 10). See [`CLAUDE.md`](../CLAUDE.md),
  "Packages".
- **No network in tests**, as always (`test-guidelines.md`).
- Keep `conventions.md` true to `question-bank/package.json`.
  `frontend/src/conventions-doc.test.ts` checks that every `bun run <script>`
  it names is a real script, so removing the script without removing its
  mention would turn the suite red.

## Context

**Required reading for the worker and the tester.**

- **The queue entry:** `tasks.md`, T-064, including its 2026-10-03 amendment
  (the README is "further from true") and the expander's 2026-09-22 skip note
  (why T-040 was the precondition).
- **What is being deleted:** `question-bank/sample-data/README.md` (read it; it
  says what the sample was for), `index.json`, `us-state-co.json`.
- **The script:** `question-bank/package.json:8`, `build:sample`.
- **Live mentions found by the expander's survey** (grep `sample-data` and
  `build:sample`, excluding `runs/`, `archive/` and history):
  - `question-bank/README.md:20` (Run it) and `:188` (layout)
  - `conventions.md:69` (Commands)
  - `question-bank/src/build.ts:6` (header comment)
  - `PROGRESS.md:118` (Done › Question bank, the prettier glob claim)
- **Why the bank is now the example:** `engineering-decisions.md` E-6 (the bank
  is committed), and PR #88 / T-040 in `PROGRESS.md` "Completed tasks" (the
  bank is served).
- **Test files that read `sample-data/` at base.** These are the expander's
  candidates for **Tests made stale**. They come from a grep, not a run, so the
  worker and tester confirm them, and there may be more:
  - **Sample-vs-bank comparisons (the "five").**
    `committed-bank.test.ts:153`, `landmarks.test.ts:522`,
    `state-animals.test.ts:467`, `landmarks-verify.test.ts:447` and `:450`,
    `climate-kid-verify.test.ts:756`, `:762` and `:775`.
    `climate-kid.test.ts:583` and `:620` do the same.
  - **Byte or digest pins on the sample.** `top-crops-verify.test.ts:572` and
    `:577`, `highest-point-verify.test.ts:137`, `:394` and `:692`,
    `highest-point-metres-verify.test.ts:670`, and
    `hand-check-levels-verify.test.ts:704` (criterion 14's `sample:` key).
  - **README content tests.** `top-crops-verify.test.ts:536` and `:581`,
    `fun-facts.test.ts:396` and `:404`, and `committed-bank.test.ts:260`. That
    last one lists `sample-data/README.md` among the paths it reads.
  - **`reviewed: false` scans that include `sample-data/`.**
    `climate-kid-verify.test.ts:1122`, `landmarks-verify.test.ts:652`,
    `landmarks.test.ts:693`, `state-animals.test.ts:727`,
    `climate-kid.test.ts:831` and `fun-facts.test.ts:172`. Some of these use
    `walk()` on the directory, which may throw when it is missing. Others use
    `git ls-files`, which would just return nothing. Criterion 12 is the
    guarantee these carry.
  - **`climate-kid.test.ts:594`.** It asserts that `git diff` is clean for
    `sample-data`. It may stay green after the deletion, but criterion 13
    still applies to it.
  - **Knock-on pins in `hand-check-levels-verify.test.ts`.** Criterion 15
    (`:723`) pins every `package.json` at `aa88101`, so removing the script
    turns it red. Criterion 17 (`:768`) pins every question-bank test file at
    `aa88101`, so **any** approved edit to an older test turns it red. Each
    needs its own row.
- **How stale tests are handled:** `process.md` step 4, "Stale or wrong tests go
  through the tester, and through a person". Also `.claude/agents/tester.md`,
  and `process-decisions.md` D-14 and D-15.
- **Test style:** `test-guidelines.md`.

## Handoff

**TL;DR — production change done; 30 question-bank tests are red, all stale by design (listed below); the tester needs approved Test change request rows before the suite can be green.**
- `sample-data/` deleted, `build:sample` removed, five live mentions fixed. No test file touched.
- Typecheck, lint, format:check in `question-bank/` pass. Frontend `bun test` is 376/377: the one red is an **environment** gap (`react-simple-maps` not installable here, registry 403), not this change.
- Criterion 12 already holds without any test edit (mutation check below).

### What changed, file by file

- **deleted** `question-bank/sample-data/README.md`, `index.json`, `us-state-co.json` (`git rm`).
- `question-bank/package.json` — the `build:sample` line removed, nothing else. New sha256 `5286f4f725a98f5e54d45cf2646be5b38152ffc87ba5ac91039b919c49ec3f72` (base `c00e1069…b676`).
- `question-bank/README.md` — `build:sample` line removed from "Run it"; the `sample-data/` layout entry removed, and the `data/us-states/` entry now says "read data/us-states/us-state-co.json for one complete entity record" (criterion 7).
- `conventions.md` — `build:sample` command line removed.
- `PROGRESS.md:117-118` — "JSON under `data/`, `sample-data/` and `src/fixtures/`" → "JSON under `data/` and `src/fixtures/`". Nothing below `## Completed tasks` touched.
- `question-bank/src/build.ts` — one header comment line removed. No code line changed.

### Criterion → where it lives

| # | Status | Evidence |
|---|---|---|
| 1 | done | `git ls-files question-bank/sample-data` empty; directory gone |
| 2-4 | done | one-line deletion in `question-bank/package.json` |
| 5 | done | grep of the listed files and non-test `src/*.ts` finds nothing |
| 6 | done | only `PROGRESS.md:118` above `## Completed tasks`, fixed |
| 7 | done | `question-bank/README.md` layout block names `data/us-states/us-state-co.json` |
| 8-10 | done | nothing under `data/`, `src/fixtures/`, `frontend/`, lockfiles etc. changed |
| 11 | done | `build.ts` diff is one deleted comment line |
| 12 | holds already | `committed-bank.test.ts` "T-010 criterion 9 … no file tracked under question-bank/data/ contains reviewed: false anywhere" scans `data/` only and passes. Mutation: inserting `"reviewed": false,` at the top of `data/us-states/us-state-vt.json` turned it red (also `data-us-states.test.ts` "criterion 8 … no tracked file contains unreviewed fun-fact prose" and two refresh tests). File restored byte-identical. |
| 13 | **needs tester** | violated by the pre-existing tests listed below until they are edited |
| 14 | **needs tester** | red until the stale tests are handled |
| 15 | done for worker | worker edited no test file |

### Tests made stale

All 30 question-bank reds, plus two green tests that still violate criterion 13 and floors the deletions will trip. Line numbers are at base. "Delete" means the whole `test(...)`.

**Sample-vs-bank comparisons (delete — nothing left to compare against)**
- `committed-bank.test.ts:153` "T-010 criterion 4 — the tracked Colorado matches the committed sample > data/us-states/us-state-co.json equals sample-data/us-state-co.json except …" — delete (whole describe if it holds nothing else; also the `:150` comment).
- `state-animals.test.ts:467` and `:471` "T-012 criterion 7 — …" (both tests) — delete; and the loader at `:465`.
- `landmarks.test.ts:522` and `:526` "T-013 criterion 8 — …" (both) — delete; and the loader at `:520`.
- `landmarks-verify.test.ts:434` "T-013 tester, criterion 8 > the sample equals the tracked Colorado …" — delete; `SAMPLE` const `:47`.
- `landmarks-verify.test.ts:580` "T-013 tester, criterion 10 > the plan's §1.4 example string is what the table, the bank and the sample all carry" — modify: drop the sample expect (`:586`), keep table and bank.
- `climate-kid-verify.test.ts:744` and `:761` "T-014 tester, criterion 13 — …" (both) — delete; `SAMPLE` const `:68`.
- `climate-kid-verify.test.ts:770` "T-014 tester, criterion 14 > the curated table, the tracked file and the sample all carry the pinned string" — modify: drop the sample expect (`:775`).
- `climate-kid.test.ts:583` "T-014 criterion 13 > sample-data/us-state-co.json carries the same climate_kid …" — delete.
- `climate-kid.test.ts:618` "T-014 criterion 14 — Colorado's phrase is unchanged > the sample carries exactly this string" — delete.
- `climate-kid.test.ts:594` "T-014 criterion 13 > sample-data/us-state-co.json was not touched by this task (git status is clean for it)" — **stays green but violates criterion 13** (runs `git diff` on the path). Delete.

**Byte/digest pins on the sample (delete)**
- `top-crops-verify.test.ts:572`, `:576`, `:581` — the whole "T-015 tester, criterion 12 — the committed sample is untouched" describe; `SAMPLE` `:39`, `SAMPLE_DIGEST` `:569`.
- `highest-point-verify.test.ts:394` "T-016 tester, criterion 6 > sample-data/us-state-co.json is byte-identical to the default branch" — delete. Then **modify** `:137` (drop the `"sample-data/us-state-co.json"` key from `DEFAULT_BRANCH_DIGESTS`) and `:691` "T-016 tester — the pins above are not vacuous > DEFAULT_BRANCH_DIGESTS covers all 51 tracked paths plus the sample" (drop the sample from `wanted` and from the name). `:691` is green now; it goes red once `:137` is edited, so the two need to move together. `SAMPLE` `:45`, header comment `:23`.
- `highest-point-metres-verify.test.ts:670` "T-069 tester, criterion 12 > sample-data/ is byte-identical to main" — delete, with `SAMPLE_DIR` `:37` and `SAMPLE_DIGESTS_AT_E10F94D` `:680`.
- `hand-check-levels-verify.test.ts:704` "T-025 criteria 14-17 … > criterion 14: question-bank/data (…), sample-data and src/fixtures are byte-identical to aa88101" — modify: drop the `sample:` key on both sides and "sample-data" from the name.

**README content tests (delete — the README is gone)**
- `top-crops-verify.test.ts:536` "T-015 tester, criterion 11 > sample-data/README.md no longer says top_crops needs USDA NASS" — delete.
- `fun-facts.test.ts:396` and `:404` "T-011 criterion 11 > 11(a) — sample-data/README.md …" (both) — delete.
- `committed-bank.test.ts:256` "T-010 criteria 11–16 > criterion 11 — no shipped file still asserts the bank is not stored in git" — modify: drop `"question-bank/sample-data/README.md"` from its list (`:260`).

**`reviewed: false` scans (modify — drop the sample-data half, keep `data/`)**
- `climate-kid-verify.test.ts:1122`, `landmarks-verify.test.ts:652` (both `walk()`, which throws on the missing dir), `landmarks.test.ts:693`, `state-animals.test.ts:727`, `climate-kid.test.ts:831`, `fun-facts.test.ts:172` (`trackedUnder`). Rename each to drop "or sample-data/". Deleting them instead is also allowed by criterion 12, since `committed-bank.test.ts` T-010 criterion 9 carries the guarantee; modifying keeps expect counts and avoids touching more floors.

**package.json digest pins (modify — new digest `5286f4f7…3f72`)**
- `hand-check-levels-verify.test.ts:723` "T-025 criteria 14-17 … > criterion 15: every package.json and lockfile is byte-identical to aa88101, and none was added" — update the `question-bank/package.json` value.
- `highest-point-in-state-verify.test.ts:473` "T-079 tester, criterion 20 — every package.json and bun.lock is byte-identical to 323254c > question-bank/package.json" — update the value. **Not in the expander's list.**

**Knock-on pin**
- `hand-check-levels-verify.test.ts:768` "T-025 criteria 14-17 … > criterion 17: every question-bank test file at aa88101 is present and unmodified" — green now; goes red as soon as any listed file is edited. Needs its own row (re-pin the edited files' digests, or let it exempt T-064's approved edits).

**Count floors the deletions trip.** Counts use the floors' own regexes (`^\s*test(\.\w+)?\(` and `expect\(`). Current = the branch now; "after" = after the deletions and modifications proposed above.

| Suite | Current | After | Floors that pin it (file:line) |
|---|---|---|---|
| `committed-bank.test.ts` | 33 / 55 | 32 / 54 | `climate-kid-verify:1161`, `climate-kid:882`, `landmarks-verify:692`, `landmarks:752`, `state-animals:781` (all 33/55), and the **exact** `toBe(55)` at `climate-kid-verify:1209` → 54 |
| `fun-facts.test.ts` | 30 / 59 | 28 / 54 | `climate-kid-verify:1163`, `climate-kid:884`, `landmarks-verify:694`, `landmarks:754`, `state-animals:783` (all 30/59) |
| `state-animals.test.ts` | 42 / 76 | 40 / 74 | `climate-kid-verify:1165`, `climate-kid:886`, `landmarks:757` (42/73), `landmarks-verify:698` (42/70): tests floor → 40; expects still fine |
| `landmarks.test.ts` | 52 / 91 | 50 / 88 | `climate-kid-verify:1167`, `climate-kid:888` (52/88): tests floor → 50 |
| `landmarks-verify.test.ts` | 36 / 73 | 35 / 70 | `climate-kid-verify:1168`, `climate-kid:889` (36/69): tests floor → 35 |

Some floor tables live in files that are themselves on the delete list, so the tester's edits and floor re-pins land in the same files. If the tester deletes a whole describe that also held a loader or a comment, recount.

### Deliberately not done

- **No test edited or added** (criterion 15). Criterion 12 needed no new test.
- `git-exit-guard.criteria.test.ts:623`, `:687` left alone: string literals, exempt under criterion 13.
- Historical mentions (`PROGRESS.md` below `## Completed tasks`, `engineering-decisions.md`, `runs/`, `archive/`, `tasks.md`) left, per Out of scope.

### Contradictions with the brief

- **Missed by the expander's list**: `highest-point-in-state-verify.test.ts:473` (T-079 package.json pin) and the count floors above. `highest-point-verify.test.ts:691` and the exact `toBe(55)` also need edits.
- None of the criteria look wrong.

### How to run

```bash
cd question-bank && bun install --frozen-lockfile && bun test && bun run typecheck && bun run lint && bun run format:check
cd frontend && bun test
```

Results on this branch (worker, 2026-10-20):
- `question-bank/` `bun test`: **2211 pass, 30 fail**. Every fail is listed above. At base `97780b5`, in a worktree: 2241 pass, 0 fail.
- `question-bank/` typecheck, lint (0 warnings, 0 errors), format:check: pass. `question-bank/node_modules` was missing at the start; `bun install --frozen-lockfile` fixed it, lockfile unchanged.
- `frontend/` `bun test`: 376 pass, 1 fail. The fail is an unhandled error: `Cannot find package 'react-simple-maps'` from `src/components/UsMap.tsx`. `bun install --frozen-lockfile` in `frontend/` fails here with a **403** from `europe-west1-npm.pkg.dev` (the lockfile's resolved registry), and `BUN_CONFIG_REGISTRY` does not override it. This is the environment, not this change: no frontend file changed. `frontend/src/conventions-doc.test.ts` passes, 81/81. `eslint` and `prettier --check .` run directly both pass. **Owner: the tester re-runs this where the frontend installs. If it is still red there, a human decides.** That install may also have removed packages that were present before; I cannot tell.
- **Unexplained once**: during the first frontend run, `frontend/README.md` was rewritten (one `*` escaped to `\*`, a prettier-style edit). I reverted it with `git checkout`, and it did not happen again in two later runs. **Owner: the tester, if it recurs. Otherwise a `tasks.md` entry at the reviewer's sweep** for a frontend test that may leak writes.

## Verdict

### Round 2 — attended tester, 2026-10-20: **pass**

**TL;DR: pass. Dkaattae approved all 39 Test change request rows in this session, and they are applied exactly as written. `question-bank` now has 2232 pass and 0 fail, and typecheck, lint and format:check are clean.** Next step: the reviewer.
- **Approval.** Header: `Test changes: approved — Dkaattae, 2026-10-20`. Dkaattae's own words in this session: *"Approve all 39 rows"*, with the name to record given as *"Dkaattae"*.
- **Independence: a separate session.** This is session `cse_015g2kHcuVVqxLfCPu3KuyUZ`. A person started it directly, and it does not appear in the Sessions table as expander or worker. Unlike round 1, this is the strong kind of independence.
- **Frontend: not runnable here.** `bun install` in `frontend/` gets a 403 from `europe-west1-npm.pkg.dev`, the same gap round 1 hit. `src/conventions-doc.test.ts` passes 81/81. No file under `frontend/` changed. CI's frontend job decides the rest.

**Rows applied.** Commit `2def022` (`T-064 tester: apply approved test change request`) holds only test files.

| Rows | Action | What it did |
|---|---|---|
| 1, 6–7, 9–10, 12, 15–17, 19–20 | delete | Sample-vs-bank comparisons and their describes, loaders, `SAMPLE` constants and sample-only comments |
| 4–5, 23–27, 29 | delete | Sample README tests and sample byte or digest pins, with `SAMPLE`, `SAMPLE_DIGEST`, `SAMPLE_DIR` and `SAMPLE_DIGESTS_AT_E10F94D` |
| 2, 13, 21, 30 | modify | Only the sample's part is dropped. The bank and table assertions stay exact |
| 3, 8, 11, 14, 18, 22 | modify | The `reviewed: false` scans read `data/` only, are renamed, and keep `> 51` and the per-path assertion |
| 28 | modify | The sample key leaves `DEFAULT_BRANCH_DIGESTS`. The vacuity test asserts the exact 51-path set |
| 31, 32 | modify | `question-bank/package.json` is re-pinned to `5286f4f7…3f72`, which matches `sha256sum` of the file |
| 33 | modify | The T-025 criterion 17 aggregate is re-pinned `db741fc0…` → `dd1c8a7f…`. My script recomputes the old value on the unedited tree, so the method matches the test's |
| 34–39 | modify | Floors are lowered by exactly the deletions: committed-bank 32/54 (5 tables), fun-facts 28/54 (5), state-animals tests 40 (4), landmarks tests 50 (2), landmarks-verify tests 35 (2), and the exact count `toBe(54)` |

**Checks after applying:**
- **Floors recounted** with the floors' own regexes: committed-bank 32/54, fun-facts 28/54, state-animals 40/74, landmarks 50/88, landmarks-verify 35/70. Each equals its new floor or sits above it, as the brief predicted.
- **Suite:** 2232 pass, 0 fail. That is 2251 tests before, minus the 19 approved deletions. `purge-sample-data-verify.test.ts` › criterion 13 is now green.
- **Criterion 12 mutation, re-run.** I inserted `"reviewed": false,` into `data/us-states/us-state-wy.json`. All six modified scans (rows 3, 8, 11, 14, 18, 22) went red, along with the T-010 criterion 9 guard. The file was restored, and `sha256sum -c` against the saved digest gave OK.

**Left as is, outside the rows:** `highest-point-verify.test.ts`'s header still says "the other 51 paths must digest to it untouched". With the sample gone, that is now 50. Row 28 approved dropping only the sample phrase, so I changed nothing else. It is a comment, and it is noted here for the reviewer.

### Round 1 — orchestrated tester, 2026-10-20: blocked on the Test change request

**TL;DR: blocked on a Test change request. The production change meets every criterion this tester can check, but 30 pre-existing tests are red (31 counting a green one that breaks criterion 13), and all of them are stale because of this task.** 39 rows are below. Nobody can approve them in an orchestrated run, so the task halts for a person (`Next step: human`).
- **Not a fail.** No criterion is unmet by the source. The reds are tests pinning the deleted directory or the old `package.json`.
- **Needed next:** a person starts a `tester` session for T-064 that they are attending, and approves or refuses each row there.

**Independence: weaker than a separate session.** This tester is a freshly spawned subagent under the orchestrator (`runs/T-064-purge-sample-data.md` exists). Its `$CLAUDE_CODE_REMOTE_SESSION_ID` (`cse_0155zx41KsbKu7xBvuZNrYFV`) is the same id the Sessions table lists for the expander and the worker, so the id check proves nothing here. Independence rests only on the orchestrator having spawned a fresh context. I did not see the worker's reasoning, only its Handoff.

### Criterion → verdict → evidence

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `purge-sample-data-verify.test.ts` › criterion 1 (two tests, plus a non-vacuity check). Mutations: an untracked file in the directory turns the existence test red; `git add` of it turns both red. |
| 2 | met | › criteria 2 and 3 › "criterion 2 …". Mutation: re-adding a `build:sample` script turns it red. |
| 3 | met | › "criterion 3 …". Same mutation turns it red. |
| 4 | met (one-off) | `git show 97780b5:question-bank/package.json \| grep -v '"build:sample"' \| diff - question-bank/package.json` shows no difference. numstat is `0 1`. |
| 5 | met | › criterion 5. Scans the four docs and every tracked non-test `.ts` under `question-bank/src/`, nested ones included. Mutations: a mention appended to `conventions.md` turns it red, and so does a comment in `src/queries/*.ts`. |
| 6 | met | › criterion 6. Mutation: a mention above `## Completed tasks` turns it red. The same mention appended below it stays green, as the criterion requires. |
| 7 | met | › criterion 7. README names `data/us-states/us-state-co.json`, and the test requires it to be tracked. Mutations: replacing it with a directory-only mention turns it red, and so does naming `us-state-zz.json`. |
| 8 | met (one-off) | `git diff --stat 97780b5 HEAD -- question-bank/data question-bank/src/fixtures` is empty. |
| 9 | met (one-off) | `git diff --name-only 97780b5 HEAD -- frontend backend e2e .github .claude openapi.yaml Dockerfile docker-compose.yml geoquizdataplan.md 'process*.md'` is empty. |
| 10 | met (one-off) | No lockfile or `pyproject.toml` differs from base. The tracked manifest set is identical. `dependencies`/`devDependencies` of all three `package.json` compare equal as JSON. |
| 11 | met (one-off) | The only changed line in non-test `question-bank/src/*.ts` is `- *   bun run build:sample …` in `build.ts`'s header comment. |
| 12 | met | Pre-existing `committed-bank.test.ts` › "T-010 criterion 9 …" › "no file tracked under question-bank/data/ contains reviewed: false anywhere" scans only `data/`. Mutation: inserting `"reviewed": false,` into `data/us-states/us-state-wy.json` turned it red. The file was restored with `git checkout`, and its sha256 was checked against the saved one. |
| 13 | **not yet met: needs approved rows** | › criterion 13 is red today and names 11 files: the rows below. It goes green only once they are applied. It exempts only `git-exit-guard.criteria.test.ts`, the exemption the criterion names. |
| 14 | **red: needs approved rows** | `question-bank` `bun test`: 2220 pass, 31 fail (the worker's 30 plus my criterion-13 test). typecheck passes. lint gives 0 warnings and 0 errors. format:check passes. Frontend: this environment cannot install `react-simple-maps` (403 from `europe-west1-npm.pkg.dev`, reproduced). The PR's CI job "frontend (typecheck, lint, test)" is **success** on the branch head `d16f329`. CI "question-bank" is failure, from the stale tests. |
| 15 | met so far | The worker edited no pre-existing test: `git diff 97780b5 HEAD -- '*.test.ts'` is empty. I edited none either. They wait for approval. |

**Why criteria 4 and 8–11 have no committed test.** Each one compares the branch with base `97780b5`. CI clones shallow, so base cannot be reached there. Pinning `frontend/`, `.claude/`, the bank and every manifest by digest would make each later task that touches them stale, which is the cost this task is paying now (T-070 Q1). I ran the commands above once, on this branch at `d16f329`, and recorded the result here.

**New test file:** `question-bank/src/purge-sample-data-verify.test.ts` has 10 tests. 9 pass. The criterion 13 test is red until the rows are applied, and it then stays as the regression test.

**Handoff claims checked:** the 30 reds match its list exactly. The extra stale items it found are real: `highest-point-in-state-verify.test.ts` T-079 criterion 20, the `highest-point-verify.test.ts` vacuity test, the exact `toBe(55)`, and the floors. My own count of the floors agrees with its table. The one-off rewrite of `frontend/README.md` did not recur in my frontend run (`git status` was clean afterwards).

## Test change request

Raised by the tester, 2026-10-20. **Nothing below has been applied yet.** Every row is stale for the same reason: criterion 1 deletes `question-bank/sample-data/` and criterion 2 deletes `build:sample`, so a test that reads, hashes or lists the sample, or pins the old `question-bank/package.json`, now fails or breaks criterion 13. All paths are `question-bank/src/`. Line numbers are at `d16f329`.

**Introduced.** `git log -S` returns `4e1550e` (T-071, the prettier reformat) as the earliest commit for every row in the T-010…T-016 files, because the reformat rewrote each line. The task that actually wrote the test is the one its `describe` names, and that is the task given below.

**Deletions also take their now-unused helpers.** The `SAMPLE` / `SAMPLE_DIR` / `SAMPLE_DIGEST` / `SAMPLE_DIGESTS_AT_E10F94D` constants, the `sample()` / `stripBuiltAt` helpers inside a deleted describe, and the comments that describe only the sample are removed with the row that leaves them unused. Lint would otherwise fail on unused bindings. Nothing else in those files moves.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `committed-bank.test.ts:153` › "T-010 criterion 4 — the tracked Colorado matches the committed sample" › "data/us-states/us-state-co.json equals sample-data/us-state-co.json except sources.built_at, top_crops and top_livestock" | `4e1550e`; T-010: kept the sample in step with the bank | crit 1: nothing left to compare against | delete (the whole describe and its `:149-152` comment) | — | approved — Dkaattae, 2026-10-20 |
| 2 | `committed-bank.test.ts:256` › "T-010 criteria 11–16 — …" › "criterion 11 — no shipped file still asserts the bank is not stored in git" | `4e1550e`; T-010: no doc claims the bank is untracked | crit 1: `sample-data/README.md` no longer exists, so `read()` throws | modify | Same name. The path list drops `"question-bank/sample-data/README.md"`, and the test still asserts that each of `question-bank/.gitignore`, `question-bank/README.md`, `conventions.md` and `PROGRESS.md` does not contain "regenerated from Wikidata, not stored in git" | approved — Dkaattae, 2026-10-20 |
| 3 | `fun-facts.test.ts:172` › "T-011 criterion 2 — …" › 'no file tracked under question-bank/data/ or sample-data/ contains reviewed": false' | `4e1550e`; T-011: no unreviewed prose committed | crit 1: `trackedUnder("question-bank/sample-data")` throws on an empty listing | modify | Renamed 'no file tracked under question-bank/data/ contains reviewed": false'. `paths` is `trackedUnder("question-bank/data")` alone. It keeps `expect(paths.length).toBeGreaterThan(51)` and the per-path `{ path, hasUnreviewed: false }` assertion unchanged | approved — Dkaattae, 2026-10-20 |
| 4 | `fun-facts.test.ts:396` › "T-011 criterion 11 — the docs this change falsifies are true again" › "11(a) — sample-data/README.md no longer calls the sample's fun fact unreviewed Wikipedia prose" | `4e1550e`; T-011: that README's fun-fact claim | crit 1: the README is deleted | delete | — | approved — Dkaattae, 2026-10-20 |
| 5 | `fun-facts.test.ts:404` › same describe › "11(a) — sample-data/README.md no longer says nothing has reached an entity's fun-fact field" | `4e1550e`; T-011: same | crit 1 | delete | — | approved — Dkaattae, 2026-10-20 |
| 6 | `state-animals.test.ts:467` › "T-012 criterion 7 — the committed sample stays in step with the bank" › "sample-data/us-state-co.json equals the tracked Colorado in every field but sources.built_at, top_crops and top_livestock" | `4e1550e`; T-012: sample in step with the bank | crit 1 | delete | — | approved — Dkaattae, 2026-10-20 |
| 7 | `state-animals.test.ts:471` › same describe › "the sample carries the same state_animal as the tracked Colorado" | `4e1550e`; T-012: same | crit 1 | delete (the describe goes with rows 6–7) | — | approved — Dkaattae, 2026-10-20 |
| 8 | `state-animals.test.ts:727` › "T-012 criterion 11 — …" › 'no file tracked under question-bank/data/ or sample-data/ contains reviewed": false' | `4e1550e`; T-012: no unreviewed text | crit 1, as row 3 | modify | As row 3: renamed '…under question-bank/data/ contains reviewed": false', `data/` only, `> 51` and the per-path `{ path, unreviewed: false }` kept | approved — Dkaattae, 2026-10-20 |
| 9 | `landmarks.test.ts:522` › "T-013 criterion 8 — the committed sample stays in step with the bank" › "sample-data/us-state-co.json equals the tracked Colorado in every field but …" | `4e1550e`; T-013: sample in step with the bank | crit 1 | delete | — | approved — Dkaattae, 2026-10-20 |
| 10 | `landmarks.test.ts:526` › same describe › "the sample carries the same landmark as the tracked Colorado" | `4e1550e`; T-013: same | crit 1 | delete (the describe goes with rows 9–10) | — | approved — Dkaattae, 2026-10-20 |
| 11 | `landmarks.test.ts:693` › "T-013 criterion 13 — …" › 'no file tracked under question-bank/data/ or sample-data/ contains reviewed": false' | `4e1550e`; T-013: no unreviewed text | crit 1, as row 3 | modify | As row 8 | approved — Dkaattae, 2026-10-20 |
| 12 | `landmarks-verify.test.ts:434` › "T-013 tester, criterion 8 — the committed sample stays in step with the bank" › "the sample equals the tracked Colorado in every field but sources.built_at, top_crops and top_livestock, landmark included" | `4e1550e`; T-013 tester: same | crit 1 | delete (the describe goes) | — | approved — Dkaattae, 2026-10-20 |
| 13 | `landmarks-verify.test.ts:580` › "T-013 tester, criterion 10 — Colorado's landmark is unchanged" › "the plan's §1.4 example string is what the table, the bank and the sample all carry" | `4e1550e`; T-013 tester: CO landmark pinned in three places | crit 1: the third place is gone | modify | Renamed "the plan's §1.4 example string is what the table and the bank carry". It keeps the two exact `toBe("Rocky Mountain National Park")` assertions, on `CURATED_US_STATES` CO and on `data/us-states/us-state-co.json`, and drops only the sample's | approved — Dkaattae, 2026-10-20 |
| 14 | `landmarks-verify.test.ts:652` › "T-013 tester, criterion 13 — …" › 'no file under data/ or sample-data/ contains reviewed": false' | `4e1550e`; T-013 tester: no unreviewed text | crit 1: `walk()` throws ENOENT on the missing directory | modify | Renamed 'no file under data/ contains reviewed": false'. `files = walk(join(PKG, "data"))` alone. It keeps `> 51` and the per-file `{ path, unreviewed: false }` | approved — Dkaattae, 2026-10-20 |
| 15 | `climate-kid.test.ts:583` › "T-014 criterion 13 — the committed sample stays in step with the bank" › "sample-data/us-state-co.json carries the same climate_kid as the tracked Colorado" | `4e1550e`; T-014: sample in step with the bank | crit 1 | delete | — | approved — Dkaattae, 2026-10-20 |
| 16 | `climate-kid.test.ts:594` › same describe › "sample-data/us-state-co.json was not touched by this task (git status is clean for it)" | `4e1550e`; T-014: the sample was untouched | **green, but breaks crit 13**: it runs `git diff` on the path | delete (the describe goes with rows 15–16) | — | approved — Dkaattae, 2026-10-20 |
| 17 | `climate-kid.test.ts:618` › "T-014 criterion 14 — Colorado's phrase is unchanged" › "the sample carries exactly this string" | `4e1550e`; T-014: the CO phrase in the sample | crit 1. The table and the tracked file stay pinned by the two sibling tests in that describe | delete | — | approved — Dkaattae, 2026-10-20 |
| 18 | `climate-kid.test.ts:831` › "T-014 criterion 18 — …" › 'no file tracked under question-bank/data/ or sample-data/ contains reviewed": false' | `4e1550e`; T-014: no unreviewed text | crit 1, as row 3 | modify | As row 8 | approved — Dkaattae, 2026-10-20 |
| 19 | `climate-kid-verify.test.ts:744` › "T-014 tester, criterion 13 — the committed sample stays in step with the bank" › "the sample equals the tracked Colorado in every field but sources.built_at, top_crops and top_livestock" | `4e1550e`; T-014 tester | crit 1 | delete | — | approved — Dkaattae, 2026-10-20 |
| 20 | `climate-kid-verify.test.ts:761` › same describe › "climate_kid in particular is present and equal in both" | `4e1550e`; T-014 tester | crit 1. The tracked file's phrase stays pinned by row 21 | delete (the describe goes with rows 19–20) | — | approved — Dkaattae, 2026-10-20 |
| 21 | `climate-kid-verify.test.ts:770` › "T-014 tester, criterion 14 — Colorado's phrase is unchanged" › "the curated table, the tracked file and the sample all carry the pinned string" | `4e1550e`; T-014 tester | crit 1 | modify | Renamed "the curated table and the tracked file both carry the pinned string". It keeps both exact `toBe(COLORADO_PHRASE)` assertions, on the table's CO and on `data/us-states/us-state-co.json`, and drops only the sample's | approved — Dkaattae, 2026-10-20 |
| 22 | `climate-kid-verify.test.ts:1122` › "T-014 tester, criterion 18 — …" › 'no file under data/ or sample-data/ contains reviewed": false' | `4e1550e`; T-014 tester | crit 1, as row 14 | modify | As row 14 | approved — Dkaattae, 2026-10-20 |
| 23 | `top-crops-verify.test.ts:536` › "T-015 tester, criterion 11 — the docs no longer say the field is empty" › "sample-data/README.md no longer says top_crops needs USDA NASS" | `4e1550e`; T-015 tester: README stopped claiming NASS | crit 1: the README is deleted | delete | — | approved — Dkaattae, 2026-10-20 |
| 24 | `top-crops-verify.test.ts:572` › "T-015 tester, criterion 12 — the committed sample is untouched" › "sample-data/us-state-co.json is byte-identical to the default branch" | `4e1550e`; T-015 tester: the sample frozen | crit 1 | delete | — | approved — Dkaattae, 2026-10-20 |
| 25 | `top-crops-verify.test.ts:576` › same describe › "the sample's own top_crops is still []" | `4e1550e`; T-015 tester | crit 1 | delete | — | approved — Dkaattae, 2026-10-20 |
| 26 | `top-crops-verify.test.ts:581` › same describe › "sample-data/README.md says the sample is an older snapshot with empty top_crops while the bank is curated" | `4e1550e`; T-015 tester | crit 1 | delete (the describe and the `:561-569` comment and constant go with rows 24–26) | — | approved — Dkaattae, 2026-10-20 |
| 27 | `highest-point-verify.test.ts:394` › "T-016 tester, criterion 6 — the other 49 files, index.json and the sample are untouched" › "sample-data/us-state-co.json is byte-identical to the default branch" | `4e1550e`; T-016 tester | crit 1 | delete | — | approved — Dkaattae, 2026-10-20 |
| 28 | `highest-point-verify.test.ts:691` › "T-016 tester — the pins above are not vacuous" › "DEFAULT_BRANCH_DIGESTS covers all 51 tracked paths plus the sample". Also the `"sample-data/us-state-co.json"` key in `DEFAULT_BRANCH_DIGESTS` (`:137`), which rows 27 and 28 both read | `4e1550e`; T-016 tester: the digest map is complete | crit 1: the key's file is gone. If the key goes without this test changing, the test turns red | modify | The key is removed from `DEFAULT_BRANCH_DIGESTS`. The test is renamed "DEFAULT_BRANCH_DIGESTS covers exactly the 51 tracked paths" and asserts `Object.keys(DEFAULT_BRANCH_DIGESTS).sort()` `toEqual(["index.json", ...trackedStateFiles()].sort())`, still an exact set. The header comment at `:22-23` drops "plus `sample-data/us-state-co.json`" | approved — Dkaattae, 2026-10-20 |
| 29 | `highest-point-metres-verify.test.ts:670` › "T-069 tester, criterion 12 — nothing else in the bank moved" › "sample-data/ is byte-identical to main" | `1386de3`, T-069 tester: the sample untouched by the metres change | crit 1: `readdirSync` throws | delete | — | approved — Dkaattae, 2026-10-20 |
| 30 | `hand-check-levels-verify.test.ts:704` › "T-025 criteria 14-17: no data, dependency or E-n moved; old tests unmodified" › "criterion 14: question-bank/data (outside T-040's data/questions/), sample-data and src/fixtures are byte-identical to aa88101" | `236b0e0`, T-025 tester: data/sample/fixtures frozen | crit 1: the sample manifest is now empty | modify | Renamed "criterion 14: question-bank/data (outside T-040's data/questions/) and src/fixtures are byte-identical to aa88101". The `sample:` key is dropped from both sides. The `data` (`a67db502…d6`) and `fixtures` (`b7fe3a94…76`) digests are unchanged | approved — Dkaattae, 2026-10-20 |
| 31 | `hand-check-levels-verify.test.ts:723` › same describe › "criterion 15: every package.json and lockfile is byte-identical to aa88101, and none was added" | `236b0e0`, T-025 tester: no dependency moved | crit 2: removing `build:sample` changes `question-bank/package.json`'s bytes. Its dependencies are unchanged (crit 10, checked) | modify | Same name and assertions. Only the `question-bank/package.json` value becomes `5286f4f725a98f5e54d45cf2646be5b38152ffc87ba5ac91039b919c49ec3f72`, with a comment "re-pinned by T-064 row 31: build:sample removed (its criterion 2)". The other seven digests and the tracked-manifest-set check are unchanged | approved — Dkaattae, 2026-10-20 |
| 32 | `highest-point-in-state-verify.test.ts:473` › "T-079 tester, criterion 20 — every package.json and bun.lock is byte-identical to 323254c" › "question-bank/package.json" | `2a1202d`, T-079 tester: no dependency moved | crit 2, as row 31 | modify | Same name. It expects `5286f4f725a98f5e54d45cf2646be5b38152ffc87ba5ac91039b919c49ec3f72`, with the same comment. The other five entries and "no other package.json or bun.lock is tracked" are unchanged | approved — Dkaattae, 2026-10-20 |
| 33 | `hand-check-levels-verify.test.ts:768` › same describe as row 30 › "criterion 17: every question-bank test file at aa88101 is present and unmodified" | `236b0e0`, T-025 tester: older tests untouched | rows 1–39 edit ten of the 48 files it hashes, so its aggregate digest moves | modify | Same name, the same 48-file list, presence check and `toBe(48)`. The final `toBe(…)` digest is re-pinned to the aggregate computed after rows 1–32 and 34–39 are applied, and the comment gains "Re-pinned by T-064's approved Test change request rows 1–39" | approved — Dkaattae, 2026-10-20 |
| 34 | Floor for `committed-bank.test.ts`, `{ tests: 33, expects: 55 }`, in five tables: `climate-kid-verify.test.ts:1161` (T-014 tester crit 19), `climate-kid.test.ts:882` (T-014 crit 19), `landmarks-verify.test.ts:692`, `landmarks.test.ts:752`, `state-animals.test.ts:781` | `4e1550e`; T-014/T-013/T-012 "nothing weakened" floors | row 1 deletes 1 test and 1 expect from that file | modify | `{ tests: 32, expects: 54 }` in all five, each with a comment "T-064 row 1 deleted the sample comparison". Lowered by exactly row 1 | approved — Dkaattae, 2026-10-20 |
| 35 | `climate-kid-verify.test.ts:1204` › "T-014 tester, criterion 19 — nothing weakened" › "committed-bank.test.ts's expect count really is 55, so the lowered floor is not slack" | `2da025b`, T-040 tester row B1 | row 1 removes one `expect(` | modify | Renamed "… really is 54 …", asserting `toBe(54)` exactly | approved — Dkaattae, 2026-10-20 |
| 36 | Floor for `fun-facts.test.ts`, `{ tests: 30, expects: 59 }`, in the same five tables (`climate-kid-verify:1163`, `climate-kid:884`, `landmarks-verify:694`, `landmarks:754`, `state-animals:783`) | `4e1550e`; same floors | rows 4–5 delete 2 tests and 5 expects (3 + 2) | modify | `{ tests: 28, expects: 54 }` in all five, with a comment citing T-064 rows 4–5 | approved — Dkaattae, 2026-10-20 |
| 37 | Floor for `state-animals.test.ts` tests, 42, in `climate-kid-verify:1165`, `climate-kid:886`, `landmarks:757` and `landmarks-verify:698` | `4e1550e`; same floors | rows 6–7 delete 2 tests (2 expects; the count goes 76 → 74, still above every expects floor of 73 or 70) | modify | `tests: 40` in all four. The expects floors (73, 73, 73, 70) are unchanged. Each carries a comment citing T-064 rows 6–7 | approved — Dkaattae, 2026-10-20 |
| 38 | Floor for `landmarks.test.ts` tests, 52, in `climate-kid-verify:1167` and `climate-kid:888` | `4e1550e`; same floors | rows 9–10 delete 2 tests (3 expects; 91 → 88, which still meets the floor of 88) | modify | `tests: 50` in both. The expects floor of 88 is unchanged. Each carries a comment citing T-064 rows 9–10 | approved — Dkaattae, 2026-10-20 |
| 39 | Floor for `landmarks-verify.test.ts` tests, 36, in `climate-kid-verify:1168` and `climate-kid:889` | `4e1550e`; same floors | row 12 deletes 1 test (2 expects). With row 13's dropped expect, 73 → 70, still above the floor of 69 | modify | `tests: 35` in both. The expects floor of 69 is unchanged. Each carries a comment citing T-064 row 12 | approved — Dkaattae, 2026-10-20 |

**Not on the list, checked:** `git-exit-guard.criteria.test.ts:623` and `:687` hold string literals only, which criterion 13 exempts. No frontend, e2e or backend test mentions the sample. `highest-point-verify.test.ts`'s T-016 criterion 10 guards (expect count > 10 in `landmarks-verify`, `climate-kid-verify` and `top-crops-verify`) and `region-vocabulary.test.ts`'s T-017 criterion 6 guards still hold after these rows. The rows do not remove the region neutralisation or the "region removal actually drops" tests.

**After all 39 rows**, the expected result is that `purge-sample-data-verify.test.ts` › criterion 13 goes green and the question-bank suite goes to 0 fail. The tester applying the rows re-runs the whole suite to confirm that, and re-counts the floors, before a pass.

To approve: start the `tester` step for T-064 in a session you are attending, and answer it there, row by row. It fills in Decision, sets the header's `Test changes:` to `approved — <name>, <date>`, and applies exactly the approved rows. Or make the approved edits yourself, by hand, and set `Next step: tester`.

## Notes

- **Worker, 2026-10-20.** Production change was the easy part (5 files, 3 deletions). Nearly all the work is in the stale-test inventory above. The expander sized this M, and that is right.
- **Decision: README example.** I added the pointer to `data/us-states/us-state-co.json` to the layout entry, not as a new section. That is the smallest edit that meets criterion 7. **Reviewer to confirm.**
- **Decision: propose modify, not delete, for the `reviewed: false` scans.** This keeps expect counts and floor churn lower. Criterion 12 is already carried by `committed-bank.test.ts` T-010 criterion 9 either way. **Tester to propose and a human to approve, per D-14.**
