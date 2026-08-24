# `integration/` — the tests that need a real stack

28 tests that talk to a running server over HTTP and never import `app`.

```bash
make -C backend test-integration                          # builds and runs docker compose
make -C backend test-integration-against URL=http://localhost:8000   # a stack you already have
```

They are **not** part of `make check`. They need a Docker daemon, and a machine
without one should still be able to run everything else. Without a daemon and
without a URL they skip with a reason rather than failing — a missing daemon is
not a broken build.

## Why they exist

`backend/tests/` runs the app in-process, against a database it builds itself.
That is the right shape for 221 tests and it is structurally unable to tell you
whether the `Dockerfile` builds, whether the compose healthcheck orders startup
correctly, whether the frontend bundle made it into the image, or whether a
child's progress is still there tomorrow. Those claims live here.

| File | What it holds down |
|---|---|
| `test_stack.py` | It came up and migrated. One origin: the shell at `/`, hashed assets cached forever, a client route falling back to the shell, and `/api/v1/*` returning a problem document rather than HTML. Content public without a token. The demo login the README promises |
| `test_child_loop.py` | One sitting end to end — start, right answer, wrong answer, undo, summary — plus the walls: no token is a 401, another account is a **404 not a 403**, a PIN hash is never returned, logout actually revokes |
| `test_persistence.py` | A restart is not a reset: profile, session, answer and bearer token all survive; seeding does not duplicate; a deleted profile stays deleted; the app recovers when Postgres restarts underneath it |

## How they are written

**Black box, over the wire.** No imports from `app`, no database handle, no
fixtures reaching behind the API. If a test can only be written by reaching
inside the process, it belongs in `backend/tests/` instead.

**Every test makes its own account.** The stack outlives the test, and when
pointed at a long-running one it outlives the suite, so rows written by one test
are still there for the next. `unique_username()` exists because a hardcoded
username passes on a fresh stack and 409s the second time — green in CI, red on
a developer's machine. That bug was written and caught here on the first run.

**Invariants, not fixtures' worth of constants.** `entities > 0`, not
`entities == 15`. The bank is going to grow to 50 states (`tasks.md` T-050) and
these tests should not be the reason that is annoying.

**The stack is torn down with its volume** however the run ends, and it uses its
own compose project name and port (`ATLAS_PORT`, default 8099 here), so a stack
a developer is already running is neither reused nor destroyed.

## Known limits

- **The compose path has never executed.** These were written and verified
  against a server running the same shape by hand — Postgres, the built frontend
  bundle, the same code — because the environment they were written in has no
  Docker daemon. 23 tests pass that way; the 5 restart tests skip, and their
  assertions were reproduced manually against a real process restart and a real
  Postgres bounce. The first CI run on a machine with a daemon is the real
  verification (`tasks.md` T-049).
- **No frontend behaviour is tested here.** These assert the shell is *served*,
  not that it renders. Driving a browser is a different tool and a different task.
