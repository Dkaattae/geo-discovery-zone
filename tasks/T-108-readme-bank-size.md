# T-108 — `README.md` still says "15 states, 26 questions", and cites E-14 by bare id

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** orchestrator — 2026-11-12, unattended run. See `runs/T-108-readme-bank-size.md`.
**Test changes:** `none`
**CI fix:** `none`
**From:** [`tasks.md`](../tasks.md) T-108
**Branch:** `task/T-108-readme-bank-size`
**PR:** #135, opened draft at expand time, built from the branch above; stays draft until the reviewer approves it
**Fault:**

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated run; roles spawned as subagents share this id) |
| worker | 2026-11-12 | cse_011oDiJdbpiNRtapJtyKBeQB (orchestrated run; subagent, shares the run's id) |

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
