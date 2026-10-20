# T-064 — Purge `question-bank/sample-data/` now the full bank is proven

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** a person — 2026-10-20, in the orchestrator session ("approved, start the worker"). See `runs/T-064-purge-sample-data.md`.
**Test changes:** `none`
**From:** [`tasks.md`](../tasks.md) T-064
**Branch:** `claude/optimistic-pascal-wk81ey`
**PR:** #89, opened draft at expand time, built from the branch above. It **stays
draft** until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-10-20 | cse_0155zx41KsbKu7xBvuZNrYFV |
| worker | 2026-10-20 | cse_0155zx41KsbKu7xBvuZNrYFV (orchestrated subagent; the remote session id is shared with the expander's, so the tester must check isolation by its own spawn, not this id) |

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

## Notes

- **Worker, 2026-10-20.** Production change was the easy part (5 files, 3 deletions). Nearly all the work is in the stale-test inventory above. The expander sized this M, and that is right.
- **Decision: README example.** I added the pointer to `data/us-states/us-state-co.json` to the layout entry, not as a new section. That is the smallest edit that meets criterion 7. **Reviewer to confirm.**
- **Decision: propose modify, not delete, for the `reviewed: false` scans.** This keeps expect counts and floor churn lower. Criterion 12 is already carried by `committed-bank.test.ts` T-010 criterion 9 either way. **Tester to propose and a human to approve, per D-14.**
