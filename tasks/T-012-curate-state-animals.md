# T-012 — Curate state animals

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `pending` — replace with who approved and the date
**From:** [`tasks.md`](../tasks.md) T-012
**Branch:** `claude/laughing-brown-iiooy9` — this session's harness assigned it and
forbids pushing elsewhere (`CLAUDE.md` "Branches", `process.md` "When the
environment names the branch for you"). **This line is the authority**, not
`task/T-012-…`: it is the branch the PR is built from and the one every later
role pushes to.
**PR:** [#42](https://github.com/Dkaattae/geo-discovery-zone/pull/42), opened
draft at expand time from the branch above. It stays draft until the reviewer
approves it.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-09-15 | cse_01Wc3UR6unsEDFGsaxbim3HB |

---

## Goal

Give every US state a state animal a nine-year-old would recognise, held in the
curated build input, so the `wildlife` topic (T-026) has data to generate
questions from. Plan §1.9 calls animals out by name as hand-curation — Wikidata's
coverage is genuinely poor — so this is 50 hand-made decisions, not a query.

## What the survey found — what is already true, and what is not

Read this before planning anything. Most of the plumbing this task would
otherwise need already exists; the work left is the curation itself.

**Already true — do not rebuild any of it:**

- **The field exists.** `CuratedState.state_animal?: string`
  (`question-bank/src/curated/us-states.ts:33`) and `Entity.state_animal?: string`
  (`question-bank/src/types.ts:52`).
- **The fold-in exists.** `normalize.ts:138` already emits
  `...(curated.state_animal ? { state_animal: curated.state_animal } : {})` —
  conditional, so a curated blank means the key is **absent** from the built
  entity, unlike `fun_facts`, which always emits at least `[]`. No change to
  `normalize.ts` should be needed.
- **The committed bank exists and rebuilds byte-for-byte offline** — 51 tracked
  paths under `question-bank/data/us-states/` (T-010,
  `engineering-decisions.md` **E-6**), checked on every `bun test` by
  `committed-bank.test.ts` ("T-010 criteria 6 and 8", line 181).
- **The precedent for a curation task in this exact file is T-011** (PR #41): all
  50 `fun_facts` are filled, `reviewed: true`, and the bank was regenerated
  rather than hand-edited.

**Not true yet — this task's actual work:**

- **`state_animal` is 0 of 50.** No row in `CURATED_US_STATES` sets it
  (`grep -c "state_animal:"` → 0, the one hit being the interface declaration),
  and no file under `question-bank/data/us-states/` contains the key.
- The built bank therefore has to be regenerated once the table is filled, and
  `sample-data/us-state-co.json` with it if Colorado gets an animal.

**One trap T-011 hit, recorded so this task does not repeat it:** there is **no
`bun run lint` in `question-bank/`** — only `build`, `build:sample` and
`typecheck` (`question-bank/package.json`). T-011's criterion 13 demanded one and
was unsatisfiable; that gap is T-066. Criterion 12 below names only the checks
that exist.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

Throughout, **"the 50 tracked files"** means the 50 `us-state-<postal>.json`
files tracked under `question-bank/data/us-states/`, and **"the default branch"**
means `main` as of this task's branch point.

1. **Every state is accounted for, and no blank is silent.** The set of states
   whose tracked file has **no** `state_animal` key is **exactly** the set of
   states this brief's `## Handoff` names as deliberately left blank, each with a
   reason. If the Handoff names none, all 50 tracked files carry the key; if it
   names *k* states, exactly 50 − *k* files carry it and the *k* without it are
   those states. (`CLAUDE.md`: prefer a blank field to a guessed one — but a
   blank has to be declared.)

2. **A blank is an absent key, not an empty one.** For any state left blank under
   criterion 1, its tracked file contains no `state_animal` key at all — not
   `""`, not `null`, not `"unknown"`. For every other state the value is a
   non-empty string.

3. **Every value is a kid-sized common name.** Each `state_animal` string is
   between 3 and 40 characters inclusive (2 fails, 3 passes, 40 passes, 41
   fails), equals its own `trim()`, contains no newline or tab, contains no digit,
   starts with a letter, and is not entirely uppercase.

4. **No value is reference-book prose or a scientific name.** No `state_animal`
   contains a parenthesis, a comma, a semicolon, a colon, or a full stop; and none
   contains, case-insensitively, any of: `spp.`, `subspecies`, `genus`,
   `endemic`, `state animal`, `state mammal`, `official`, `designated`, `adopted`.
   ("Rocky Mountain bighorn sheep" passes; "White-tailed deer (Odocoileus
   virginianus)" and "official state mammal: elk" both fail.)

5. **The text lives in the build input, not in built output.** Every
   `state_animal` value appearing in any of the 50 tracked files also appears
   verbatim as a `state_animal` value in
   `question-bank/src/curated/us-states.ts`, and every `state_animal` value in
   that file appears in exactly one tracked file — the one for its own state
   (matched by `postal` → `us-state-<postal>.json`).

6. **The bank is built, not hand-edited.** Running
   `bun run src/build.ts --offline --out <temp dir>` from `question-bank/` with no
   network available reproduces all 51 tracked paths byte-for-byte, twice in a
   row, and `sources.built_at` in every tracked file is still
   `2026-08-04T16:05:35.000Z`. (This is `committed-bank.test.ts`'s existing
   describe block "T-010 criteria 6 and 8", which must still pass against the
   *new* tracked bytes.)

7. **The committed sample stays in step with the bank.**
   `question-bank/sample-data/us-state-co.json` equals the tracked
   `question-bank/data/us-states/us-state-co.json` in every field except
   `sources.built_at` — so if Colorado gets an animal, the sample carries the same
   one. (`committed-bank.test.ts` "T-010 criterion 4", line 154.)

8. **Nothing but `state_animal` moves in the bank.** For each of the 50 tracked
   files, the only difference from the same file on the default branch is the
   presence of a `state_animal` key; `region`, `climate_kid`, `landmark`,
   `top_crops`, `fun_facts`, `borders`, the ranks and `sources` are unchanged. The
   set of states carrying `landmark` is still exactly {Colorado} and the set
   carrying `climate_kid` is still exactly {Colorado} — T-013 and T-014 own those
   fields and edit the same file. `question-bank/data/us-states/index.json` is
   byte-identical to the default branch's.

9. **Animals shared by several states are disclosed, not hidden.** Two states may
   carry the same animal — the white-tailed deer is many states' official
   designation, and picking a different one to avoid a collision would be
   inventing data. But the `## Handoff` lists every value carried by two or more
   states together with the states sharing it, and that list matches exactly the
   duplicate groups computed from the 50 tracked files. (T-026's `wildlife`
   template asks "Which animal is <state>'s state animal?"; a shared answer is
   fine forwards and ambiguous backwards, and the generator's author needs to know
   which ones.)

10. **Everything a child will read can be read in one place.** The `## Handoff`
    lists all 50 states, each with the exact `state_animal` string shipped for it
    (or the reason it is blank) **and the official designation it came from**
    (e.g. "state animal", "state mammal", "state marine mammal") plus where that
    was checked, in a form a person can read top to bottom without opening 50
    files.

11. **Nothing unreviewed, live or new is committed.** The bytes `reviewed": false`
    appear in no file tracked under `question-bank/data/` or
    `question-bank/sample-data/`; no `*.review.json` path under
    `question-bank/data/us-states/` is tracked; no `package.json` or lockfile in
    the repo gains a dependency; no test added or changed by this task performs a
    network request or mocks `fetch`.

12. **Nothing already verified is weakened.** No test is deleted from
    `question-bank/src/committed-bank.test.ts`,
    `question-bank/src/data-us-states.test.ts`,
    `question-bank/src/fun-facts.test.ts` or
    `question-bank/src/normalize.test.ts`, and no assertion in any of them is
    loosened. `bun test` and `bun run typecheck` pass in `question-bank/`, and the
    `frontend/` and `backend/` suites are untouched. (There is no `bun run lint`
    in `question-bank/` — do not add one here; that is T-066.)

## Out of scope

- **Serving these animals to the app.** Nothing in `backend/`, `frontend/` or
  `openapi.yaml` changes. The bridge from the pipeline bank to the served bank is
  **T-040**; growing the served bank to 50 states is **T-050**.
- **The `wildlife` question template and its distractors** — that is **T-026**
  (and T-022 for distractor strategy). This task produces the data only; write no
  template, no generator, no distractor logic.
- **The other curated fields** — `landmark` (T-013), `climate_kid` (T-014),
  `top_crops` (T-015), `fun_facts` (done, T-011). Do not fill them while you are
  in the file; criterion 8 enforces that, and T-013/T-014 edit the same rows.
- **State birds, flowers, trees, fish, insects or reptiles as new fields.** The
  schema gains nothing. If a state's only sensible animal designation is a bird,
  that is a value for `state_animal`, not a new key.
- **Adding a source or citation field to `CuratedState`.** Provenance for this
  task lives in the `## Handoff` (criterion 10), which is what the human review
  reads. Changing the schema is a separate decision.
- **Running the live pipeline.** A live run (`bun run build`, no `--offline`) is
  optional raw material, never a deliverable: it rewrites `sources.built_at` to
  wall clock and would break criterion 6, and it drafts a `fun-facts.review.json`
  that must stay uncommitted.
- **T-063** (scheduled refresh), **T-064** (deleting `sample-data/`), **T-065**
  (stale suite counts), **T-066** (no `lint` in `question-bank`), **T-017**
  (region vocabulary). Regenerating `sample-data/us-state-co.json` here is
  criterion 7, not T-064.
- **`process.md`, `CLAUDE.md`, `.claude/`, workflows.** Those are `P` tickets and
  the loop may not touch them.

## Constraints

- **Files expected to change:** `question-bank/src/curated/us-states.ts` (up to 50
  `state_animal` entries), the 50 entity files under
  `question-bank/data/us-states/`, `question-bank/sample-data/us-state-co.json`,
  test files under `question-bank/src/`, and this brief. Nothing else is
  expected; `normalize.ts` already folds the field in (`normalize.ts:138`).
- **Never hand-edit a file under `question-bank/data/us-states/` or
  `question-bank/sample-data/`.** Regenerate them:
  `cd question-bank && bun run src/build.ts --offline --out data/us-states` and
  `bun run build:sample`. E-6 exists because hand-edited built output is
  destroyed by the next rebuild.
- **`sources.built_at` must stay `2026-08-04T16:05:35.000Z`** — the fixture's
  capture instant, which only the offline path preserves and which is what makes
  the rebuild byte-identical.
- **Choosing which animal, when a state has several designations.** Prefer the
  designation the state itself calls its *state animal*; failing that its state
  mammal; failing that the single animal a child would most likely meet in that
  state's own symbols. **Whatever the rule produced, record the designation per
  state in the Handoff** (criterion 10) so a human can check the pick rather than
  the procedure. If a state has no defensible official animal, leave it blank and
  say so — `CLAUDE.md`: a wrong state animal in a quiz that claims to teach is
  worse than a missing one.
- **The 200 KB cap** on everything tracked under `question-bank/data/` still holds
  (`committed-bank.test.ts` "T-010 criterion 5"). It is ~39.5 KB today, so there
  is room, but it is a real ceiling.
- **No dependency without asking** (`CLAUDE.md` "Packages"). `bun` only.
- **No network in tests, and never mock `fetch`** (`test-guidelines.md`). The
  existing rebuild tests run with all six proxy spellings pointed at
  `http://127.0.0.1:1`; follow that pattern.
- **Reviewer, note:** this PR is outside the envelope by construction — it is text
  a child will read (`process-decisions.md` **D-4a**, `process.md` step 6). Flag
  it; do not mark it ready with no note.

## Context

**Required reading for the worker and the tester**, not background.

- **Why this is hand-curated at all:** `geoquizdataplan.md` **§1.9**, the
  `animals / plants` row — "⚠️ hand-curate. Wikidata coverage is genuinely poor
  here. Budget for this."
- **What the field looks like when filled:** `geoquizdataplan.md` **§1.4**'s
  entity record example, which uses `"state_animal": "Rocky Mountain bighorn
  sheep"` for Colorado. That string is the shape and tone model.
- **Why built output is not the home for curated text:**
  `engineering-decisions.md` **E-6**, especially "Where a reviewed fun fact
  lives…" — the same reasoning governs `state_animal`.
- **Content rules:** `CLAUDE.md` "Content rules" (prefer a blank field to a
  guessed one), `process.md` "Tasks this loop does not fit" (content and curation
  are verified by human reading plus shape tests), `process-decisions.md` **D-4a**.
- **The code:**
  - `question-bank/src/curated/us-states.ts` — `CuratedState` at lines 23–43
    (`state_animal` at line 33, with the §1.9 comment), the 50 rows from line 45.
    Colorado (line 112) is the only row with `climate_kid` and `landmark` filled
    and is the model for a hand-edited row.
  - `question-bank/src/normalize.ts:123–152` — entity assembly; line 138 is the
    `state_animal` fold-in, already written and conditional.
  - `question-bank/src/types.ts:33–59` — `Entity`, `state_animal` at line 52.
  - `question-bank/package.json` — the only scripts are `build`, `build:sample`
    and `typecheck`.
- **The tests that already constrain this**
  (`question-bank/src/committed-bank.test.ts`): criterion 3 completeness (line
  117), criterion 4 sample ↔ bank equality (line 154), criterion 5 the 200 KB cap
  (line 170), criteria 6 & 8 offline rebuild byte-identity (line 181), criterion 9
  no `reviewed: false` (line 237).
- **The precedent:** T-011's entry in `PROGRESS.md` ("Earlier tasks, on-process")
  and PR #41 — the same file, the same rebuild discipline, and the three places
  reality differed from its brief.

## Review checklist — a human must do this before merge

The criteria above check shape. None of them checks whether an animal is
**actually** that state's, and no test can. Record in the PR who checked each box
and when.

- [ ] Every value is genuinely that state's official designation — spot-check
      against the state's own symbols list, not a listicle. A wrong state animal
      in an app that claims to teach is the failure `CLAUDE.md` names.
- [ ] The designation type recorded in the Handoff matches the value (a state
      mammal is not labelled a state animal, and vice versa).
- [ ] Every value reads as a name a nine-year-old would say out loud — common
      name, no Latin, no honorifics, no committee language.
- [ ] Nothing grim or frightening reached a value; any state whose designation is
      awkward for children was flagged by the worker rather than quietly softened.
- [ ] No state was given a guessed animal where a blank was the honest answer, and
      every blank in the Handoff has a real reason.
- [ ] The shared animals listed under criterion 9 are correct, and T-026's entry
      in `tasks.md` is enough of a warning for whoever writes that template.

## Handoff

Written by `worker` before the tester runs. **Always written, even when nothing
was built.** Criteria 1, 9 and 10 make this section the single place all 50
values can be read: list every state with its animal, its designation type and
where it was checked; list every deliberate blank with its reason; and list every
animal shared by two or more states with the states sharing it.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes
