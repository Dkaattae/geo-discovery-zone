# Engineering decisions

Choices about how the **code** is built — the schema, the test setup, the lint
gate, the CI shape — why they went the way they did, and what would make them
worth revisiting. Numbered `E-n`.

**This file is not gated.** A task in the loop may add an entry here when its
acceptance criteria call for one, and the reviewer checks it like any other
change. Decisions about the *loop itself* — the roles, the gates, the brief, who
merges — live in [`process-decisions.md`](process-decisions.md) instead, which
the loop is forbidden to touch (`run-loop.sh` G1). Product decisions live in
[`geoquizdataplan.md`](geoquizdataplan.md).

Add an entry when a decision could reasonably have gone the other way. A
decision with no trigger for revisiting is a habit, not a decision.

Split out of `decisions.md` on 2026-08-29 — see `process-decisions.md` D-12 for
why. Entries keep their original text; only the number and the file changed.

---

## E-1 — Alembic owns the database schema

**Decided:** the pipeline emits JSON; a Python loader writes Postgres. `DbSink`
in `question-bank/` stays a seam for standalone use, not the path that defines
tables.

With a TypeScript pipeline and a Python backend, something has to own the
schema, and two authors will disagree. Recorded in full in plan §5.3.

*Formerly `decisions.md` D-5.*

---

## E-2 — Frontend test files are typechecked, and `@types/bun` pays for it

**Decided:** `frontend/tsconfig.json` no longer excludes `src/**/*.test.ts(x)`.
`@types/bun` is a devDependency of `frontend/` (`^1.3.14`, the version
`question-bank/` already uses) and `"types"` carries `"bun"`, so `bun run
typecheck` covers test files exactly as it covers everything else.

The exclusion was never a decision. It was written during PR #17 to get past a
`tsc` that could not resolve `bun:test`, with a comment saying as much, and it
meant **the only frontend test file was not typechecked at all** — in a
`"strict": true` package with `exactOptionalPropertyTypes` and
`noUncheckedIndexedAccess` on. Tests are the code most likely to be written
against a stale idea of a signature, and they were the one part of `frontend/`
the compiler never read.

**The two alternatives, and why they lost:**

- **Keep the exclusion and write down why.** Free, and honest, but it leaves the
  hole open: a test can call `createApiClient({ baseUrl: 42 })` and nothing says
  so until someone runs it. The cost of closing it turned out to be one
  devDependency.
- **A separate `tsconfig.test.json` and a second `tsc` invocation.** No new
  dependency in the main config, but it needs `@types/bun` anyway to resolve
  `bun:test`, so it buys nothing and costs a second config to keep in step.
  `question-bank/tsconfig.json` already does the simple thing and has since its
  first test.

Dkaattae approved the dependency on 2026-08-24 with those alternatives stated,
per `CLAUDE.md` "Packages". It is types only: nothing it contains reaches a
build, a bundle or a browser.

**Revisit when** `@types/bun` starts costing something real — it conflicts with
`@types/node` or `vite/client` in a way `skipLibCheck` cannot absorb, or it
drags the frontend's TypeScript version forward before the app is ready. The
answer then is `tsconfig.test.json`, not the exclusion: what must not come back
is untypechecked test files.

*Formerly `decisions.md` D-9.*

---

## E-3 — CI requires frontend tests to exist

**Decided:** `--pass-with-no-tests` is gone from the frontend `Test` step in
`.github/workflows/ci.yml`. `bun test` runs bare, in both TypeScript jobs, and
bun's exit code is the step's.

The flag was added by T-003 for a true reason that has expired: `frontend/` had
no test files, `bun test` exits 1 on a package with none, and the job would
otherwise have been red for a reason nobody was going to fix that week. It is
now 65 tests across two files, and the flag's only remaining effect is that
**deleting every one of them leaves CI green** — a check that certifies nothing
in exactly the state where you would most want it to shout. That is the same
shape of failure T-003 spent three verify rounds on: run 31270170161 was green
with a failing test in the tree.

Removing it makes "the frontend has tests" a thing CI asserts rather than a
thing that happens to be true.

**What this does not do:** it is not a coverage threshold and it is not a
guarantee the tests are any good. One trivial test file satisfies it. It closes
the one failure mode that is silent — a package quietly losing its whole suite —
and nothing more.

**Revisit when** a legitimate package in this repo has no tests and should not
be forced to grow one. The fix then is to drop the `Test` step for that package
with a comment, not to bring the flag back: a step that cannot fail is worse
than a step that is absent, because it reads as coverage.

*Formerly `decisions.md` D-10.*

---

## E-4 — The lint gate fails on warnings; `components/ui/` is exempted by path

**2026-08-29.** `frontend`'s lint script was `eslint .`, which exits 0 on
warnings. Every green CI run had been printing `✖ 7 problems (0 errors, 7
warnings)` and passing, so the gate reported a number nobody was obliged to act
on. The script is now `eslint . --max-warnings 0`.

**The strictness lives in `package.json`, not in `ci.yml`.** A `--max-warnings`
flag added only to the workflow would mean `bun run lint` locally and `bun run
lint` in CI returning different verdicts on the same tree, and the local one
being the lenient one. CI's `Lint` step stays a bare `bun run lint`.

**The seven split 1 / 6, and the split is not where `tasks.md` said it was.**
The queue entry recorded, re-checked 2026-08-24, that all seven were in
`frontend/src/components/ui/`. By the time the work ran that was false:

- **Fixed — one, ours.** `frontend/src/components/screens.tsx` exported `AVATARS`
  alongside eight components. Nothing outside that file imported it, so it stopped
  being exported. No call site changed, because there were none.
- **Exempted — six, vendored.** `badge.tsx`, `button.tsx`, `form.tsx`,
  `navigation-menu.tsx`, `sidebar.tsx` and `toggle.tsx`, all in
  `frontend/src/components/ui/`. These are shadcn-generated primitives, copied in
  rather than written here, and each pairs a component with its `cva` variants
  (`buttonVariants`, `badgeVariants`, `toggleVariants`,
  `navigationMenuTriggerStyle`) or a context hook (`useFormField`, `useSidebar`)
  in one file — which is how shadcn ships them.

**Why exempt rather than fix those six.** Splitting each file in two would fork
them from upstream and turn every future `shadcn add` into a manual merge, in
exchange for a fast-refresh improvement in files nobody hand-edits during
development. That is a bad trade. **Not** "to make CI green": the seventh warning,
in code we do write, was fixed rather than exempted, which is the whole point of
the split.

**The exemption is a path glob, not a comment.** `eslint.config.js` turns
`react-refresh/only-export-components` off for `src/components/ui/**` and nothing
else. The rule stays at `warn` severity everywhere else, and `--max-warnings 0`
is what makes it bite — so any rule configured at `warn`, not just this one,
fails the build. Scoping it in one config block means the exemption is greppable
in a single place instead of scattered through six files as `eslint-disable`
comments.

**What would make this worth revisiting.** If we ever start hand-editing
`components/ui/` — treating those files as ours rather than as a vendored copy —
the justification disappears and they should be split properly. Equally, if
`eslint-plugin-react-refresh` grows a way to mark variant/style exports as
refresh-safe, the exemption becomes unnecessary rather than merely cheap. Until
one of those, the directory is a boundary: generated code inside, our code
outside, and the rule applies to our code.

---

## E-5 — Third-party CI actions are pinned by commit SHA; `actions/*` stays on major tags

**2026-09-04.** `.github/workflows/ci.yml` had 13 `uses:` references across four
actions, all on mutable major tags (`actions/checkout@v5`,
`oven-sh/setup-bun@v2`, `astral-sh/setup-uv@v6`, `actions/upload-artifact@v4`) —
whoever holds push access to the repo behind that tag can change what runs on
this repo's runners without a diff here. That is the same exposure
`frontend/bunfig.toml`'s 24h `minimumReleaseAge` guard exists to close on the
npm side (T-003's tester flagged CI's own supply chain as the unguarded half of
that asymmetry).

**Decided: the rule is publisher, not action.** `oven-sh/setup-bun` and
`astral-sh/setup-uv` — actions published outside the `actions/` org, by the
smallest and least-scrutinized maintainers of the four — are pinned to the full
40-character commit SHA their major tag currently resolves to, with a trailing
comment naming the release it corresponds to (`# v2.2.0`, `# v6.8.0`).
`actions/checkout` and `actions/upload-artifact` — published and operated by
GitHub itself, under the `actions/` org's own release process — stay on the
major tag (`@v5`, `@v4`). The rule that places every `uses:` reference in one
category or the other: **an action's owner is `actions`, or it is not.** All
four actions in `ci.yml` fall under exactly one branch of that.

**Both options, and what the rejected one costs.**

- **Stay on tags everywhere (reject: pin nothing).** Free, and was the status
  quo before this entry. The cost is the exposure above, paid on all four
  actions instead of two: a tag is a pointer, not a version, and nothing in this
  repo would notice or block it moving.
- **Pin everything, including `actions/*` (reject: pin all).** Closes the same
  hole for `actions/checkout` and `actions/upload-artifact` too, at the cost of
  doubling the manual update surface — 13 references instead of 6 — for two
  actions GitHub operates directly, under org-level release controls, where a
  tag-hijack would be a materially bigger incident for GitHub to have happen and
  explain than for a two-person third-party project. The chosen rule accepts
  that residual risk rather than pay to close it too.
- **The chosen split** pays the update chore on 6 of the 13 references
  (`oven-sh/setup-bun` ×3, `astral-sh/setup-uv` ×3) and accepts mutable-tag
  exposure on the other 7 (`actions/checkout` ×6, `actions/upload-artifact` ×1).

**How a version change reaches this repo — and on neither side of the rule does
it happen automatically.** For the two pinned actions, nothing in this repo
notices a new upstream release: a human has to know the tag moved, resolve it to
a commit SHA by hand, and edit `ci.yml`. For the two tagged actions, the
opposite is true and is exactly the risk this rule accepts rather than solves:
the next CI run after the maintainer (GitHub) moves the major tag runs whatever
it now points to, with no diff and no review in this repo, whether that commit
is a bug fix or something worse. **No Dependabot or Renovate config exists in
this repo today** — `.github/` holds only `workflows/` — so neither the pinned
references nor the tagged ones are watched by anything automated. Enabling
Dependabot would close the update-chore side of this but is Dkaattae's call
(`CLAUDE.md` "Packages"), not this task's to make; see the `tasks.md` entry this
task adds proposing it.

**Revisit when** either: (a) a pinned SHA here goes roughly six months without
being refreshed to the action's then-current release — stale enough that the
pinned code is plausibly missing a real upstream fix, which means the manual
chore has already lapsed and needs an owner or a bot; or (b) `actions/checkout`
or `actions/upload-artifact` is the subject of a disclosed tag-integrity
incident, at which point they move to the pinned side of the rule too.

**`blocked-run-notice.yml`'s own `actions/checkout@v5`** (line 36, loop
machinery, not CI) falls under the same rule and already satisfies it — its
owner is `actions`, so it stays on the tag as it already is, and this task made
no edit there. If that file ever adds a third-party action, pinning it is a
hand-written `P` ticket (`process.md`, "Work on the loop itself never enters the
loop"), not part of this task.
