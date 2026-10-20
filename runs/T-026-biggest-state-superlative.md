# T-026 — A third topic: "Which of these states is the biggest?" — run log

**Task:** T-026 · **Branch:** `claude/serene-ramanujan-msepc5` · **PR:** #91
**Started:** 2026-10-20 · **Outcome:** halted — needs human

## Round 1 — task-expander — 2026-10-20
`Next step` on entry: none (no brief) → on exit: `human`
`Status` on exit: `blocked` · branch head: `f47c18e`

**T-026 expanded and halted.** Its acceptance criteria are a draft, the brief's Status is `blocked` and Next step is `human`. Before the criteria can be finished, a person has to choose which rule wins for "biggest state" questions.

**Pushed and confirmed.** `origin/claude/serene-ramanujan-msepc5` is at `f47c18e`, and the brief's `Branch:` header names that branch. Draft PR #91 (https://github.com/Dkaattae/geo-discovery-zone/pull/91) is open from it against `main`, with both questions and the draft criteria in its body.

**What a human needs to do:** answer Q1 and Q2 in the brief, set `Next step: task-expander`, and rerun the expander. It then finishes the criteria for a fresh approval.

**Why T-026.** It is the first queue entry whose dependencies are done:
- **Skipped:** T-070 and T-084 wait on Q1 in `tasks.md`. T-085 waits on a person.
- **Recommended:** `PROGRESS.md` "Next" and `tasks.md` both say to start T-026 with the superlative topic.
- **Scope:** I limited the brief to that one topic. T-026's done-when asks for at least one new topic, and the other topics each need decisions this one does not.

**Q1: which "biggest" can a child be marked wrong on?**
- **The conflict:** plan §1.8 asks for next-ranked distractors and also says to avoid contested rankings. The bank's `area_km2` is total area, water included, and on it those two rules conflict.
- **How often:** in at least 6 of the 47 possible questions (OR, MI, WA, OK, FL, HI), a distractor has more land than the answer. Oklahoma and Missouri are also only 0.4% apart on total area.
- **The land figures are from my memory of Census data,** not a committed source, and the brief says so.
- **Options:**
  - **(a)** Next-ranked on total area, accepting the contested rows.
  - **(b)** Total area, but only when the answer is clearly bigger: a size margin plus a list of water-heavy states to leave out. A person picks the margin and approves the list. This is my recommendation.
  - **(c)** Add a land-area field first, as its own task. It would sit behind T-070.
  - **(d)** Something else.

**Q2:** split T-026 so this brief is the superlative topic only, and file wildlife, landmark, climate and agriculture as one queue entry each? Yes or no.

**Already worked out in the draft:**
- **22 draft criteria;** the 3 marked [Q1] get rewritten once Q1 is answered.
- **A giveaway on screen:** the current multiple-choice card shows the question entity's name and outline, and for this question the entity is the answer. Criterion 14 covers hiding it.
- **"A bit of both" becomes untrue** once there are three topics (criterion 17).
- **Tests that will go red by design:** `hand-check-levels-verify.test.ts` and `seed-level-loose-ends-verify.test.ts`. Someone should attend the tester step.
- **Survey:** the brief records what already exists, so nobody rebuilds it.

**Files committed** (only `tasks/` and `tasks.md`; I did not touch `PROGRESS.md`):
- `/home/user/geo-discovery-zone/tasks/T-026-biggest-state-superlative.md`: the new brief, with `Approved: pending` and my Sessions row.
- `/home/user/geo-discovery-zone/tasks.md`: T-026 marked `doing`, blocked on a person, with a pointer to the brief.

After my last commit, the system reported that the brief changed on disk. I did not re-read or revert it, so check the file if the change was unexpected.

## Halted — 2026-10-20
Gate: `Next step: human`, `Status: blocked` (G0 routes to a human). G1 passes (diff: `tasks.md`, `tasks/T-026-…`). `Approved:` left `pending` — not stamped, since no role runs after a halt.
Orchestrator note: working tree was clean on return and local HEAD matched `origin` at `f47c18e`, so the "changed on disk" notice left no uncommitted change.

What a human has to decide, quoted from the expander: "answer Q1 and Q2 in the brief, set `Next step: task-expander`, and rerun the expander."
