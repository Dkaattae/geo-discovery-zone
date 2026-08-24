# `e2e/` — the app in a browser, against the real stack

13 Playwright tests that drive Chromium through the app the way a child and a
grown-up would: sign in, make an explorer, play a quiz, answer, come back later.

```bash
cd e2e && bun install && bun run install-browser
bun run test                                    # brings docker compose up if it is not already
E2E_BASE_URL=http://localhost:8000 bun run test # against a stack you are already running
bun run test:headed                             # watch it happen
bun run report                                  # the HTML report after a failure
```

`reuseExistingServer` is on, so the normal loop is `docker compose up` in one
terminal and `bun run test` in another. With no `E2E_BASE_URL` and no stack
running, Playwright brings compose up itself and tears it down after.

## Why these and not more backend tests

`backend/tests/` covers the rules and `backend/integration/` covers the stack
over HTTP. Neither renders anything. These are the only tests that can fail when
a button stops being clickable, a screen never advances, or the app shows a
child the wrong thing while the API was right all along.

| File | What it holds down |
|---|---|
| `quiz.spec.ts` | Sign-in (and a wrong password refused), sign-up, **every quiz type played through**, the asymmetric reveal, the summary that counts places rather than scoring, and no timers anywhere |
| `progress.spec.ts` | Progress is logged and survives a full sign-out: level, map, and one profile's progress not leaking into a sibling's |
| `app.ts` | Every selector in the suite, and the flows built from them |

## How they are written

**Quiz types are read from the app, not listed here.** `quizTypes()` reads the
buttons on the Setup screen, and `"every quiz type can be played through"` loops
over whatever it finds. When a third or fourth topic lands (`tasks.md` T-026)
these tests cover it with no edit. That is why it is one test with a loop rather
than a test per topic: Playwright needs the list before a browser exists.

**Answers are random where the point is the loop, deliberate where the point is
progress.** `quiz.spec.ts` picks at random, so a run exercises both the right and
the wrong path without the test choosing. `progress.spec.ts` answers correctly on
purpose, using the answer key from the public `GET /questions` — progress is
earned, and random answers over fifteen states earn nothing reliably.

**Selectors are roles and visible text**, the same handles a screen reader uses,
so a selector that breaks usually means the screen got harder to use. The one
exception is `data-variant` on `Button`, which says what a button *is* rather
than what it looks like; picking the answers out by Tailwind classes would break
on any restyle.

## Two things these tests found

**A real bug, on the first run.** `POST /auth/register` answered `201 Created`
before the row was committed, so the app's very next request — exchanging those
credentials for a token — could be told the brand-new password was wrong. About
one sign-up in eight under load. The cause was `get_db` committing after its
`yield`, which FastAPI runs *after the response has gone to the client*. Fixed in
`backend/app/db.py`; regression tests in `backend/integration/test_write_durability.py`.
No in-process test could have caught it, because `httpx.ASGITransport` and an
overridden session never exercise that ordering.

**The map cannot fill in on a child's first day.** A state needs four right
answers to fill in; the shipped bank has at most two questions per state, and a
session never repeats a question. So a perfect first sitting colours in nothing,
and it takes a second visit. That is a content gap rather than a bug — it
disappears with more questions per state (`tasks.md` T-050) — but "the map is the
progress bar" is a stated principle, and today the progress bar cannot move on
day one. `"the map fills in once a child has come back a second time"` says so,
and fails if the premise ever stops being true.

## Known limits

- **Chromium only.** One engine, because the app is one page of standard DOM and
  a second engine would buy less than the minutes it costs. Revisit if anything
  here starts depending on layout.
- **No visual assertions.** Nothing checks that the map *looks* right, only that
  the right states are counted. A screenshot baseline is a separate decision.
- `E2E_CHROMIUM` overrides the browser binary, for sandboxes that ship a
  Chromium that Playwright did not download.
