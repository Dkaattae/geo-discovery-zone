# T-077 — A label that comes back as a bare QID must warn, not ship — run log

**Task:** T-077 · **Branch:** `claude/inspiring-faraday-a9hh8r` · **PR:** #77
**Started:** 2026-10-13 · **Outcome:** in progress

## Round 1 — task-expander — 2026-10-13
`Next step` on entry: no brief (`tasks/` empty) → on exit: `worker` (`Status: awaiting approval`, `Approved: pending`)

**TL;DR:** I wrote the T-077 brief, pushed it to `claude/inspiring-faraday-a9hh8r` and opened draft PR #77. `Status: awaiting approval`, `Next step: worker`. **A human has to approve it next**, by replacing `Approved: pending` in the brief; the worker won't start until then.

**Why T-077:** it is the first entry in the queue whose dependencies are done. I skipped two ahead of it:
- **T-064** depends on T-040, which isn't built.
- **T-070** is waiting on a human answer to Q1.

**What my survey found:**
- **`capital` is the only real exposure.** It is the only field that ships and is read through the WDQS label service (`capitalLabel`). Nothing checks it today: `parseUsStates` and `normalizeUsStates` pass it straight through.
- **`highest_point` can't currently come back as a QID.** It is read with an explicit English `rdfs:label`. The criteria still ask for a guard there, since it is cheap.
- **`stateLabel` is already safe.** A bare QID fails the curated-name lookup and lands in `unmatched`. Criterion 6 only pins that.
- **The committed fixture has no bare-QID labels.** So the bank and the offline build's three `highest_point_m` warnings should not move, and I expect no existing test to go stale.

**Criteria (11; too many for the light path, so it is a full brief):**
- **1–3, capital:** a bare QID does not ship. It gets one warning that names the QID. The existing `capital: missing` text stays byte for byte.
- **4–5, highest point:** a bare QID does not ship. Alaska falls back to its curated `Mount McKinley`; Colorado, with no curated value, has no key. Either way there is one warning naming the QID.
- **6, state name:** a bare-QID state name builds no entity and appears in `unmatched`.
- **7, boundary:** `Juneau`, `Q`, `q29445`, `Q29445a` and `Quebec City` all ship unchanged with no warning.
- **8, refresh end to end:** through the `SparqlTransport` seam, with Alaska's capital set to `Q29445`.
- **9–11, what must not change:** the bank does not move, no network or new dependency, and every gate passes with no pre-existing test edited.

**Review checklist (needs a human):** the entry asks whether Juneau's English label is really gone on Wikidata, or whether the query reads the wrong item. Only the live service can answer that, so the worker reports what it found in the Handoff, or says it could not check. Fixing the query is out of scope and would become a new `tasks.md` entry.

**Commits** (only `tasks/` and `tasks.md` touched):
- `T-077 expander: bare-qid-label` — the brief, and T-077 marked `doing` in `tasks.md`.
- `ae82868` — records PR #77 in the brief header.

**Push confirmed:** `origin/claude/inspiring-faraday-a9hh8r` is at `ae82868`.

**Files:**
- /home/user/geo-discovery-zone/tasks/T-077-bare-qid-label.md
- /home/user/geo-discovery-zone/tasks.md
- PR: https://github.com/Dkaattae/geo-discovery-zone/pull/77

## Approval — 2026-10-13
A person was in the orchestrator session, so the orchestrator asked them to approve rather than writing its unattended stamp (on T-083 that stamp was refused by the harness as self-approval). Dkaattae then approved in the orchestrator session: "I approve T-077 criteria". `Approved:` records that.

## Round 2 — worker — 2026-10-13
`Next step` on entry: `worker` (`Status: awaiting approval`) → on exit: `tester` (`Status: awaiting verification`)

**TL;DR.** T-077 is built and pushed. A `capital` or `highest_point` label that is just a QID (matches `^Q\d+$`) no longer ships, and it produces one warning that names the QID. The whole `question-bank` suite passes (1783 pass, 0 fail), as do lint, typecheck and format:check. No existing test went stale. Brief is at Status `awaiting verification`, Next step `tester`.

- **Branch:** commit `760f6ec` ("T-077 worker: treat a bare-QID label as missing and warn") is on `origin/claude/inspiring-faraday-a9hh8r`. I confirmed it with `git log origin/claude/inspiring-faraday-a9hh8r -1`.
- **Juneau:** I checked this live through `query.wikidata.org`; `www.wikidata.org/w/api.php` was refused by the proxy with a 403. The query reads the right item: Alaska's capital statement points at `Q29445`, which is Juneau. That item has no English (`en`) label, only a `mul` label "Juneau". Asking the label service for `"en"` returns `Q29445`; asking for `"en,mul"` returns `Juneau`. The fix is a query change, which the brief puts out of scope, so I filed it as T-084 in `tasks.md`.

**Files changed**
- **`/home/user/geo-discovery-zone/question-bank/src/normalize.ts`**:
  - New exported `isBareQid`.
  - **Capital:** a bare-QID capital is dropped, with one warning that names it. The existing `missing` warning text is unchanged.
  - **Highest point:** a bare-QID highest point counts as absent, so the curated value fills it where one exists (Alaska: Mount McKinley). Either way it gets exactly one warning naming the QID.
- **`/home/user/geo-discovery-zone/question-bank/src/bare-qid-label.test.ts`** (new): 20 tests covering criteria 1–8, all offline. They call `parseUsStates`/`normalizeUsStates` directly, plus one `refreshBank` test through a `SparqlTransport` fake. Without the fix, 4 of them fail.
- **`/home/user/geo-discovery-zone/tasks.md`**: new entry T-084, "Read Wikidata's `mul` labels".
- **`/home/user/geo-discovery-zone/tasks/T-077-bare-qid-label.md`**: Sessions row, Handoff (a table mapping each criterion to its test, plus the evidence), Notes, Status and Next step.

**Criterion 9 (committed bank and offline build).**
- **Output:** I ran the offline build with and without the change. Its output differs only in the `--out` path, and the written files are identical to each other and to `data/us-states/`.
- **Warnings:** still the same three `highest_point_m` warnings (CT, OK, VA).
- **Dependencies:** `package.json` and `bun.lock` are untouched. I ran `bun install --frozen-lockfile` once because `node_modules` was missing.

**Calls for others to confirm**
- **No double warning — reviewer.** When a highest point is a bare QID and there is no curated value, only the bare-QID warning is emitted, not a second `missing`. Criterion 5 asks for exactly one.
- **Warning wording — reviewer.** The text is `label is a bare QID (<qid>), not a name; left blank` or `…; used curated <v>`.
- **Session id — tester.** My session id is the same as the expander's. That is expected when roles are spawned by the orchestrator (`process.md` "Spawning"), so the tester should apply that rule rather than refuse on it.
- **Juneau finding — human.** Please read the Juneau evidence in the Handoff and confirm T-084.
