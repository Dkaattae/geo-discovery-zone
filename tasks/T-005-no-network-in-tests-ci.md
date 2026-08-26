# T-005 — Prove "no network in tests" in CI

**Status:** `awaiting approval`
**Next step:** `worker`
**Approved:** `Dkaattae, 2026-08-26` — criteria 1–13 as written, unchanged.
**From:** [`tasks.md`](../tasks.md) T-005
**Branch:** `claude/t005-task-expander-eye0qd` — the branch this session was
assigned and the one the PR is built from. Every role after the expander pushes
here, whatever branch its own session starts on (`CLAUDE.md` "Branches",
`process.md` "When the environment names the branch for you").
**PR:** #26 — draft, opened at expand time against the branch above.
**Fault:** —

**Sessions:**

| Role | Date | Session |
|---|---|---|
| task-expander | 2026-08-25 | `cse_01L4kfvBfr1ox5LrcjvqPPiE` |

## Goal

`test-guidelines.md` says "no network in tests, ever" and names the check that
would prove it — point the proxy variables at a dead port and see whether the
suite notices. Nothing runs that check, so the rule is currently an assertion
about 341 tests rather than a fact about them. Make CI run it, on the suites
where it is true by design, and demonstrate that a test which does reach out
turns the run red.

## Survey — what is already true

Read before planning. None of this needs rebuilding.

- **Nothing sets a proxy variable anywhere in the repo.** `grep -rn
  "HTTPS_PROXY\|HTTP_PROXY\|NO_PROXY"` across `*.md *.yml *.yaml *.py *.ts
  *.toml *.json` returns exactly two hits, both prose: `tasks.md:96` and
  `test-guidelines.md:74`. So the whole of this task remains to be done.
- **The suites already look offline**, which is why this is expected to be a
  small change rather than a repair job. `backend/tests/conftest.py:120-125`
  drives the app through `httpx.ASGITransport`, which opens no socket at all;
  `question-bank` and `frontend` tests call pure functions over committed
  fixtures. If a suite turns out *not* to be offline, that is a genuine finding —
  report it, do not exempt it.
- **`backend/pyproject.toml:30` sets `testpaths = ["tests"]`**, so `uv run
  pytest` in `backend/` does not collect `backend/integration/`. The unit suite
  and the stack suite are already separated by configuration, not by luck.
- **CI is six jobs** in `.github/workflows/ci.yml`: `frontend`, `question-bank`,
  `backend`, `backend-postgres`, `integration`, `e2e`. No step anywhere declares
  `timeout-minutes`, so today a hung step runs to the runner's 6-hour default.
- **The four unit test steps** this task guards are: `frontend` → `Test`,
  `question-bank` → `Test`, `backend` → `Test`, `backend-postgres` → `Test
  against Postgres`.

## Acceptance criteria

Numbered, observable, each checkable on its own. **Frozen once approved.**

1. **The guard is on the unit test steps and nowhere else.** In
   `.github/workflows/ci.yml`, each of the four unit test steps named in the
   survey above runs with dead-proxy environment variables in effect. No
   `checkout`, `setup-*`, `Install`, `Lockfile unchanged`, `Typecheck`, `Lint` or
   `Format` step has them in effect, and they are not declared at workflow level
   or at job level for any job. (`bun install` and `uv sync` resolve packages over
   the network; that is why T-005 was split out of T-003 in the first place.)

2. **The dead proxy points at a port nothing listens on, on loopback.** The
   configured target is a loopback address and a port no service in CI binds, so
   a connection attempt is refused immediately rather than routed or left to time
   out.

3. **The block holds however a client spells the variable.** Under the guard, an
   outbound request fails for a client that consults only lowercase
   `http_proxy` / `https_proxy` (Python's `httpx` and `urllib` read the lowercase
   forms), for one that consults only the uppercase forms, and for one that
   consults only `ALL_PROXY` / `all_proxy`. Setting all six spellings to the same
   dead target is the straightforward way to satisfy this; any mechanism that
   produces the same outcome is acceptable.

4. **No exemption reaches past the machine.** If `NO_PROXY` / `no_proxy` is set
   at all, every entry in it is loopback or link-local — some subset of
   `localhost`, `127.0.0.1`, `::1` — and it contains no external hostname, no
   domain suffix, no `*`, and no address outside `127.0.0.0/8` and `::1`.

5. **The four suites pass under the guard.** With exactly the variables ci.yml
   sets, and at the same commit: `bun test` in `frontend/` exits 0, `bun test` in
   `question-bank/` exits 0, `uv run pytest` in `backend/` exits 0, and `uv run
   pytest` in `backend/` with `GEO_TEST_DATABASE_URL` pointing at a reachable
   Postgres exits 0. (Guard the *test* invocation, not `uv sync` — `make -C
   backend test` runs `uv sync` first and will fail under the guard, which is
   correct behaviour, not a bug to work around.)

6. **Nothing was skipped, deselected or deleted to get there.** At one commit,
   each of the four suites reports the same number of passed tests and the same
   number of skipped tests with the guard set as without it. No test is removed,
   renamed out of collection, marked `skip`/`xfail`/`.skip`/`.todo`, deselected
   by marker, path or `-k`, or moved into `integration/` or `e2e/` as part of
   this task. (For orientation only, today's figures: frontend 80,
   question-bank 19, backend 242 collected with the 9 Postgres-only tests
   skipping in the SQLite job. The invariant is with-versus-without at one
   commit, not these numbers.)

7. **A test that reaches the network turns the run red.** On a GitHub Actions
   runner, a temporary test added to a guarded suite that makes an outbound
   HTTPS request to a public host using the runtime's ordinary client — bun's
   global `fetch`; `httpx` or `urllib.request` in Python — makes that suite's
   test step exit non-zero. Demonstrated for at least one bun suite **and** for
   the backend suite, with the workflow run URL for each recorded in the PR body
   and the brief's Notes. The canary must typecheck, lint and format clean, so
   that the run actually reaches the step under test — T-003 lost a cycle to a
   mutation that died at `Typecheck` before it got there (`PROGRESS.md`, T-003).

8. **The same canary is green without the guard.** On a runner, in a step with
   the proxy variables absent, that canary passes. Both halves are observed and
   both run URLs recorded. Without this, criterion 7 shows only that the canary
   is broken.

9. **The demonstration leaves nothing behind.** The branch's final tree contains
   no canary test, no scratch workflow and no test that reaches the network. The
   evidence is the recorded run URLs, not a committed artefact.

10. **The check is reproducible from the docs alone.** The "No network in tests,
    ever" paragraph in `test-guidelines.md` (line 72–75 today) states that CI
    enforces this on the four unit test steps and gives the exact command to
    reproduce it locally for one suite. Someone following that text verbatim,
    without opening `ci.yml`, can run a guarded suite.

11. **A stall fails instead of hanging.** Each of the four guarded test steps
    declares a `timeout-minutes` of 15 or less, so a proxy-induced hang fails the
    run rather than consuming the runner's 6-hour default.

12. **No new dependency.** No package is added to `frontend/`, `question-bank/`,
    `e2e/` or `backend/`, and `frontend/bun.lock`, `question-bank/bun.lock`,
    `e2e/bun.lock` and `backend/uv.lock` are byte-identical to their state on
    `main`.

13. **The stack suites are untouched and still green.** The `integration` and
    `e2e` jobs' steps are unchanged apart from any `timeout-minutes` the worker
    chooses to add, no proxy variable is in effect for either, and both jobs pass
    on this PR. They talk HTTP to a real stack on purpose; blocking them would be
    blocking the thing they exist to test.

## Out of scope

- **`backend/integration/` and `e2e/`.** They drive a real server over HTTP and
  pull images from a registry. "No network in tests" was never a claim about
  them, and making it one would delete the only coverage of the container path.
- **A permanent self-check** that asserts a network-reaching test still fails —
  a canary job, an inverted-exit-code step. It would resist rot, and it is a
  design with more than one defensible answer. If the worker thinks it is worth
  having, it becomes a new entry in `tasks.md`, not an extra commit here.
- **Blocking the network by any means stronger than the proxy variables** —
  network namespaces, `iptables`, a sandboxed runner user. Out of scope for an S
  task; note it as a follow-up if the demonstration shows the proxy guard has a
  hole a raw socket walks through.
- **Anything else in `ci.yml`** — action pinning is T-008, the lint gate is
  T-006.
- **The rest of `test-guidelines.md`.** Its `api/` section is still marked
  "does not exist yet" and its test counts are stale; both belong to T-047. Edit
  only the "No network in tests, ever" paragraph.
- **Making a suite offline that turns out not to be.** If a test genuinely
  reaches out today, say which one and stop — that is a bug with its own fix, not
  something to paper over inside this task.

## Constraints

- **Files expected to change:** `.github/workflows/ci.yml`, `test-guidelines.md`.
  Nothing else should need to change. A diff that touches `frontend/src/`,
  `question-bank/src/` or `backend/app/` means the task found something else and
  should say so rather than fixing it here.
- **Dependencies:** none, without asking (`CLAUDE.md`). See criterion 12.
- **Invariant:** the install steps keep resolving packages from the network, and
  `Lockfile unchanged` keeps passing. A guard that breaks `bun install` is the
  failure mode this task exists downstream of.
- **Invariant:** `backend-postgres` reaches its database. Postgres traffic is not
  HTTP and psycopg does not read proxy variables, so this should hold for free —
  but it is the one guarded step with a live socket in it, so check rather than
  assume.
- The worker writes `## Handoff` before stopping, even if the change is four
  lines. The tester starts cold.

## Context

**Required reading.**

- `test-guidelines.md` lines 72–75 — "No network in tests, ever", and the dead-port
  check this task is implementing. This is the sentence being made true.
- `.github/workflows/ci.yml` — all six jobs; the four unit test steps are the
  subject, `integration` and `e2e` are the ones to leave alone.
- `backend/tests/conftest.py:118-127` — `httpx.ASGITransport`, why the backend
  suite opens no socket.
- `backend/pyproject.toml:29-33` — `testpaths = ["tests"]`, why `uv run pytest`
  in `backend/` does not pull in the integration suite.
- `backend/Makefile:46` — `test: install`, i.e. `make -C backend test` runs
  `uv sync` first. Relevant to criterion 5 and to whatever command criterion 10
  documents.
- `PROGRESS.md` T-003 entry — the criterion that named a file path where it meant
  a behaviour, and died at `Typecheck` before reaching the step under test.
  Criterion 7 is written to avoid repeating it.
- `tasks.md` §A T-005 — the queue entry, including why this was split out of
  T-003.
- `decisions.md` D-10 — why the `bun test` steps are bare, with no
  `--pass-with-no-tests`.

**A verification hazard, for the tester.** Some agent sandboxes have no direct
egress and route everything through a proxy of their own. In such a sandbox a
canary fails whether or not the guard is present, so a local run cannot tell
criterion 7 from a broken canary — which is exactly why criteria 7 and 8 ask for
observations on a GitHub Actions runner, where egress is real. If neither half
can be observed on a runner, that is `blocked`, not `pass`.

## Handoff

Written by `worker` before the tester runs. Always written, even when nothing
was built.

## Verdict

Written by `tester`.

## Review

Written by `reviewer`, and only when it sends the PR back.

## Notes

Record the run URLs from criteria 7 and 8 here.
