# T-117 — `e2e/README.md`'s spec table lists two of five specs — run log

**Task:** T-117 · **Branch:** `claude/keen-goodall-29lj4e` · **PR:** #150
**Started:** 2026-11-18 · **Outcome:** in progress

## Round 1 — task-expander — 2026-11-18
`Next step` on entry: `none (no brief)` → on exit: `worker`

I wrote the brief for T-117 and opened draft PR #150. It is waiting for a person to approve it. Status: `awaiting approval`, Next step: `worker`, Approved: `pending`.

- **Brief:** /home/user/geo-discovery-zone/tasks/T-117-e2e-readme-spec-table.md. It is a light brief (size S, documentation only, one file).
- **Branch:** `claude/keen-goodall-29lj4e`. It is written into the brief's `Branch:` header. Both commits are pushed (`4b16b9a`, `feef08b`), and the local branch matches the remote.
- **PR:** #150, draft, against `main`: https://github.com/Dkaattae/geo-discovery-zone/pull/150. Its number is in the brief's `PR:` header.
- **Diff scope:** the branch adds only the brief. Nothing outside `tasks/` changed, and neither `tasks.md` nor `PROGRESS.md` was edited.
- **Sessions row:** task-expander, 2026-11-18, cse_011oDiJfZc4iaqo64UcGBTnV.

**Why T-117.** It is the first task in the queue that nothing is waiting on. In flight was none, and the only open PR (#38) is a P-4 process ticket.

| Skipped | Why |
|---|---|
| T-085b | Waits on a reachable Census release, which a person has to pick |
| T-056 | Waits on a design decision |
| T-095 | Waits on a person's answer to its Q |
| T-110 | Waits on a wording call from Dkaattae |

**Acceptance criteria:**
1. Every file in `e2e/tests/` has exactly one row in the "What it holds down" table, and the table names no other file. There are six files today.
2. Each of the three new rows says what its spec actually checks:
   - `first-load.spec.ts`: no hydration error, signed out and signed in.
   - `first-load-head.spec.ts`: the page title and description.
   - `map-click.spec.ts`: the row contains the literal `map_click`.
3. "How they are written" has a paragraph saying React 19 reports a recovered hydration mismatch as a `pageerror`, not a `console.error`, so a guard must listen on both. It names E-33.
4. The diff touches only `e2e/README.md`, and the rows and sections it does not need to change stay byte-for-byte the same.

**Already true:** `collectHydrationErrors` in `e2e/tests/app.ts` already listens on both `console` and `pageerror`, so this task only documents it.

**Two stale passages left out of scope.** The brief's Notes list them for the reviewer to queue if worth it:
- **The `app.ts` row** says "Every selector in the suite", but `map-click.spec.ts` defines its own selector.
- **"The map cannot fill in on a child's first day"** has been out of date since T-026. Its single-topic half is T-056.

> Orchestrator note: the expander's returned result included the acceptance criteria. They are logged here verbatim as required; nothing from them enters any spawn prompt.

## Approval — orchestrator — 2026-11-18
Unattended-run stamp written into the brief's `Approved:` line.
