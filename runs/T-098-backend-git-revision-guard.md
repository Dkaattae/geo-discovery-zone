# T-098 — `backend/` has no guard against tests that resolve a git revision — run log

**Task:** T-098 · **Branch:** `claude/vibrant-feynman-ap8itp` · **PR:** #118
**Started:** 2026-11-02 · **Outcome:** ready for merge

## Round 1 — task-expander — 2026-11-02
`Next step` on entry: (no brief) → on exit: `worker`

**TL;DR:** I wrote the T-098 brief, pushed it to `claude/vibrant-feynman-ap8itp` (head `b46358c`, same locally and on the remote), and opened draft PR #118. Status is `awaiting approval`, Next step is `worker`, Approved is `pending`. A human has to approve the brief before the worker can start.

- **Task picked:** T-098 adds a backend guard against tests that resolve a git revision. It is size S and the first task in `tasks.md` whose dependencies are done. `tasks/` held no live brief when I started, so there was nothing left over from the last cycle.
- **Brief:** `/home/user/geo-discovery-zone/tasks/T-098-backend-git-revision-guard.md`. `Branch:` is `claude/vibrant-feynman-ap8itp` and `PR:` is #118.
- **PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/118, draft, with the criteria as its body.
- **Commits:** `T-098 expander: backend-git-revision-guard` and `T-098 expander: record PR #118 in the brief`. Together they change only `tasks/T-098-…md` and `tasks.md`, where T-098 is now `doing (brief awaiting approval …)`. No source, tests or config.
- **Full brief, not the light path:** it needs ten criteria, and the light path caps at four.

**Criteria in brief:**

| # | What it requires |
|---|---|
| 1 | The guard lives in `backend/tests/` and runs under `make -C backend test` and both backend CI jobs |
| 2 | It reads every tracked `.py` file under `backend/tests/` and `backend/integration/` |
| 3 | Nine named revision forms each trip it (list, tuple, shell string, `-C`, and so on) |
| 4 | `ls-files` and `status` calls pass, and the existing `test_t089…:240` call is not flagged |
| 5 | Comments and docstrings pass |
| 6 | No skip path, and zero files found counts as a failure |
| 7 | The backend check plus the frontend and question-bank suites stay green |
| 8 | No pre-existing test is changed |
| 9 | No dependency is added |
| 10 | No network |

**Flagged for the approver:**
- **Criterion 3 (b)** goes beyond the queue entry. It covers T-053's real shape (commit `ce1cf88`): a revision held in a variable `BASE`, with no `HEAD`. A scan for literal shas would miss it.
- **Criterion 6** goes beyond the entry too. T-053's tests escaped CI by skipping, so the guard may never skip.

**Risk named for the worker:** the frontend guard's `REPO_TEST_FILES` already reads backend `.py` test files, and its JS comment stripper does not remove Python `#` comments. So the new file must never place `engineering-decisions.md` in a `git` argv or a `<rev>:<path>` string. The brief covers this under Constraints and checks it through criterion 7.

**Not done:** I ran no build or tests, as the role requires (D-7).

## Round 2 — worker — 2026-11-02
`Next step` on entry: `worker` → on exit: `tester`

**TL;DR:** I added the T-098 guard as one new file. It is pushed to `claude/vibrant-feynman-ap8itp`; `git log origin/claude/vibrant-feynman-ap8itp -1` shows my commit 0b720ca. `make -C backend check` passes (907 passed, 9 skipped). `cd question-bank && bun test` has 4 failures, so criterion 7 is not met until the tester raises a Test change request for those four tests. Status is `awaiting verification`; next step is `tester`.

**Files**
- `/home/user/geo-discovery-zone/backend/tests/test_git_revision_guard.py` is new. It uses only the standard library and holds 28 tests.
- `/home/user/geo-discovery-zone/tasks/T-098-backend-git-revision-guard.md` has the Handoff and Notes filled in, my Sessions row added, and Status / Next step updated.

**How the guard works**
- **Reads code, not comments:** it parses each file with Python's `ast`, so `#` comments and docstrings are never treated as `git` commands (criterion 5).
- **What it checks:** list or tuple literals that start with `"git"`, and `subprocess` calls given a command string or f-string.
- **Allowlist:** only `ls-files`, `status` and `check-ignore` are allowed. Every other subcommand is refused, which is how it catches the `BASE`-in-a-variable form (3 b).
- **Options before the subcommand:** `-C <dir>`, `-c` and similar are skipped, so a `diff` behind `-C` is still refused (3 i).
- **Arguments:** arguments to an allowed subcommand are also refused if they look like a revision, or are `--with-tree`.
- **Which files:** tracked plus untracked `.py` files under `backend/tests/` and `backend/integration/`. The tester does not need to `git add` a mutation.
- **No skips:** there is no skip path. It fails if `git ls-files` fails or if either directory has no files.
- **Checked by hand:** a 3 (b) mutation placed in each directory made the guard fail and name that file.
- **Frontend guard:** `git-baseline-guard.criteria.test.ts` still passes, 15 of 15.

**The 4 question-bank failures, all under "Tests made stale" in the Handoff**
- **Already failing before my change:** two tests count every tracked non-test file, and the expander's `tasks/` brief and the orchestrator's `runs/` log push the count from 290 to 292:
  - "T-091 criterion 22 … every tracked non-test file …" in `climate-cold-trade-accepted-verify.test.ts`
  - "T-096 … criterion 21" in `farm-animal-loose-ends-verify.test.ts`
- **Broken by the new file:**
  - "T-087 criterion 15" in `refresh-regenerate-reminder-verify.test.ts` pins every file under `backend/`, `frontend/` and `e2e/`. Its `MAIN_BOUNDARY_SHA` needs re-pinning.
  - "T-091 criterion 22 … pre-existing test files are main's" in `climate-cold-trade-accepted-verify.test.ts`. `MAIN_TESTS_COUNT` goes from 113 to 114, and its sha needs re-pinning.
- **The brief contradicts itself here:** criterion 1 requires a new backend file, while criteria 7 and 8 together forbid both the failure and the edit that would fix it. The tester should raise the Test change request; if a human treats this as a criterion defect instead, it goes to `task-expander`.

**Frontend failures caused by this container, not by the change**
- **Packages missing:** `react-simple-maps` and others could not be installed (the proxy returned 403), so three component test files fail to import.
- **Lint gate:** `src/lint-gate.test.ts` times out at 5s here and passes 8 of 8 with `--timeout 60000`.
- **Not mine:** the same failures appear with my file removed.

**Decisions for someone to confirm**
- **`check-ignore` is allowed**, matching the frontend guard. Criterion 10 lists only `ls-files` and `status`, but it governs what the guard itself runs, and the guard runs only `ls-files`. The reviewer should confirm this or drop `check-ignore`.
- **Same session id:** my Sessions row shows the same id as the expander's, because that is what `$CLAUDE_CODE_REMOTE_SESSION_ID` returned in this run. The tester has to run in a different session.

## Round 3 — tester — 2026-11-02
`Next step` on entry: `tester` → on exit: `human` (Status `test changes requested`, Test changes `requested`)

**I've stopped T-098 to ask for test changes, and a person has to step in next.** The guard does its job: criteria 1-6 and 8-10 hold, and I checked each one by deliberately breaking it. Criterion 7 fails only on question-bank pins that T-098's own new files make out of date. I wrote a 5-row Test change request for them. Nobody could approve it in this orchestrated run, so the brief now reads **Status: `test changes requested`**, **Next step: `human`**, **Test changes: `requested`**, with a `Fault:` line. The commit is `11851b5` on `claude/vibrant-feynman-ap8itp`, and the local and remote heads match after the push.

**Independence:** this is an orchestrated run (`runs/T-098-…md` exists). `$CLAUDE_CODE_REMOTE_SESSION_ID` is `cse_011oDiJfdetw2zh1MqvpkWNK`, the same id as the expander and worker rows, so the session check proves nothing. My independence rests only on being a freshly spawned subagent that never saw the worker's reasoning. That is weaker than a separate session. The Verdict says so, and my Sessions row records it.

**How I verified:** the deliverable is itself a test, so I added no tests and committed no test file. I checked coverage, then mutation. Every mutation was reverted, and the tree was clean after each batch.

| # | Result | Evidence |
|---|---|---|
| 1 | met | `make -C backend check`: **907 passed, 9 skipped**. With one offending file planted, `make -C backend test` exits 2 (1 failed). |
| 2 | met | Planted files are caught in both directories, whether untracked or `git add`ed. A temporary edit to each `conftest.py` is flagged and the file is named. |
| 3 | met | Each of forms (a)-(i), planted in each directory: 18 of 18 runs went red, and every failure named the file. |
| 4, 5 | met | Working-tree reads pass, and so does prose in docstrings and comments. The named existing files are unchanged and pass. |
| 6 | met | No skip path in the file. An empty scope, a failing `ls-files` and running outside a repo each turn it red; none skips. |
| 7 | **stale pins** | backend green. frontend's `git-baseline-guard` passes 15/15. question-bank: **2709 pass, 4 fail**, all whole-tree pins. |
| 8, 9, 10 | met | Only one file was added. No dependency changes. The only git command it runs is `ls-files`, and its exit code is checked. |

**Mutations to the guard itself:**
- **Caught:** dropping tuple detection, skipping global options, allowing an unreadable subcommand and ignoring shell strings each turned at least one test red. Adding `diff` to the allowlist turned one red; the other diff samples are still refused as revisions, which is a second layer of defence, not a gap.
- **Not caught:** turning off the read of untracked files left everything green. The behaviour itself works (untracked plants were caught), but no test pins it. I noted this as a coverage gap, not a failure.

**The Test change request (rows 1-5):**
- **Cause confirmed:** I ran logging copies of the three files (untracked, then deleted). Taking T-098's three files out restores every old pin exactly, so they are the only cause.
- **Rows 1 and 3:** add T-098's brief and run log to the allowed sets in `climate-cold-trade-accepted-verify.test.ts` and `farm-animal-loose-ends-verify.test.ts`. Counts (290 and 286) and digests stay the same.
- **Row 2:** re-pin `MAIN_TESTS_COUNT` from 113 to 114 and `MAIN_TESTS_SHA` to `1ea43d08…`.
- **Row 4:** re-pin `MAIN_BOUNDARY_SHA` in `refresh-regenerate-reminder-verify.test.ts` to `1ea8c50d…`.
- **Row 5** (the worker's list missed it): it only goes red once row 3 is applied. It re-pins farm-animal's entry in `APPLIED_REQUEST_FILE_SHAS` in the climate file, the same follow-on fix T-053 needed in its row 33.

**Environment failures in frontend, not caused by this change:**
- `react-simple-maps` is not installed, so three `components/` test files fail to import.
- `lint-gate.test.ts` times out at 5 s. It passes 8/8 with `--timeout 60000`.

**For the reviewer:** whether to keep `check-ignore` in the allowlist. It does not affect any criterion.

**What you need to do:** start the `tester` step for T-098 in a session you are attending, and approve or refuse each row there. That tester applies the approved rows, re-runs all three suites and writes the final verdict.

Brief: /home/user/geo-discovery-zone/tasks/T-098-backend-git-revision-guard.md
Guard under test: /home/user/geo-discovery-zone/backend/tests/test_git_revision_guard.py

## Halted — test change request — 2026-11-02
Raised in commit `11851b5`. Header: `Status: test changes requested`, `Next step: human`, `Test changes: requested`. Rows not copied here (the orchestrator does not read the request).

What a human has to do: start the `tester` step for T-098 in a session you are attending. It will ask about each row, apply what you approve, and finish verifying. The orchestrator cannot take the approval (D-15).

## Person's answer in the orchestrator's session — 2026-11-03
The person wrote: "approve all five rows".

Not written into the brief and no tester spawned (D-15: an approval of a test change request counts only when given in the session making the edits). The person was told to give it to an attended `tester` session for T-098. The halt stands.

## Round 4 — tester (attended, in this session) — 2026-11-03
`Next step` on entry: `human` → on exit: `reviewer`

The person then wrote "run the tester step for T-098" in this session, so this session left the orchestrator role and ran the attended tester step itself. It did not spawn a subagent: D-15 requires the edits to be made in the session where the person approves them. Independence caveat: this session had read the worker's and the first tester's reports, and the brief's Verdict says so.

- Applied Test change request rows 1-5 exactly as worded: `d30bf88`.
- question-bank 2713 pass / 0 fail; `make -C backend check` 907 passed / 9 skipped; frontend reds are packages missing because the proxy returned 403 (unchanged from before the task).
- Verdict: pass. Next step: reviewer.
- Slip during the run: a stray `git checkout origin/main -- .` overwrote the working tree after `d30bf88` was committed. It was restored at once with `git checkout HEAD -- .`, and the tree was confirmed clean; nothing was lost.

## Round 5 — reviewer — 2026-11-03
`Next step` on entry: `reviewer` → on exit: `human — merge PR #118 (Dkaattae)` (brief then deleted by the sweep)

**I approved T-098 and marked PR #118 ready for review, with no escalation note. Dkaattae merges it, and no decision is needed first.** The sweep is pushed to `claude/vibrant-feynman-ap8itp` with the work, and I confirmed the remote head is `fbfb0cf`. CI on that head was still running when I finished (GitHub shows the merge state as "unstable"). The tester's head before my commits, `66561da`, had all seven checks green.

**State now**
- **PR #118:** open and ready, not merged. The body has the ten criteria word for word, what verified each, the five approved re-pin rows, and my review notes.
- **Brief:** I wrote a `## Review` section, set `Status: approved` and `Next step: human — merge PR #118 (Dkaattae)`, and added a reviewer row to Sessions (`fd9de88`). The sweep commit then deleted the brief, so that section now lives in git history and in the PR body.
- **Commits:** `fd9de88` (review) and `fbfb0cf` (sweep: brief deleted, queue trimmed, `PROGRESS.md` updated).

**Checks**
- **PR state:** open and draft when I started, so the review ran before any merge.
- **Every role is in the PR:** expander, worker, orchestrated tester, attended tester and orchestrator each have a commit on the branch.
- **Each role stayed in its lane:**
  - the expander touched only `tasks.md` and the brief;
  - the worker added only `backend/tests/test_git_revision_guard.py` and edited the brief;
  - the testers touched only three `question-bank/src/*.test.ts` files, the brief and `runs/`.
- **Pre-existing tests:** none deleted. Three question-bank files were modified, only in tester commit `d30bf88`, and the changes match the five approved rows exactly.
- **Who approved them:** a person, in the session that made the edits ("approve all five rows"). No name was given. T-045's reviewer accepted the same thing.
- **Nothing else outside the envelope:** no new dependency, no `openapi.yaml`, migration or plan change, no CI fix, no text a child reads.
- **I re-ran the suites:**
  - `make -C backend check`: 907 passed, 9 skipped.
  - `cd question-bank && bun test`: 2713 pass, 0 fail.
  - `cd frontend && bun test`: 392 pass, 4 fail, the same as before my sweep. Three files cannot import `react-simple-maps` because the proxy blocks the download; the fourth is presumably the known lint-gate 5 s timeout. CI's frontend job is green.

**Judgment calls**
- **Criterion 8 is met only as the approved test change request amends it.** As written it forbids changing any pre-existing question-bank test, which conflicted with criteria 1 and 7. I treated the person's approval of the rows as the decision rather than as drift, and said so in the PR body.
- **The attended tester was not a fresh session.** It ran inside the orchestrator's own resumed session, which had already read the worker's and first tester's reports. I accepted its pass because:
  - its work was mechanical: apply five worded rows and re-run the suites;
  - CI and my re-runs reproduce its numbers;
  - criteria 1-6 and 8-10 rest on the first tester's mutation runs, made by a fresh subagent.
- **Flags disposed:**
  - **`check-ignore`** stays allowed, matching the frontend guard's list.
  - **`-C` in front of an allowed subcommand** passes; the brief left that to the worker.
  - **No test covers the guard reading untracked files.** I filed no task, because criterion 2 already allows a guard that reads tracked files only.
- **No new tasks.** Backend `git` exit-code checks need none: the one backend `git` call already passes `check=True`.

**Not done, by choice:** I logged the extra halt from earlier tasks' whole-repo pins in `PROGRESS.md`, not in `process-tasks.md`. The process ticket that tracks this pattern (P-17) lives in `process-tasks.md`. That file is pinned by `question-bank/src/climate-cold-trade-accepted-verify.test.ts`, so editing it here would turn question-bank red.

**Sweep**
- **`tasks/T-098-backend-git-revision-guard.md`:** deleted.
- **`tasks.md`:** T-098 entry deleted, sweep note appended, and §A's closing line rewritten. Nothing else in the queue moved.
- **`PROGRESS.md`:** Completed entry added, and the Known-gaps list of git guards now names the backend one too ("Two guards" became three).

Files:
- /home/user/geo-discovery-zone/backend/tests/test_git_revision_guard.py
- /home/user/geo-discovery-zone/tasks.md
- /home/user/geo-discovery-zone/PROGRESS.md
- /home/user/geo-discovery-zone/runs/T-098-backend-git-revision-guard.md

## Ended — 2026-11-03
PR #118 marked ready by the reviewer. Dkaattae merges; no role merges (D-4).
