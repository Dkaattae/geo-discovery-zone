# T-108 — `README.md` still says "15 states, 26 questions", and cites E-14 by bare id

**Status:** `pass`
**Next step:** `reviewer`
**Approved:** orchestrator — 2026-11-12, unattended run. See `runs/T-108-readme-bank-size.md`.
**Test changes:** `applied through CI fix plan (D-20)`
**CI fix:** `applied — approved — orchestrator, 2026-11-12, auto-approved after a 63-minute timeout; no human answered. See runs/T-108-readme-bank-size.md`
**From:** [`tasks.md`](../tasks.md) T-108
**Branch:** `task/T-108-readme-bank-size`
**PR:** #135, opened draft at expand time, built from the branch above; stays draft until the reviewer approves it

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated run; roles spawned as subagents share this id) |
| worker | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated run; subagent, shares the run's id) |
| tester | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated run; freshly spawned subagent, shares the run's id) |
| ci-fix | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated run; freshly spawned subagent, shares the run's id) |
| ci-fix (pass 2) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated run; freshly spawned subagent, shares the run's id) |
| tester (re-verify after ci-fix) | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated run; freshly spawned subagent, shares the run's id) |

> **Full brief, not light.** T-108 is `S`, but its criteria run past four, so
> the light path does not apply (`process.md`, "The light path, for S-sized
> tasks").

## Goal

`README.md` is the first thing anyone reads, and it says the app ships 15 states
and 26 questions with human-written, reviewed explanations. None of that has been
true since T-040 (PR #88). It also cites `E-14` twice without saying which file
the id lives in. Make the README say only true things about the bank, and make
the two citations resolvable.

## Acceptance criteria

Frozen once approved. **Base** means `8092372`, this branch's base on `main`.
**The Tech stack section** means the lines of `README.md` after the
`## Tech stack` heading and before the next line starting `## `. **The Layout
block** means the lines strictly inside the first fenced code block after
`## Layout`. **A number** means a token of digits (`415`, `1,204`) or a
spelled-out cardinal number word (`one`, `fifteen`, `twenty-six`, `fifty`,
`hundred`); ordinals such as `first` are not numbers. **A sentence** ends
at `.`, `!` or `?` followed by whitespace or end of text, or at a blank line.

**What is true today, surveyed for this brief** (so the worker does not
re-derive it; the tester checks the criteria, not this list):

- The bank served is the pipeline's **50 states** (`backend/app/data/content.json`
  has 50 entities) and **415 generated questions** (`PROGRESS.md`, "In one
  paragraph"). The question count has changed with every template task (T-040,
  T-026, T-051), and nothing re-checks a figure written in the README.
- **No served question has an explanation.** `content.json`'s questions carry no
  `shortExplanation` or `detailExplanation` key (E-24, "The loader writes no prose
  of its own"). A wrong answer's reveal is `"The answer is X."`
  (`backend/app/grading.py` `build_reveal`, line 279 on).
- **Fun facts are human-reviewed.** A correct answer's headline is the entity's
  `funFact`, which is its first fun fact marked `reviewed: true`
  (`backend/app/content_build.py` `reviewed_fun_fact`); all 50 entity files under
  `question-bank/data/us-states/` have one (T-011, PR #41).
- `README.md:32` (Tech stack row) and `README.md:215` (Layout line) already say
  `follows the backend` and `(E-14)` (T-106, PR #133). Only the file name is
  missing.

### The bank paragraph (`README.md:37-38` at base)

1. **No stale size.** No line of `README.md` contains `15 states` or
   `26 questions` (case-insensitive, any whitespace between the two words).
2. **No question count anywhere in `README.md`.** No sentence of `README.md`
   contains a number among the five words immediately before a word `question`
   or `questions` (case-insensitive). The question count drifts with every
   template change and nothing guards it, so the README states none. Sentences
   where a number comes only *after* the word (line 16-17's "at 5, 10 and 20")
   are not covered and stay as they are.
3. **A state count, if stated, is 50.** Every number among the five words
   immediately before a word `state` or `states` (case-insensitive) in any
   sentence of `README.md` is `50` or `fifty`. Stating no state count at all also
   satisfies this criterion.
4. **No claim about explanations in the Tech stack section.** No line of the
   Tech stack section contains `explanation` (case-insensitive, so `explanations`
   too) or `human-written` (case-insensitive). At base the only such line is 38.
5. **No `human-written` anywhere in `README.md`** (case-insensitive). At base the
   only occurrence is line 38.
6. **The paragraph still says what ships.** The Tech stack section, outside its
   table rows (lines starting `|`), contains at least one sentence that contains
   both `US` (case-sensitive, whole word or as in `US-states`) and `states`
   (case-insensitive), and contains the word `only` (case-insensitive). The README
   keeps telling a reader that only a US-states bank ships today.
7. **The paragraph is one paragraph of one to four lines.** The base lines 37-38
   are replaced by one run of one, two, three or four consecutive non-blank
   lines, in the same place: after the paragraph starting "The backend serves
   the API" and before the `## Run it locally with Docker` heading, with exactly
   one blank line on each side. No other paragraph is added to the Tech stack
   section.

### The two E-14 citations

8. **The Tech stack row names the file.** Under `## Tech stack` there is still
   exactly one table row starting `` | `openapi.yaml` | ``. It contains
   `engineering-decisions.md` and `E-14` as a whole word (`\bE-14\b`), and still
   contains `follows the backend`, and does not contain `contract`
   (case-insensitive). A markdown link to `engineering-decisions.md` counts, as
   long as the text `engineering-decisions.md` appears on the row.
9. **The Layout line names the file.** The Layout block still contains exactly
   one line matching `/^openapi\.yaml\s/`. It contains `engineering-decisions.md`
   and `\bE-14\b`, still contains `follows the backend`, does not contain
   `contract` (case-insensitive), and its description still starts at column 21
   (1-based), as every other line of the block does at base.
10. **No `contract` anywhere in `README.md`** (case-insensitive) — unchanged from
    base, restated because criteria 8 and 9 reword the two lines T-106 cleared.

### Nothing else moves

11. **Only those lines change in `README.md`.** Compared with base, every line of
    `README.md` other than 32, 37, 38 and 215 is byte-identical and in the same
    order; lines 32 and 215 are each replaced by exactly one line; lines 37-38
    are replaced as criterion 7 says. Verified by `git diff 8092372 -- README.md`
    recorded in the Verdict, **not** by a new committed digest pin (P-17).
12. **The worker changes no other file.** The worker's commits touch only
    `README.md` and this brief. In particular `openapi.yaml`,
    `engineering-decisions.md`, `geoquizdataplan.md`, `PROGRESS.md`,
    `conventions.md`, `CLAUDE.md`, every file under `.claude/`, every file under
    `backend/app/` and `question-bank/src/curated/` are byte-identical to base.
    Verified by `git show --stat` per worker commit, recorded in the Verdict.
13. **No new dependency.** Every `package.json`, `bun.lock`, `pyproject.toml` and
    `uv.lock` is byte-identical to base.
14. **The whole suite is green on the final tree, and pre-existing tests move
    only by approval.** `make -C backend check`, and `bun test`,
    `bun run typecheck`, `bun run lint` and `bun run format:check` in both
    `frontend/` and `question-bank/`, pass on the final tree. That includes the
    README guards already in the suite: no count of tests anywhere in
    `README.md` (`frontend/src/conventions-doc.test.ts`,
    `frontend/src/readme-test-count.criteria.test.ts`), and T-106's
    `question-bank/src/openapi-contract-wording-verify.test.ts`. Every
    pre-existing test deleted or modified on this branch is changed only by an
    approved Test change request row or an approved CI fix plan row (D-14, D-18,
    D-20). A modified test still pins what it pinned before, except for the
    README lines this brief names.

## Out of scope

- **The pitch at the top of `README.md`** — line 5's "they get an explanation or
  a fun fact" and line 13's "A miss earns the reason the right answer is right".
  They describe the product's design intent under "Four things shape every
  decision", not what ships. Whether the README should also say that misses have
  no written explanations yet is a product wording call; the reviewer may queue it.
- **`question-bank/src/curated/us-states.ts:69` and `:80`**, source comments that
  still say "the 15 states shipping today". Source, not a doc; the reviewer may
  queue it.
- **Writing explanations**, or any change to what the reveal shows
  (`grading.py`, `content_build.py`, the bank). This task only stops the README
  claiming they exist.
- **`PROGRESS.md`, `conventions.md`, `tasks.md`** — no edit by the worker.
  `conventions.md:16` already writes "engineering-decisions.md E-14".
- **Adding `engineering-decisions.md` to the README's "More detail" list.**
  Allowed only if it is on lines 32 or 215 (criterion 11 forbids other lines).
- **`openapi.yaml`, `CLAUDE.md`, `geoquizdataplan.md`** and the `backend/` vs
  `api/` name (T-046).
- **Any other README wording**, including the Known issues and Checks sections.

## Constraints

- Files expected to change: `README.md` (lines 32, 37-38, 215), this brief.
- `README.md` is under its own tests — `frontend/src/conventions-doc.test.ts`
  (T-058 job list and commands; T-062 "no count of tests anywhere in README"),
  `frontend/src/readme-test-count.criteria.test.ts`,
  `frontend/src/readme-suite-counts.criteria.test.ts`,
  `question-bank/src/openapi-contract-wording-verify.test.ts` (T-106), and the
  README scans in `question-bank/src/purge-sample-data-verify.test.ts` and
  `question-bank/src/lint-gate.test.ts`. The new wording must state no count of
  tests, in digits or words, and must not name `sample-data` or `build:sample`.
- The root `README.md` is not under either package's prettier `format:check`,
  but keep the Layout block's column alignment (criterion 9).
- Expect the usual whole-tree pins to go red from this brief, the run log and
  `README.md` being changed or new tracked files (as in T-104 to T-106:
  `question-bank/src/farm-animal-loose-ends-verify.test.ts` criterion 21,
  `question-bank/src/climate-cold-trade-accepted-verify.test.ts` criterion 22,
  and their kin — both list `README.md` among their counted files). Run **every**
  CI job's checks, not only one package's (P-17's recurrences).
- No new dependency. No new committed digest pin for criteria 11 and 12.
- Content rule (`CLAUDE.md`): this is not text a child reads, but the README must
  not claim reviewed prose that does not exist. "Prefer a blank field to a guessed
  one" applies to the bank's size: no figure is better than a drifting one.

## Context

Required reading for the worker and the tester.

- `README.md:32` (Tech stack row), `README.md:37-38` (the bank paragraph),
  `README.md:215` (Layout block).
- `engineering-decisions.md` **E-14** (line 687 on) — what the citation points
  at; **E-24** (line 1338 on) — "The loader writes no prose of its own", the
  archived hand-written bank of 26 questions and 15 fun-fact details.
- `conventions.md:16` — the model for naming the file with the id.
- `backend/app/grading.py` `build_reveal` (line 255 on) — what a right and a
  wrong answer actually show.
- `backend/app/content_build.py` `reviewed_fun_fact` (line 118 on).
- `PROGRESS.md`, "In one paragraph" — 50 states, 415 questions.
- `question-bank/src/openapi-contract-wording-verify.test.ts` — T-106's README
  tests, which must stay green.
- `tasks.md` T-108 entry; T-106's PR #133, where this was found.
- `process-tasks.md` P-17 — why "nothing else moved" is checked by diff, not pin.

## Handoff

**TL;DR:** Three edits to `README.md`, nothing else. The README bank and E-14 guards are green.
Two whole-tree count pins in `question-bank` are red. They were already red at the branch head
before I touched anything (the brief and run log are new files), and they are listed below.
The `frontend` red is environmental: `react-simple-maps` is missing from `node_modules`, and
the proxy refuses the tarball download with a 403. The tester should run `bun install` where
the registry is reachable.

**Changed, file by file**

- **`README.md:32`**: the Tech stack row now ends ``(`engineering-decisions.md` E-14) |``. It
  keeps `follows the backend` and has no `contract`.
- **`README.md:37-38`**: the bank paragraph is replaced by these two lines, in the same place, with one blank line on each side:
  `Only a US-states bank ships today, covering all 50 states. A right answer` /
  `shows a human-reviewed fun fact; a wrong one names the right answer.`
- **`README.md:215`**: the Layout line is now `openapi.yaml        describes the API; follows the backend (engineering-decisions.md E-14)`.
  Its description still starts at column 21.
- **This brief**: Sessions row, Status, Next step, Handoff, Notes.
- **Nothing else.** No code, no tests, no dependency.

**Where each criterion lives**

| # | Where |
|---|---|
| 1, 5 | `15 states`, `26 questions` and `human-written` are gone. Line 37-38 was their only occurrence |
| 2 | The new paragraph has no `question` word. I scanned every README sentence with a script: no number appears within the five words before `question(s)` |
| 3 | The only number before `state(s)` anywhere in the README is `50` (line 37) |
| 4 | The new paragraph has no `explanation` |
| 6 | Line 37's first sentence has `US`, `states` and `Only` |
| 7 | Lines 37-38: one paragraph of two lines, between "The backend serves the API" and `## Run it locally with Docker` |
| 8 | Line 32 |
| 9 | Line 215 |
| 10 | No `contract` in the README, checked by grep |
| 11 | Check with `git diff 8092372 -- README.md`. It shows three hunks: 32, 37-38 and 215 |
| 12, 13 | The worker commit touches only `README.md` and this brief |
| 14 | See "Suite run" below |

**Deliberately not done**

- **Lines 5 and 13 of the pitch, and the `us-states.ts` "15 states" comments**: out of scope per the brief.
- **"Nothing yet" wording for misses**: the new line says only that a wrong answer names the right
  answer, which is what `build_reveal` does when a question has no `shortExplanation`. It says
  nothing about planned explanations, because that is the product call the brief puts out of scope.

**Contradictions with the brief:** none found.

**Suite run (final tree)**

- `make -C backend check`: **1221 passed, 9 skipped**.
- `question-bank`: `bun test` **2739 pass, 2 fail**. The two fails are listed under Tests made stale.
  `typecheck`, `lint` and `format:check` pass.
- `frontend`: `bun test` **420 pass, 4 fail**, and `bun run typecheck` fails. All of it comes from
  `Cannot find package 'react-simple-maps'` / `us-atlas`, in `t026-setup.criteria`,
  `t051-map-click`, `t051-tester.criteria` and `screens.criteria`. `bun install --frozen-lockfile`
  failed with `ProxyConnectFailed (403)` on the d3 tarballs. This is an environment problem and has
  nothing to do with the README. `lint` and `format:check` pass.
- **README guards are green:** `conventions-doc`, `readme-test-count.criteria` and
  `readme-suite-counts.criteria` (135 pass), and `openapi-contract-wording-verify`,
  `purge-sample-data-verify` and `lint-gate` (57 pass).

**Tests made stale**

These were already red at `edbf4d2`, before the worker's change. I stashed my edit and reran to
confirm: 280/282 and 283/285. The cause is the two new tracked files, this brief and
`runs/T-108-readme-bank-size.md`. The `README.md` edit also changes a file these pins count. This
is the usual whole-tree pin pattern from T-104 to T-106.

- **`question-bank/src/farm-animal-loose-ends-verify.test.ts`**, test `T-096 criteria 17-21: the bank and the boundaries > criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added`.
  It counts 282 against a pin of 280. Proposal: modify it the way T-104 to T-106 did. Allow
  `tasks/T-108-readme-bank-size.md` and `runs/T-108-readme-bank-size.md`, and exempt `README.md`
  from the byte-identical check, or re-pin it to the new tree. Owner: tester, via a Test change request.
- **`question-bank/src/climate-cold-trade-accepted-verify.test.ts`**, test `T-091 criterion 22: the diff touches only the allowed files > every tracked non-test file outside the allowed list is 12d242e's, and none is added`.
  It counts 285 against a pin of 283. Same proposal and same owner.

**How to run:** `make -C backend check`. Then in both `frontend/` and `question-bank/`:
`bun test`, `bun run typecheck`, `bun run lint`, `bun run format:check`. Use `bun test`, not
`bun run test`, because `frontend` has no `test` script.

## Verdict

### Re-verification after the CI fix (tester, round 2)

**TL;DR: `pass`.** I re-checked all 14 criteria on `66973e6`. Every one is met, and every suite is green: CI is green on all six jobs at `66973e6`, and locally the backend and `question-bank` pass in full. The ci-fix diff matches its four approved rows exactly. **Those four test rows were approved by the orchestrator's timeout stamp, not by a person, so the reviewer must escalate them (D-18).** **Next: `reviewer`.**

**Independence:** this is an orchestrated run (`runs/T-108-readme-bank-size.md` exists). My id, `cse_011oDiJdbpiNRtapJtyKBeQB`, is also listed against the worker, the earlier tester and both ci-fix passes, so the session-id check proves nothing. My independence rests only on being a freshly spawned subagent with its own context. I did not see any earlier role's session or reasoning. That is weaker than a separate session, because it depends on the orchestrator having spawned me correctly.

**No new tests.** The round-1 tester's `question-bank/src/readme-bank-size-verify.test.ts` (26 tests, unchanged since `3568b51`) already maps one test or more to each of criteria 1-10. I checked it below with new mutations, and checked criteria 1-10 again with my own throwaway scanner, which was not committed. The scanner flags `15 states` and `26 questions` in the base text, and on the final README its only hit before `state(s)` is `50`.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | Test `criterion 1` (2 tests). My scanner also finds no `15\s+states` and no `26\s+questions` |
| 2 | met | Test `criterion 2`. My scanner finds no number before `question(s)` anywhere. "at 5, 10 and 20" is still there |
| 3 | met | Test `criterion 3`. The only number before `state(s)` is `50`, in "covering all 50 states" |
| 4 | met | Test `criterion 4`. The Tech stack section has no `explanation` and no `human-written` |
| 5 | met | Test `criterion 5` |
| 6 | met | Test `criterion 6`. The sentence is "Only a US-states bank ships today, covering all 50 states." |
| 7 | met | Test `criterion 7`. One paragraph of two lines in the same place, with one blank line on each side |
| 8 | met | Test `criterion 8`. Line 32 ends ``(`engineering-decisions.md` E-14) \|``, and has no `contract` |
| 9 | met | Test `criterion 9`. Line 215's description starts at column 21 (checked with `cut -c21-`) |
| 10 | met | Test `criterion 10`. `grep -i contract README.md` finds nothing |
| 11 | met | `git diff 8092372 -- README.md` has two hunks. Line 32 becomes one line, lines 37-38 become the two new lines, and line 215 becomes one line. No other line moves |
| 12 | met | `git show --name-only` per commit. Worker `8d1dc8f` touches only `README.md` and this brief. `git diff --stat 8092372 HEAD` over `openapi.yaml`, `engineering-decisions.md`, `geoquizdataplan.md`, `PROGRESS.md`, `conventions.md`, `CLAUDE.md`, `.claude/`, `backend/app/` and `question-bank/src/curated/` is empty |
| 13 | met | The same empty diff over every `package.json`, `bun.lock`, `pyproject.toml` and `uv.lock` |
| 14 | met | Suite below. The pre-existing tests changed on this branch are exactly CI fix plan rows 1-4 |

**Pre-existing tests changed on this branch (all in `0f1fa82`, ci-fix), each matched to its row:**

- **Row 1**, `farm-animal-loose-ends-verify.test.ts`: the two T-108 files join `CRITERION_21_ALLOWED`, and a comment is added. `toBe(280)` and `MAIN_UNTOUCHABLE_SHA` are unchanged.
- **Row 2**, `climate-cold-trade-accepted-verify.test.ts`: the same two files join `CRITERION_22_ALLOWED`. Count 283 and the digest are unchanged.
- **Row 3**, same file: `MAIN_TESTS_COUNT` goes 130 -> 131, and `MAIN_TESTS_SHA` -> `dceadbd5…`. The only added test file is the tester's `readme-bank-size-verify.test.ts`.
- **Row 4**, same file: the farm file's `APPLIED_REQUEST_FILE_SHAS` entry -> `46475e2a…`. That equals `sha256sum` of the farm file as it is now.
- **Approval line:** `CI fix: applied — approved — orchestrator, 2026-11-12, auto-approved after a 63-minute timeout; no human answered`. No person approved these rows.
- **The pins still bite.** I appended a line to `geoquizdataplan.md`, a file outside both allowed sets. Both whole-tree pins went red (2 fail), and went green again once I reverted the edit.

**Mutations to `README.md`.** Each was run against `readme-bank-size-verify.test.ts` and then restored from a saved copy. `git status` was clean afterwards.

| Mutation | Went red |
|---|---|
| "all 50 states" -> "all 49 states" | criterion 3 |
| add "and 415 questions" | criterion 2 |
| add "with an explanation" to the paragraph | criterion 4 |
| drop `engineering-decisions.md` from the Layout line | criterion 9 |
| `E-14` -> `E-140` on the Tech stack row | criterion 8 (whole word) |
| remove the blank line before `## Run it locally with Docker` | criterion 7 |
| drop `Only` | criterion 6 |

**Suite on `66973e6`, as run**

- **`question-bank`:** `bun test` **2767 pass, 0 fail**. `typecheck`, `lint` and `format:check` pass.
- **`make -C backend check`:** ruff passes, **1221 passed, 9 skipped**.
- **`frontend`, locally:**
  - `lint` and `format:check` pass.
  - `bun test` gives **420 pass, 4 fail**, and `typecheck` fails. Every failure is `Cannot find module 'react-simple-maps'` / `us-atlas`.
  - `bun install --frozen-lockfile` gets `ProxyConnectFailed (403)` on d3 tarballs. This is the environment, not the code.
- **CI on `66973e6`** (REST check-runs): **all green.** That covers frontend (typecheck, lint, test), question-bank, backend, backend (postgres), integration and e2e. CI on `0f1fa82` is also all green, including the blocked-run notice. So the frontend criterion is met on CI, where the packages install.

### Round 1 (superseded by round 2 above)

**TL;DR: `fail`, for stale pins only.** All 14 criteria are met. The README edit is correct, and my 26 new tests went red on the base README. The `question-bank` suite has 3 red pre-existing whole-tree pins. They are stale by the task's own new tracked files, not by wrong code, and are routed to the `ci-fix` as the Test change request below (D-20). **Next: `ci-fix`.**

**Independence:** this is an orchestrated run (`runs/T-108-readme-bank-size.md` exists), so the session-id check cannot work: my id `cse_011oDiJdbpiNRtapJtyKBeQB` is the worker's too. My independence rests only on being a freshly spawned subagent with its own context. I did not see the worker's session or reasoning. That is weaker than a separate session, because it depends on the orchestrator spawning me correctly.

**Tests added:** `question-bank/src/readme-bank-size-verify.test.ts`, 26 tests, commit `3568b51`. The helper tests pin the scanners: number words, sentence splitting, and "number before the word" with the base paragraph as input.

| # | Verdict | Evidence |
|---|---|---|
| 1 | met | `criterion 1` tests: no `15\s+states` and no `26\s+questions` on any line |
| 2 | met | `criterion 2`: no number among the 5 words before `question(s)` in any sentence. Hyphenated compounds such as `question-bank` count too, so the scan errs strict. "at 5, 10 and 20" is still present |
| 3 | met | `criterion 3`: the only number before `state(s)` is `50` |
| 4 | met | `criterion 4`: no `explanation` and no `human-written` in the Tech stack section |
| 5 | met | `criterion 5` |
| 6 | met | `criterion 6`: the sentence "Only a US-states bank ships today, covering all 50 states." |
| 7 | met | `criterion 7`: one blank line, then a 2-line paragraph, then one blank line, then `## Run it locally with Docker`. The section has exactly 2 prose paragraphs, as at base |
| 8 | met | `criterion 8`: one row. It has `engineering-decisions.md`, `\bE-14\b` and `follows the backend`, and no `contract` |
| 9 | met | `criterion 9`: one line, same checks as 8. Its description starts at column 21 |
| 10 | met | `criterion 10` |
| 11 | met | `git diff 8092372 -- README.md`: three hunks. Line 32 becomes one line, lines 37-38 become two lines, line 215 becomes one line. Nothing else changes |
| 12 | met | `git show --stat` per commit. Worker `8d1dc8f`: `README.md` and this brief only. Expander `cc13a2b` and `57f7db9`: brief only. Orchestrator `edbf4d2` and `a620111`: run log and brief only. `git diff --stat 8092372 HEAD` over openapi.yaml, engineering-decisions.md, geoquizdataplan.md, PROGRESS.md, conventions.md, CLAUDE.md, `.claude/`, `backend/app/` and `question-bank/src/curated/`: empty |
| 13 | met | The same empty `git diff --stat` over every `package.json`, `bun.lock`, `pyproject.toml` and `uv.lock` |
| 14 | **not yet**, stale pins only | See the suite below. The README guards are green. 3 whole-tree pins are red because of this task's new tracked files |

**Mutations.** Each was applied to `README.md`, run, and reverted from a saved copy. `git status` was clean afterwards.

- **Base README restored** (`git show 8092372:README.md`): 9 red tests, covering criteria 1, 2, 3, 4 (both), 5, 8 and 9.
- **"forty states" plus "415 quiz questions", Layout column moved to 20, an extra paragraph added:** criteria 2, 3, 7 (both tests) and 9 (column) went red.
- **`Only` removed, `contract` added to the row:** criteria 6, 8 (no-contract) and 10 went red.

**Suite on the final tree (`3568b51`)**

- `make -C backend check`: ruff passes, **1221 passed, 9 skipped**.
- `question-bank`: `bun test` **2764 pass, 3 fail**. All 3 are the stale pins below. `typecheck`, `lint` and `format:check` pass. The README guards (`openapi-contract-wording-verify`, `purge-sample-data-verify`, `lint-gate`) are green.
- `frontend`, locally: `lint` and `format:check` pass. `bun test` gives 420 pass and 4 fail, and `typecheck` fails, all from `Cannot find package 'react-simple-maps'`. `bun install --frozen-lockfile` gets `ProxyConnectFailed (403)`: the proxy refuses `europe-west1-npm.pkg.dev` by policy, so this is the environment. **CI on `a620111` (REST check-runs) is green** for `frontend (typecheck, lint, test)`, and also for e2e, integration, backend and backend (postgres). The only red job is `question-bank`, from the stale pins. `README.md` is the only frontend-relevant change since then, and the README guards (`conventions-doc`, `readme-test-count.criteria`, `readme-suite-counts.criteria`) are in that green job. I have not seen CI on my own push yet.

**Red tests, all stale by this task's change (rows below):**

- `farm-animal-loose-ends-verify.test.ts` criterion 21: counts 282, pinned at 280.
- `climate-cold-trade-accepted-verify.test.ts`, the non-test-files pin: counts 285, pinned at 283.
- `climate-cold-trade-accepted-verify.test.ts`, the pre-existing-test-files pin: counts 131, pinned at 130, caused by my new test file.

## Test change request

Routed to the `ci-fix` (D-20). Decision is blank: these rows are the ci-fix plan's input, not an approval. `README.md` is already in both allowed sets (T-106), so the count and digest should be back at main's values once T-108's files join.

| # | Test (file › describe › name) | Introduced (commit, task, what it protected) | Why stale or wrong | Action | Becomes (modify only) | Decision |
|---|---|---|---|---|---|---|
| 1 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `T-096 criteria 17-21: the bank and the boundaries` › "criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | `47581ea`, T-096 tester. It protects against any non-test tracked file being changed or added outside the allowed set | T-108 adds two new tracked non-test files, `tasks/T-108-readme-bank-size.md` and `runs/T-108-readme-bank-size.md`, so the count is 282 against 280 | modify | The same name and the same two assertions, count `toBe(280)` and `MAIN_UNTOUCHABLE_SHA` unchanged. Only the two T-108 files join `CRITERION_21_ALLOWED`, with a comment citing T-108's ci-fix plan row. If the digest does not match after that, re-pin it and record the reason | |
| 2 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "every tracked non-test file outside the allowed list is 12d242e's, and none is added" | `950f334`, T-091 tester. Same protection, against T-091's base | Same two new files: 285 against `MAIN_UNTOUCHABLE_COUNT` 283 | modify | The same name and assertions, `MAIN_UNTOUCHABLE_COUNT` 283 and `MAIN_UNTOUCHABLE_SHA` unchanged. Only the two T-108 files join `CRITERION_22_ALLOWED`, with a comment citing the row. If the digest still differs, re-pin it and record the reason | |
| 3 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `T-091 criterion 22: the diff touches only the allowed files` › "pre-existing test files are main's, except ones in an approved Test change request" | `950f334`, T-091 tester. It protects against tracked test files being added or changed outside approved requests | T-108's tester added `question-bank/src/readme-bank-size-verify.test.ts` (a new test file), so the count is 131 against `MAIN_TESTS_COUNT` 130 | modify | The same name and assertions. `MAIN_TESTS_COUNT` goes 130 -> 131 and `MAIN_TESTS_SHA` is recomputed over the new tree, with a re-pin comment naming T-108's tester file, as T-106 row 5 did. No other test file may change the digest | |


## CI fix plan

Pass 1, written by the `ci-fix` (orchestrated, so nobody to ask in-session). All four rows are `pre-existing test` rows carried from the tester's Test change request (D-20), plus one it missed. **Nothing here is applied yet.**

**Independence:** orchestrated run (`runs/T-108-readme-bank-size.md` exists), so the session-id check proves nothing. My id `cse_011oDiJdbpiNRtapJtyKBeQB` is the worker's and the tester's too. My independence is only that I am a freshly spawned subagent that saw neither of their sessions.

Reproduced red at `4509165` (`bun test src/farm-animal-loose-ends-verify.test.ts src/climate-cold-trade-accepted-verify.test.ts` in `question-bank/`): 48 pass, 3 fail — 282 vs 280, 285 vs 283, 131 vs 130. All values below were observed by applying rows 1-3 in a throwaway worktree (since removed). The working tree is unchanged.

| # | File (and function or test) | Kind | Change | Why — failing test or CI line, root cause, criterion quoted for a test row | Decision |
|---|---|---|---|---|---|
| 1 | `question-bank/src/farm-animal-loose-ends-verify.test.ts` › `CRITERION_21_ALLOWED`, used by "T-096 criteria 17-21: the bank and the boundaries > criterion 21: outside the allowed files and test files, every tracked file is main's, and none is added" | pre-existing test (request row 1) | **Modify.** Add `tasks/T-108-readme-bank-size.md` and `runs/T-108-readme-bank-size.md` to `CRITERION_21_ALLOWED`, with a comment naming T-108's CI fix plan row 1 and its approval. Add a re-pin comment line above `MAIN_UNTOUCHABLE_SHA`. `toBe(280)` and `MAIN_UNTOUCHABLE_SHA` do **not** change: observed 280 files and digest `c274a19e…` after the edit, which is main's. `README.md` is already in the set (T-106) | Fails 282 vs 280. **Cause:** T-108 adds two new tracked non-test files, its brief and its run log. Introduced `47581ea` (T-096 tester), protecting against any non-test tracked file being changed or added outside the allowed set. **Criterion 12:** "The worker's commits touch only `README.md` and this brief." The brief and run log are the loop's own records, which the set already admits for T-091, T-096 and T-103 to T-106. The pin stays as strong: every other file is still held to main's count and digest | approved (orchestrator timeout stamp in header, D-18) |
| 2 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `CRITERION_22_ALLOWED`, used by "T-091 criterion 22: the diff touches only the allowed files > every tracked non-test file outside the allowed list is 12d242e's, and none is added" | pre-existing test (request row 2) | **Modify.** Add the same two T-108 files to `CRITERION_22_ALLOWED`, with a comment naming this row and its approval, plus a re-pin comment line above `MAIN_UNTOUCHABLE_SHA`. `MAIN_UNTOUCHABLE_COUNT` (283) and `MAIN_UNTOUCHABLE_SHA` (`53524b09…`) do **not** change: observed equal after the edit | Fails 285 vs 283. Same cause as row 1. Introduced `950f334` (T-091 tester), protecting the same thing against T-091's base. Same criterion 12 reading. The pin keeps the same strength | approved (orchestrator timeout stamp in header, D-18) |
| 3 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `MAIN_TESTS_COUNT`, `MAIN_TESTS_SHA`, used by "… > pre-existing test files are main's, except ones in an approved Test change request" | pre-existing test (request row 3) | **Modify (re-pin).** `MAIN_TESTS_COUNT` 130 → 131. `MAIN_TESTS_SHA` `e232903b8af97bfe5a8cd3c55baa8c867f79a480b29222febd648be4e00e54e3` → `dceadbd5fcba43e9ac32e29d58639ca29327420c489eca08cc07fab4092c8160`. Add re-pin comment lines naming T-108's tester file and this row. The digest was observed with rows 1-2 applied. It is unaffected by them, because this file and the farm file are both excluded from this set (`T091_TEST_FILES`, `TEST_CHANGE_REQUEST_FILES`). I confirmed it is the same value with row 1 reverted | Fails 131 vs 130. **Cause:** T-108's tester added `question-bank/src/readme-bank-size-verify.test.ts` (commit `3568b51`), which is the only tracked test file that differs. Introduced `950f334` (T-091 tester), protecting against test files being added or changed outside an approved request. **Criterion 14:** "Every pre-existing test deleted or modified on this branch is changed only by an approved … CI fix plan row". The new file is the task's own test, not a pre-existing one, so admitting it pins the other 130 as hard as before. Same shape as T-106's row 5 | approved (orchestrator timeout stamp in header, D-18) |
| 4 | `question-bank/src/climate-cold-trade-accepted-verify.test.ts` › `APPLIED_REQUEST_FILE_SHAS["question-bank/src/farm-animal-loose-ends-verify.test.ts"]`, used by "… > each test in the approved Test change request is 8108a42's: changed from main by its row's re-pin only" | pre-existing test (**not in the tester's request**; added by the ci-fix) | **Modify (re-pin).** Replace the farm file's digest `015526d2…` with the sha256 of the farm file **as it stands after row 1 is applied**, observed in pass 2. Append `// then by T-108 (CI fix plan row 4, for its row 1)` to that entry's re-pin comment chain. **Apply after row 1.** No other entry changes | Not red now. It **goes red the moment row 1 lands**: in the trial, "each test in the approved Test change request is 8108a42's" failed with one digest differing, the farm file's. **Cause:** row 1 edits a file this map pins by digest. Introduced `bac230d` (T-091 tester, review finding 1), protecting against any request file changing beyond its approved re-pins. **Criterion 14**, as in row 3. The new digest admits exactly row 1's approved edit and nothing more. T-106 needed the same row (its CI fix plan row 6) | approved (orchestrator timeout stamp in header, D-18) |

**Root cause:** No code is wrong. All 14 criteria are met (Verdict). Two whole-tree "nothing else moved" pins, from T-096 and T-091, count every tracked file outside a hand-kept allowed set. Every task adds its own brief and run log as new tracked files, so each task has to add them to both sets. T-108's tester also added a new test file, which the T-091 test-files pin counts. Changing the farm pin in turn moves its digest in T-091's request-file map. This is the recurring P-17 pattern, the same one T-104 to T-106 hit.

**Not doing:**
- **Rewriting the pins to read the allowed set from `tasks/`/`runs/` globs.** That would stop this recurring, but it changes what the pins protect. It is a loop change (P-17), not this task's, and it was not approved.
- **Re-pinning `MAIN_UNTOUCHABLE_SHA` / counts to the new tree** instead of extending the allowed sets. That would bake T-108's brief into "main's" digest and weaken the pin. Extending the sets keeps both values at main's.
- **Adding `README.md` anywhere.** It is already in both sets (T-106), and its change is checked by criterion 11's diff.
- **Frontend `react-simple-maps` red locally.** That is environmental (proxy 403 on install), the frontend CI job is green on `a620111`, and nothing in this plan touches it.

To approve by hand: fill in Decision, set the header's `CI fix:` to `approved — <name>, <date>` and `Next step` to `ci-fix`, commit, and start a run.

## CI fix

**TL;DR: all four approved rows applied, and `question-bank` is green (2767 pass, 0 fail).** Only the two pin files changed, and the README work is untouched. Backend is green. The frontend fails locally only because `react-simple-maps` is missing here. **Next: a fresh `tester`.**

**Approval:** `approved — orchestrator, 2026-11-12, auto-approved after a 63-minute timeout; no human answered. See runs/T-108-readme-bank-size.md`. That is the orchestrator's timeout stamp (D-17, D-18), so it covers every row as written. **No person approved these test rows**, so the reviewer must escalate (D-18).

**Independence:** this run is orchestrated (`runs/T-108-readme-bank-size.md` exists), so the session-id check proves nothing. My id `cse_011oDiJdbpiNRtapJtyKBeQB` is the worker's, the tester's and the pass-1 ci-fix's too. I am a freshly spawned subagent and have no other independence than that.

**Plan check:** the branch moved since the plan (`43698ef`) only by orchestrator commits to the run log and this brief, both of which rows 1-2 admit. Every row applied as written.

**Applied, file by file** (refused: none)

- **Row 1, `question-bank/src/farm-animal-loose-ends-verify.test.ts`:** `tasks/T-108-readme-bank-size.md` and `runs/T-108-readme-bank-size.md` added to `CRITERION_21_ALLOWED` with a comment naming the row and the approval, and a re-pin comment above `MAIN_UNTOUCHABLE_SHA`. `toBe(280)` and `MAIN_UNTOUCHABLE_SHA` (`c274a19e…`) are unchanged, and both hold.
- **Row 2, `question-bank/src/climate-cold-trade-accepted-verify.test.ts`:** the same two files added to `CRITERION_22_ALLOWED`, with the same comments. `MAIN_UNTOUCHABLE_COUNT` 283 and `MAIN_UNTOUCHABLE_SHA` (`53524b09…`) are unchanged, and both hold.
- **Row 3, same file:** `MAIN_TESTS_COUNT` 130 → 131. `MAIN_TESTS_SHA` → `dceadbd5fcba43e9ac32e29d58639ca29327420c489eca08cc07fab4092c8160`, the value the plan gave, with re-pin comments naming `readme-bank-size-verify.test.ts`.
- **Row 4, same file:** `APPLIED_REQUEST_FILE_SHAS["question-bank/src/farm-animal-loose-ends-verify.test.ts"]` `015526d2…` → `46475e2a41b81ea13b58335fa65aab7cdd94d66f1ed07b176166207558ebc9ea`. That is `sha256sum` of the farm file after row 1. `// then by T-108 (CI fix plan row 4, for its row 1)` is added to its comment chain. No other entry changed.

**Suite, as run on the final tree**

- `question-bank`: `bun test` **2767 pass, 0 fail**. `typecheck`, `lint` and `format:check` pass. The two pin files on their own: 51 pass, 0 fail.
- `make -C backend check`: ruff passes, **1221 passed, 9 skipped**.
- `frontend`: `lint` and `format:check` pass. `bun test` gives **420 pass, 4 fail** in three of four runs, and `typecheck` fails. Both come from `Cannot find package 'react-simple-maps'` / `us-atlas`, the same environmental gap the worker and tester recorded (the proxy blocks `bun install`). This plan touches no frontend file.

**Noticed, not changed**

- **One frontend run gave 419 pass, 5 fail.** The fifth failure was an `expect(received).toBe(expected)` and did not come back in the three later runs. That run was alongside `make -C backend check`, so it looks like a timing flake. I did not chase it. The tester should look at the frontend CI job on this push.
- **These pins will go red again for every task** (P-17). The plan's "Not doing" explains why I did not change that here.

## Notes

- **Wording choice:** "covering all 50 states" states the count as 50. Criterion 3 would also have
  allowed stating no count. I included it because it is the fact that replaces the stale one. It
  does not drift the way the question count does: the US-states bank is 50 by definition. Owner:
  reviewer to confirm or overturn.
- **"a wrong one names the right answer"** holds today because no served question carries
  `shortExplanation`. If a later task adds explanations, this line goes stale in a harmless way:
  it would understate what ships, not overclaim it. Owner: whichever future task adds
  explanations. The reviewer may want that noted against it in `tasks.md`.
- **The frontend `node_modules` is incomplete in this environment** and the proxy blocks
  installing it. Owner: tester, to rerun the frontend jobs where `bun install` succeeds.
