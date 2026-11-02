# T-039 — Three endpoints exist and serve nothing — run log

**Task:** T-039 · **Branch:** `claude/kind-pasteur-34x9tx` · **PR:** #113
**Started:** 2026-11-02 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-11-02
`Next step` on entry: `(no brief)` → on exit: `human` (`Status: blocked`)

**I stopped T-039 before writing acceptance criteria. Status is `blocked`, Next step is `human`.** The queue entry is three product decisions that nobody has made, so I can't write criteria without making them myself. The branch is pushed and draft PR #113 is open: https://github.com/Dkaattae/geo-discovery-zone/pull/113

**What a person needs to do:** answer Q1–Q4 in the brief or on the PR, then set `Next step: task-expander` and start a new expander run.

**Why T-039 was picked.** The rule is the first task in `tasks.md` whose dependencies are done. The three tasks above it are each waiting on a person:

| Task | What it is waiting for |
|---|---|
| T-085b | A choice of Census data source |
| T-056 | A design decision about how the map fills in |
| T-095 | A person's choice between options (a), (b) and (c) |

T-039 says `Depends on: —`, but its body is three separable decisions. Most entries after it are decisions too (T-045, T-053, T-093, T-046). **T-047** is the first entry that needs no decision. I named it in the brief and the PR but did not switch to it, because my role says not to pick a different task after halting.

**What is already true:**
- **All three endpoints return nothing on purpose.** `backend/app/routers/content.py:44-49` makes geometry return 404 and both list endpoints return empty.
- **Tests pin that empty state.** They are in `backend/tests/test_content_api.py` at lines 213-238.
- **`openapi.yaml` describes all three as if they were served** and never says they are unimplemented.
- **No client calls any of them.**
- **The area superlative already ships without this endpoint**, as the `tpl-biggest-state` question template.

**Questions in the brief:**
- **Q1, geometry:** say it is reserved for later clients, serve the US states shape file now (this needs a data source, and maybe a dependency approval), or remove the endpoint.
- **Q2, superlative axes:** say it is unimplemented, serve the US area axis, or remove it. Serving it needs two answers: is the existing prompt "Which of these states is the biggest?" acceptable text for children, and should the axis come from the pipeline or be a constant in the backend?
- **Q3, elevation profiles:** say they are intentionally unimplemented and what serving them would take, or remove both endpoints.
- **Q4, split:** if any answer is "serve", split into T-039a (docs), T-039b (superlative axis) and T-039c (geometry). Otherwise it stays one small task.

**Commits on `claude/kind-pasteur-34x9tx`.** The push landed: local HEAD and `origin/claude/kind-pasteur-34x9tx` are both `cc00b4f`.
- `1e607ae` — `T-039 expander: empty-content-endpoints (blocked: needs a person)`. Touches only the new brief and `tasks.md`, where T-039 is marked doing/blocked.
- `cc00b4f` — records PR #113 in the brief's `PR:` header.

**Brief header:** `Branch: claude/kind-pasteur-34x9tx`, `Approved: pending`, and a `Fault:` line saying it is blocked on undecided product calls. My Sessions row uses session `cse_011oDiJespfZF72h12BCQwBp`.

`PROGRESS.md` is unchanged, since nothing new is true yet. I ran no build or tests, as my role requires.

## Halted — 2026-11-02
Header reads `Status: blocked`, `Next step: human`, `Approved: pending`. No `Approved:` stamp written (halted before G2). Branch head at halt: `cc00b4f`.

What a person has to decide, quoted from the expander: "answer Q1–Q4 in the brief or on the PR, then set `Next step: task-expander` and start a new expander run."

## Human answer — 2026-11-02
Dkaattae, in the orchestrator's session: "Q1 reserved, Q2 unimplemented, Q3 unimplemented — keep it one task"

Orchestrator appended those words verbatim to the brief under `## Answers`, and set the header to `Status: expanding`, `Next step: task-expander` (process.md "Answering": answer in the brief, set Next step back, start a run).

## Round 2 — task-expander — 2026-11-02
`Next step` on entry: `task-expander` → on exit: `worker` (`Status: awaiting approval`, `Approved: pending`)

**TL;DR:** T-039 is expanded from Dkaattae's answers, and the brief is now `awaiting approval` with `Next step: worker`. It is a doc-only task, size S. It changes `openapi.yaml` only and has 19 acceptance criteria. The push landed (`e4b1c34..da50ae9`), and I updated PR #113's body. **A person still has to approve:** `Approved:` says `pending`.

**What I did**
- **Brief:** I rewrote `/home/user/geo-discovery-zone/tasks/T-039-empty-content-endpoints.md`. It now has:
  - the decisions mapped to the options: Q1 (a) reserved, Q2 (a) unimplemented, Q3 (a) unimplemented, no split;
  - a survey, the 19 criteria, out of scope, constraints and context;
  - your recorded answers, kept verbatim.
- **Header:**
  - `Status: awaiting approval`, `Next step: worker`, `Approved: pending`.
  - `Branch: claude/kind-pasteur-34x9tx` and `PR: #113` are unchanged.
  - I added a second Sessions row for this resumed run (`cse_011oDiJespfZF72h12BCQwBp`).
  - `Fault:` still holds the earlier one. The template only clears it when the task reaches `pass`.
- **Queue:** I edited the T-039 heading in `/home/user/geo-discovery-zone/tasks.md` from `M · doing (blocked: needs a person…)` to `S · doing (awaiting approval…)`.
- **Commit:** `da50ae9`, "T-039 expander: empty-content-endpoints (criteria from Dkaattae's answers)". It touches only `tasks/` and `tasks.md`. The local branch is up to date with origin.
- **PR #113:** the title is now "T-039: document the three empty content endpoints as not implemented in v1", and the body holds the criteria. It is still a draft.

**What the survey found**
- **Already true, nothing to change:**
  - The runtime behaviour, in `backend/app/routers/content.py:44-49` and lines 264-325.
  - The four pinning tests, in `backend/tests/test_content_api.py:213-238`.
  - `backend/README.md:38-46` and `PROGRESS.md:1773`, which already say these endpoints serve nothing on purpose.
- **What remains:** `openapi.yaml` describes the four operations (`getGeometry`, `listElevationProfiles`, `getElevationProfile`, `listSuperlativeAxes`) and the `info.description` Content bullet as if they served data.

**Criteria in brief**
- **Marking (1-2):** each of the four operation descriptions contains the exact text `Not implemented in v1`, and no other operation's does. A test can check this.
- **Content (3-12):** each description names its current response and what serving it would take:
  - geometry: `us-atlas`, TopoJSON, Census TIGER, Natural Earth, kept for later clients;
  - superlatives: `tpl-biggest-state` via `/questions`, and a reviewed `promptMost`;
  - elevation: a terrain source sampled at build time;
  - the `info` bullet says the three are not implemented in v1.
- **Nothing else moves (13-19):**
  - runtime responses and the four pinning tests stay unchanged;
  - the set of paths, methods and operationIds stays the same, and the three schemas keep their `required` lists;
  - all suites pass;
  - nothing changes under `backend/app/`, `frontend/`, `question-bank/` or `e2e/`;
  - no dependency is added and no test reaches the network.

**Choice for the approver to check:** the exact phrase `Not implemented in v1` in criterion 1 is my wording. I fixed one phrase so the mark can be tested rather than judged by reading prose.

## Approval — 2026-11-02
Dkaattae, in the orchestrator's session, answering "How should it be approved?": "I approve it". Orchestrator wrote the `Approved:` line from that answer.

## Round 3 — worker — 2026-11-02
`Next step` on entry: `worker` → on exit: `tester` (`Status: awaiting verification`)

**T-039 worker is done and pushed.** `openapi.yaml` now labels the four empty operations `Not implemented in v1` and says what serving each would take. Status is `awaiting verification`, Next step is `tester`. Three existing question-bank tests that check `openapi.yaml` against a fixed hash now fail because of this change. That is expected, and they are listed in the Handoff under **Tests made stale**.

- **Push:** commit `ed00235` is on `claude/kind-pasteur-34x9tx` (the brief's `Branch:` header, and the branch I was on). `git log origin/claude/kind-pasteur-34x9tx -1` shows it.

**What changed**
- **`/home/user/geo-discovery-zone/openapi.yaml`**
  - The descriptions of `getGeometry`, `listElevationProfiles` and `listSuperlativeAxes` are rewritten to carry every literal criteria 1-11 ask for.
  - `getElevationProfile` had no description, so I added one.
  - The Content bullet in `info.description` now lists only `/entities`, `/questions` and `/bundles`. It then says the other three paths are "not implemented in v1".
  - No path, method, `operationId`, schema or `x-` extension changed.
- **`/home/user/geo-discovery-zone/backend/tests/test_unimplemented_content_docs.py`** (new): 3 tests covering criteria 1-12. Criterion 2 is checked exactly: only those four operations carry the label.
- **`/home/user/geo-discovery-zone/tasks/T-039-empty-content-endpoints.md`**: Handoff (with a per-criterion table), Sessions row, header and Notes.
- **No runtime change:** nothing under `backend/app/`, `frontend/`, `question-bank/` or `e2e/` changed, and no lockfile.

**Test results**

| Suite | Result | Notes |
|---|---|---|
| Backend tests | 747 passed, 9 skipped | Lint and format-check clean |
| question-bank `bun test` | 2676 pass, 17 fail | 3 are the stale tests; the other 14 fail the same way on the head before my commit (`3de6aca`, checked with my diff stashed) |
| frontend `bun test` | 386 pass, 10 fail | Same on that head; caused by the container, not this change |

- **question-bank pre-existing reds:** 11 are T-066 tests that need `oxlint`/`prettier`, which are not installed here. The other two are T-096 criterion 21 and T-091 criterion 22, which were already red on the branch.
- **frontend reds:** this container has no `frontend/node_modules`, and `bun install --frozen-lockfile` was refused by the proxy (403). The tester needs to rerun it somewhere dependencies install.
- **Side effect:** running the frontend suite rewrites `frontend/README.md`. I reverted it, and it is not committed.

**Tests made stale**, each needing its hash updated:
- `question-bank/src/agriculture-true-wrong-answers-verify.test.ts`, "T-088 … criterion 21: openapi.yaml is byte-identical to main's".
- `question-bank/src/map-click-no-candidates-verify.test.ts`, "T-092 criterion 16 … openapi.yaml (except []) is byte-identical to 5d72ca5".
- `question-bank/src/familiarity-drawn-apart-verify.test.ts`, "T-085a … criterion 25: openapi.yaml is unchanged since 5ae564a".
- The new hash values are in the Handoff.

**Decisions for others**
- **Criterion 17 can't pass as written** (owner: tester to raise the test change request under D-14, human to approve). The brief says "Test changes: none" and expects question-bank to pass, but the three hash checks above mean any change meeting criteria 1-12 turns them red.
- **Session ids don't separate the roles** (owner: tester, human if it can't confirm): every Sessions row, mine included, shows `cse_011oDiJespfZF72h12BCQwBp`, because all roles run as subagents of one remote session. The tester should judge its independence some other way.
- **Old explanations kept** (owner: reviewer, to confirm or trim): I kept each operation's previous text under "Once served" instead of deleting it.

_Orchestrator note: this hand-back was delivered to the orchestrator's context in full; none of it goes into the tester's prompt, which is the unmodified template._
