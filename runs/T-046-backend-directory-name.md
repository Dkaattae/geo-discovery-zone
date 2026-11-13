# T-046 — Decide: `backend/` or `api/` — run log

**Task:** T-046 · **Branch:** `claude/relaxed-allen-5ro49x` · **PR:** #141
**Started:** 2026-11-13 · **Outcome:** ready for merge — escalated, needs Dkaattae to confirm "keep `backend/`"

## Round 1 — task-expander — 2026-11-13
`Next step` on entry: `(no brief)` → on exit: `worker`

T-046 is expanded. The brief is committed, pushed and confirmed on the remote, and draft PR #141 is open. Status: awaiting approval. Next step: worker.
The expander made the decision itself: keep `backend/`, and stop using `api/` as a name for the directory. A person should confirm that before or at merge. If they want the rename instead, the brief has to go back to the expander, because none of the criteria would survive a rename.

**Run details**
- **Task:** T-046, "Decide: `backend/` or `api/`"
- **Brief:** /home/user/geo-discovery-zone/tasks/T-046-backend-directory-name.md
- **Branch:** `claude/relaxed-allen-5ro49x`. It is in the brief's `Branch:` header. `origin/claude/relaxed-allen-5ro49x` is at `3ef0090` ("T-046 expander: record PR #141").
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/141 (draft, base `main`)
- **Diff against main:** `tasks/T-046-backend-directory-name.md` only.
- **Approved:** pending.
- **Sessions row:** task-expander, 2026-11-13, cse_011oDiJd2dgRHzBRDwBhvmNz.

**Why T-046 was the pick**
- **No T-task PRs are open.** The only open PR is #38, which is P-4.
- **T-085b skipped:** it needs Census access or a person to pick a source.
- **T-056 skipped:** it waits on a design decision.
- **T-095 skipped:** it waits on a person's call, its Q.
- **T-110 skipped:** it waits on Dkaattae's wording call.
- **T-046 is next in order** and depends on nothing. Its entry says "Either is fine, and deciding is not optional", and names no person who must decide. So the brief makes the call and puts it first, in a note under the header, in the Review checklist and in the PR body's TL;DR.

**What the brief asks for (12 criteria)**
- **A new entry, E-31, in `engineering-decisions.md`.** It must give:
  - the decision, naming T-046;
  - what a rename would have cost (`Dockerfile`, `ci.yml`, `backend/Makefile`);
  - the two leftover `api/` places in `CLAUDE.md` (lines 4 and 58), which are gated and need a P ticket;
  - a concrete revisit trigger;
  - the option not taken.
- **One line deleted from `backend/README.md`:** line 263, the stale "The directory is `backend/`, where `conventions.md` §Layout says `api/`". The rest of Known gaps stays byte-identical.
- **A `git grep` with stated exclusions must find no reference to an `api/` directory.** On main today it hits only that README line.
- **Negative checks:**
  - nothing is renamed;
  - Docker, CI, Makefile, package files and lockfiles are untouched;
  - no gated file is touched;
  - no test is added or changed.
- **The tester checks everything by hand.** `test-guidelines.md` now forbids committed tests of doc wording or repo shape in all three packages.

**Left for the reviewer (in the brief's Out of scope)**
- **P ticket for `CLAUDE.md`:** one is needed for lines 4 and 58, and none exists in `process-tasks.md`.
- **Two more stale bullets in `backend/README.md` Known gaps:** the "CI only runs the SQLite path" claim and the pin-grading bullet.
- **`PROGRESS.md`:** line 34 ("Which name wins is still T-046") and line 32 (says `CLAUDE.md` "lines 4 and 51", which is now 58).
- **`tasks.md` §A table:** it still names `conventions-doc.test.ts` and doc-count guards that the off-queue commits `8cf40b6` and `d594b38` deleted.

## Round 2 — worker — 2026-11-13
`Next step` on entry: `worker` → on exit: `tester`

**T-046 worker is finished.** I added E-31 ("keep `backend/`") and deleted the one stale line in `backend/README.md`. It is pushed to `claude/relaxed-allen-5ro49x`, and `git log origin/claude/relaxed-allen-5ro49x -1` shows my commit `c1638a1`. The brief now reads Status `awaiting verification`, Next step `tester`. The backend and question-bank suites pass. The frontend has 4 reds because this sandbox couldn't install two of its packages; I did not cause them.

**Changes:**
- **`engineering-decisions.md`**: added `---` and then `## E-31 — The service directory is `backend/`; `api/` is not a directory name` at the end of the file. The entry has:
  - a `**Decided: 2026-11-13 (T-046).**` line;
  - why `backend/` stays;
  - the rename to `api/` as the option not taken, with what it would cost (the `Dockerfile`, `.github/workflows/ci.yml`, `backend/Makefile` and about 100 other files);
  - quotes of `CLAUDE.md` lines 4 and 58, and a note that they are loop-gated and need a hand-written `P` ticket;
  - a `**Revisit when**` line: a second service is added beside `backend/`, or the repo moves to a `services/` or `apps/` layout.
- **`backend/README.md`**: deleted only the old line 263 under Known gaps. The other bullets there are byte-identical.
- **`tasks/T-046-backend-directory-name.md`**: added my Sessions row and wrote the Handoff (a table showing where each criterion is met) and the Notes.

**Checks:**
- **Criterion 9:** both `git grep` commands from the brief print nothing.
- **Backend:** `make -C backend check` gives 809 passed, 9 skipped.
- **Question-bank:** 229 tests pass; typecheck, lint and format check are clean.
- **Frontend:** lint and format check pass, but `bun test` has 4 fails and typecheck has matching TS2307 errors. Installing the frontend packages failed with `ProxyConnectFailed (403)` on `react-simple-maps`, `d3-geo` and `@types/geojson`. I stashed my change and ran the tests on base `b10fa64`: the same 4 fails. I tried to read the proxy README and status page to fix the install, but the permission classifier refused, so I left it there. The tester should rerun the frontend tests where the install works.
- **Tests made stale:** none.

**Decisions for you:**
- **Same session id as the expander.** `$CLAUDE_CODE_REMOTE_SESSION_ID` returned `cse_011oDiJd2dgRHzBRDwBhvmNz` for me, the same id the expander recorded. The tester's isolation check reads this table, so it will see the match. You (the orchestrator) should make sure the tester runs as a separate subagent. Whether subagents sharing one remote session id count as separate sessions is for a human to settle.
- **Criterion 12 and the `runs/` file.** The diff against `main` also includes `runs/T-046-backend-directory-name.md`, which you committed before I started. Criterion 12 doesn't list it. I noted this in the Handoff; the reviewer should decide whether it counts against the criterion.
- **`---` separator.** The brief asked for a `---` above E-31, but there is none above E-30, so the file is inconsistent. I followed the brief; the reviewer can keep or drop it.

Files:
- /home/user/geo-discovery-zone/engineering-decisions.md
- /home/user/geo-discovery-zone/backend/README.md
- /home/user/geo-discovery-zone/tasks/T-046-backend-directory-name.md

## Round 3 — tester — 2026-11-13
`Next step` on entry: `tester` → on exit: `reviewer`

**T-046: pass.** I checked all 12 criteria by hand, as the brief requires, and all are met. I committed no tests. The verdict is pushed to `claude/relaxed-allen-5ro49x` at `91cba5c`, and the remote branch shows that commit. Status is now `pass` and Next step is `reviewer`.

**Independence:** this is the weaker kind. My session id `cse_011oDiJd2dgRHzBRDwBhvmNz` is the same one the expander and worker recorded, so the id check proves nothing. My independence rests only on being a freshly spawned subagent that never saw the worker's reasoning. The Verdict says this, and my Sessions row is marked "orchestrated subagent".

**Criteria:**
- **1–6 (the E-31 entry):** E-31 is the last and only `## E-31` heading. It contains:
  - a bold `**Decided: 2026-11-13 (T-046).**` line;
  - a sentence saying `api/` is not used as a directory name;
  - the three files a rename would touch: `Dockerfile`, `.github/workflows/ci.yml` and `backend/Makefile`;
  - `CLAUDE.md` lines 4 and 58, quoted exactly as they read at `b10fa64`, with the G1 gate and the need for a P ticket;
  - a concrete `**Revisit when**` line;
  - the rename option, recorded as not taken.
- **7–8 (`backend/README.md`):** the README diff is exactly one deleted line. No `` `api/` `` remains, and the rest of Known gaps is unchanged.
- **9:** both `git grep` commands print nothing (exit 1).
- **10–11:** no file moved or was added or deleted. Dockerfile, CI, Makefile, the package files and the lockfiles are unchanged, and no `api` directory exists. No gated file was touched.
- **12, met with a note:** the diff also adds `runs/T-046-backend-directory-name.md`. That is the orchestrator's run log, which `process.md:75` requires, not a worker change. The reviewer should confirm it accepts this under the criterion.

**Suites:**
- **Backend:** 809 passed, 9 skipped.
- **question-bank:** 229 passed; typecheck, lint and format are clean.
- **Frontend, locally:** install failed with a proxy 403 on npm tarballs, leaving 4 test failures, 4 errors and missing-module typecheck errors. This diff touches no frontend file.
- **Frontend in CI, on HEAD `3affe1b`:** the frontend, backend, backend-postgres, question-bank and integration jobs all passed. e2e (playwright) was still running when I checked.

**Stale tests:** none.

Brief: /home/user/geo-discovery-zone/tasks/T-046-backend-directory-name.md

## Round 4 — reviewer — 2026-11-13
`Next step` on entry: `reviewer` → on exit: `human` (brief swept; last header at `a40a87f`: `Status: approved — escalated`)

**I approved T-046 and escalated it.** PR #141 is now ready for review but must not be merged until Dkaattae confirms "keep `backend/`". The task-expander made that call, and the only approval on the brief is the orchestrator's stamp. The work itself is good and nothing blocks it. The sweep is in the PR, and the branch is pushed and confirmed.

**Next step: human.** Dkaattae either confirms keeping `backend/` and merges, or closes the PR and has T-046 re-expanded as a rename to `api/`. None of the current criteria would survive a rename.

**State**
- **Branch:** `origin/claude/relaxed-allen-5ro49x` is at `0ac41e9`. On top of `ff0b854` are my two commits:
  - `a40a87f` sets the brief to `Status: approved — escalated` and `Next step: human`, adds a reviewer row to Sessions, and adds the `## Review` section.
  - `0ac41e9` is the sweep.
- **PR #141:** `draft: false`, open, not merged. The body starts with the escalation notice, then lists the 12 acceptance criteria word for word, what verified each one, the review, and the sweep.

**Review**
- **Every role's work is in the PR.** The expander, worker and tester rows each have a commit on this branch. Each commit stayed in its role's files: the expander and tester touched only the brief, the orchestrator only `runs/` and the `Approved:` line, and the worker only `engineering-decisions.md`, `backend/README.md` and the brief.
- **The work holds up.** E-31 follows the shape of the other entries, and I checked its facts against the repo: the Dockerfile lines, the 11 mentions in `ci.yml`, and that `/api/v1` is a route rather than a directory. The `backend/README.md` change is exactly the one line the brief asked for.
- **The decision is the only thing outside the merge envelope.** The tester passed and CI was green on `3affe1b`. CI on the new head was still running when I finished. The PR adds no dependency, doesn't touch `openapi.yaml` or migrations, contains no text a child will read, and leaves pre-existing tests alone.

**Findings — none blocking; each became a new entry because nothing already in the queue covered it**
- **P-19 (new, `process-tasks.md`):** `CLAUDE.md` lines 4 and 58 still say `api/` and that the backend is "not built yet". That file is loop-gated, so it needs a hand-written P ticket.
- **T-112 (new, `tasks.md` §E):** the Known gaps section of `backend/README.md` still says CI never runs Postgres. That has been false since the `backend-postgres` job was added. The pin-grading bullet there also needs re-reading against T-045.
- **T-113 (new, `tasks.md` §A):** the §A table and one `PROGRESS.md` bullet name guards that commits `8cf40b6` and `d594b38` deleted or moved out of CI. That includes `conventions-doc.test.ts` and `test_git_revision_guard.py`.

**Flags the worker and tester raised, and what I decided**
- **The `---` separator above E-31:** kept.
- **The `runs/` log showing up under criterion 12:** accepted. It is the orchestrator's required run log.
- **All roles sharing one session id:** deferred to P-14, which already covers it.
- **Frontend tests failing locally because of the proxy 403:** accepted, since CI was green and the diff touches no `frontend/` file.

**Sweep**
- **Brief:** deleted. Its `## Review` survives in commit `a40a87f`.
- **`tasks.md`:** the T-046 entry is removed and a line added to the sweep note.
- **`PROGRESS.md`:** a T-046 completed-task entry is added. The Layout note now records the decision, and the `CLAUDE.md` line number is corrected from 51 to 58 in two places.

**Files**
- /home/user/geo-discovery-zone/tasks.md
- /home/user/geo-discovery-zone/PROGRESS.md
- /home/user/geo-discovery-zone/process-tasks.md
- /home/user/geo-discovery-zone/tasks/T-046-backend-directory-name.md (deleted)

## Ended — 2026-11-13
Task ended: reviewer marked PR #141 ready, escalated. Run limit (1 task) reached; run ends.
What a human has to decide, quoted: "Dkaattae either confirms keeping `backend/` and merges, or closes the PR and has T-046 re-expanded as a rename to `api/`."
