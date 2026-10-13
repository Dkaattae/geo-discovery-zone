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
Pending. A person is in the orchestrator session, so the orchestrator asked them to approve on PR #77 rather than writing its unattended stamp (on T-083 that stamp was refused by the harness as self-approval).
