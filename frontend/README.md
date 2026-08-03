# World Explorer Kids

Frontend Brief — Geography Quiz for Kids

You are building the complete frontend for a children's geography learning app. There is no backend. All data is mocked locally. Do not write API clients, auth flows, or server calls of any kind.

1. What this is

A geography quiz app for kids in grades K–8. It teaches US and world geography through map-based questions, and — this is the part that matters — every answer is followed by an explanation or a fun fact. The quiz is the delivery mechanism; the learning happens in the reveal.

Design intent, in priority order:

The reveal is the product. Questions exist to earn explanations. Never let the explanation feel like a speed bump between questions.

No time pressure anywhere. There are deliberately no timers. A child thinking hard about a map is the app working correctly, not a delay to be optimized.

Wrong answers are not failures. No red X's, no percentage scores, no "you got 6/10." A wrong answer is the app's best teaching opportunity.

Questions are standalone. There is no fixed round length. A session is however many questions the kid feels like doing.

Audience note: a 5-year-old and a 13-year-old both use this. Touch targets must be generous, reading level must be low in the primary UI, and nothing should require fine motor precision.

2. Scope

Build

Profile picker + create profile

Home screen

Session setup (topic + level)

The question loop (present → answer → reveal → next)

Two question types: map-identify (multiple choice) and text multiple-choice

Two-tier reveal (short + expandable detail)

Quit confirmation and session summary

Review queue behavior (see §6)

Do NOT build

Any backend, API, or network request

Login, passwords, or account recovery

Timers or countdowns of any kind

Leaderboards, badges, achievements, streaks-as-competition

Sound

Pin-drop questions (planned, but not this pass)

Elevation profiles (planned, but not this pass)

3. Tech stack

React 18 + TypeScript + Vite

Tailwind CSS

react-simple-maps for map rendering

us-atlas for US state geometry (TopoJSON, public domain)

localStorage for all persistence — profiles, progress, review queue

No state library needed; React context + useReducer is sufficient

Install: npm i react-simple-maps us-atlas topojson-client

4. Data shapes

All mock data lives in src/data/. Type everything.

// A place in the world. Questions are generated from these.
interface Entity {
  id: string;              // "us-state-co"
  type: 'state' | 'country' | 'city';
  name: string;            // "Colorado"
  capital?: string;
  fipsCode?: string;       // "08" — joins to us-atlas geometry
  region: string;          // "Mountain West"
  funFact: string;         // shown on CORRECT answers
  funFactDetail: string;   // shown behind "Tell me more"
}

interface Question {
  id: string;
  entityId: string;
  type: 'map-identify' | 'text-mc';
  prompt: string;              // "Which state is highlighted?"
  choices: string[];           // exactly 4
  correctIndex: number;
  level: number;               // 0.0–18.0, see §5
  topic: 'location' | 'capital';
  ageBand: 1 | 2 | 3;
  highlightFips?: string;      // for map-identify: which shape to highlight
  shortExplanation: string;    // shown on WRONG answers — answers "why"
  detailExplanation: string;   // behind "Why?" button
}

interface Profile {
  id: string;
  name: string;
  avatar: string;              // emoji or icon key
  level: number;               // current difficulty, 0.0–18.0
  lastSessionEndLevel: number;
  bestSustainedLevel: number;
  stats: { answered: number; correct: number };
  mastery: Record<string, number>;   // entityId -> 0..1
  reviewQueue: string[];             // entityIds
}


Ship ~15 entities and ~25 questions as mock data. Use real US states. Write plausible fun facts and explanations — they'll be replaced by real authored content later, so don't agonize, but do make them read like something a child would enjoy.

5. The level system

Grade and difficulty are one axis, not two. Store a single number; derive both labels for display.

const gradeOf = (level: number) => Math.floor(level / 2);   // 0 = K, 1 = 1st … 8 = 8th
const bandOf  = (level: number) => level - 2 * gradeOf(level); // 0 easy, 1 med, 2 hard

// level 7.0 renders as "3rd grade · Medium"


This is deliberate: 3rd-grade-hard and 4th-grade-easy are the same difficulty, so they map to the same number. Never store grade and difficulty as separate fields.

Level picker UI: show 3–4 options in a window around the profile's current level. Never show all 19. Default the selection to lastSessionEndLevel.

Question selection: pick from questions where |question.level - profile.level| <= 1.5, filtered by chosen topic, excluding recently-asked.

6. The question loop

States

PRESENTING  → question rendered, input live
COMMITTED   → answer locked, grading runs
REVEALING   → explanation shown, "Next" enabled


Committing an answer

Tap a choice = commit. No separate Submit button — it doubles the taps on every question in the app. Add a brief undo affordance if you're worried about accidental taps.

The reveal — two tiers, asymmetric by outcome

This is the most important screen in the app. Get it right.

OutcomeShort tier (always)Detail tier (button)CorrectGreen. The entity's fun fact. No re-teaching — they got it right, this is a reward. Dismissible immediately.Tell me more →reveals funFactDetailWrongThe short explanation — why the right answer is right. Correct answer highlighted on the map. Next enabled after ~1s so it can't be reflexively tapped away.Why? → reveals detailExplanation

The asymmetry is the point. Correct earns a reward; wrong earns a reason. A single generic modal for both trains kids to dismiss without reading.

Never show a bare red X. Wrong answers should feel like "here's the interesting thing you didn't know," not "you failed."

Difficulty drift

4 correct in a row → profile.level += 0.5

3 wrong in a row → profile.level -= 0.5, silently. No message. Kids read "difficulty lowered" as failure.

Review queue

Wrong answer → push entityId to profile.reviewQueue (cap at 20)

Every ~7th question, pop from the queue instead of serving a fresh one

Answered correctly twice on review → remove from queue, bump mastery

5 wrong cumulative in a session → offer a review round:

"Want to try those tricky ones again?" · [Let's do it] [Keep going]

An invitation, never forced, never immediately after a wrong answer. Run 5 max and try to end on a win.

Soft milestones

At 5, 10, and 20 questions in a session, show a small celebration with an explicit "Great stopping point! Keep going?"— open-ended play needs permission to stop, or kids drift off feeling like they quit.

7. Map rendering

Use react-simple-maps with geoAlbersUsa projection (it tucks Alaska and Hawaii in neatly).

<ComposableMap projection="geoAlbersUsa">
  <Geographies geography="/us-states-10m.json">
    {({ geographies }) => geographies.map(geo => (
      <Geography key={geo.id} geography={geo} /* geo.id is the FIPS code */ />
    ))}
  </Geographies>
</ComposableMap>


Join on FIPS codes, never on name strings. us-atlas puts the FIPS code in geo.id. Match it to Entity.fipsCode.

Map states:

Default — neutral fill

Highlighted (the question subject) — strong accent fill

Correct reveal — green

Progress fill (home screen) — states with mastery > 0.7 tinted

The map is the progress bar. On the home screen, show the US map with mastered states filled in. A half-colored map motivates a child far more than any point total, and it makes the goal legible at a glance. This is worth real design attention.

8. Visual direction

Design this for a specific child, not a demographic. It should look like something made with care, not a generic edtech template.

Avoid the defaults: cream background + serif display + terracotta accent; primary-color "kid app" palettes (red/yellow/blue everywhere); rounded-everything with drop shadows; cartoon mascots. These read as templated.

Ground it in the subject. Geography has its own visual vocabulary worth stealing from: topographic contour lines, hypsometric tints (the green→brown→white elevation gradient of real atlases), compass roses, latitude/longitude grids, the hand-lettered look of vintage school maps, hachure shading. Pick a direction from that world and commit.

Typography carries it. Pick a display face with personality and a highly legible body face — legibility is a hard requirement, some users are still learning to read. Set a clear scale.

Spend boldness in one place. The reveal moment is the obvious candidate — that's where the emotional payoff lives. Keep everything around it quiet.

Motion: the correct-answer moment deserves a real beat. Elsewhere, restraint. Respect prefers-reduced-motion.

Quality floor, unannounced: responsive to mobile, visible keyboard focus, generous touch targets (minimum 44×44px, larger for primary actions), sufficient contrast.

Copy

Words are design material here, and the audience is a child.

Active voice, plain verbs, sentence case

Name things by what the kid does, not how the system works

An action keeps its name throughout: the button that says "Start" leads to a screen that says "Start"

Empty and error states give direction, not mood

Never condescend. Kids notice.

9. Screens

Splash
  ↓
Profile picker ──[+ New]──→ Create (name + avatar + grade)
  ↓                              ↓
Home  ←────────────────────────┘
  · greeting, US map with mastered states filled
  · [Start] → Setup
  ↓
Setup: topic → level → [Start]
  ↓
Question loop  ──[Quit]──→ "Done for now?"
  · present → answer → reveal → next        ├─ session summary
                                            ├─ [Keep playing]  ← default, larger
                                            └─ [Back home]


Session summary copy matters. Never show a percentage. "You learned 3 new states!" and "60%" carry the same information and opposite messages about whether to come back.

10. Definition of done

[ ] Create a profile, close the tab, reopen — profile persists

[ ] Full loop playable end to end with mock data

[ ] Map highlights the right state; FIPS join is correct

[ ] Correct answers show a fun fact; wrong answers show an explanation — visibly different treatments

[ ] Detail tier expands on both

[ ] Level renders as "3rd grade · Medium" from a single stored number

[ ] Difficulty drifts up and down; the downward drift is silent

[ ] Wrong answers enter the review queue and resurface

[ ] Quit confirms, summarizes without a percentage, and offers to return

[ ] Works on a phone-sized viewport with touch

[ ] No network requests anywhere in the app

11. Notes for whoever picks this up

Real entity data (50 states, then countries, rivers, mountains) is being built in a separate pipeline and will arrive as JSON matching the Entity shape above. Keep the mock data behind a single module boundary — src/data/index.tsexporting typed arrays — so swapping in the real file is a one-line change.

Question generation will eventually happen at build time from templates × entities. For now, questions are hand-written mock objects. Keep Question consumption generic; don't hardcode anything that assumes there are only 25 of them.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6cc1b9e7-cd07-48cc-b573-4edd4339cf27).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
