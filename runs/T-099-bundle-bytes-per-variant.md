# T-099 — A bundle's `bytes` overstates the unkeyed body — run log

**Task:** T-099 · **Branch:** `claude/quirky-heisenberg-d6n4kg` · **PR:** #122
**Started:** 2026-11-04 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-04
`Next step` on entry: (no brief) → on exit: `worker` — once a person replaces `pending` below

**TL;DR:** I wrote the T-099 brief ("A bundle's `bytes` overstates the unkeyed body"), pushed it to `claude/quirky-heisenberg-d6n4kg`, and opened draft PR #122. It is waiting for a person to approve it. Status: `awaiting approval`, Next step: `worker`, Approved: `pending`. Nothing is built yet.

**Why T-099 was picked:** sections A and B have no open tasks. The three tasks ahead of T-099 are each waiting on a person:
- **T-085b** needs a reachable Census release.
- **T-056** needs a design decision.
- **T-095** needs an answer to its question Q.

T-099 is the first task in queue order with nothing blocking it.

**What I found in the code:**
- **Root cause:** `store.bundle` (`backend/app/store.py`) works `bytes` out with `json.dumps` over the keyed payload. It uses the default `", "` and `": "` separators, runs before `bytes` and `etag` are added, and runs before the response model re-serialises the body. So `bytes` is not exact for either variant, not just too big for the unkeyed one.
- **No test reads `bytes` today**, so no existing test should go stale.

**Two choices the brief makes for the approver** (both are listed at the top of the brief and the PR, so they can be struck):
- **Exact size:** `bytes` must equal `len(response.content)` for each `includeAnswerKey` variant. The other answer the queue allowed was to keep it approximate and say so in `openapi.yaml`.
- **List shows the unkeyed size:** `GET /bundles` gives the default (unkeyed) variant's size, the same way T-097 handled `etag`.

**Criteria:** there are 13. They cover:
- each variant's `bytes` equalling its own body length;
- the list giving the unkeyed size, and `false` behaving as the default;
- the keyed body being strictly larger;
- `bytes` still being exact after `content_version` changes length;
- a contract description in `openapi.yaml` saying what `bytes` measures;
- nothing else in the bodies changing, and the 304 path untouched;
- both bodies still matching the contract schemas;
- the existing suite passing unchanged, with no new dependency and no network in tests.

It is a full brief, not the light one, because it touches `openapi.yaml` and has more than four criteria. The reviewer will flag it for the contract change. T-100 is explicitly out of scope.

**Commits** (both confirmed on `origin/claude/quirky-heisenberg-d6n4kg`). They touch only `tasks/` and `tasks.md`, where T-099 is now marked `doing`:
- `c5f01e1` T-099 expander: bundle-bytes-per-variant
- `88590a3` T-099 expander: record PR #122 in the brief

**Files:**
- /home/user/geo-discovery-zone/tasks/T-099-bundle-bytes-per-variant.md
- /home/user/geo-discovery-zone/tasks.md

**PR:** https://github.com/Dkaattae/geo-discovery-zone/pull/122 (draft, base `main`)

**Next:** a person replaces `Approved: pending` with their name and the date, then the `worker` runs on this branch.

## Halted — G2, Approved stamp refused — 2026-11-04

The orchestrator tried to write the unattended `Approved:` stamp into the brief
header. The harness refused it as self-approval (as on T-078). Not retried by
another route. Branch head at halt: `88590a3`.

`Approved:` still reads `pending`, so G2 holds: no worker is spawned.

**What a human has to decide:** approve the T-099 brief (or not). Either reply
in the orchestrator's session — the orchestrator then records your words here,
writes the `Approved:` line and spawns the worker — or replace `pending` in the
brief header yourself and start a new run.

## Resumed — brief approved in the orchestrator's session — 2026-11-04

The person replied in the orchestrator's session, verbatim: "approved".
The orchestrator wrote the `Approved:` line from that reply.
