/**
 * The app, as a child moves through it. Every selector in the suite lives here.
 *
 * Tests then read as the flow they describe, and when a screen's markup changes
 * one file changes with it. Selectors are roles and visible text wherever that
 * works — the same handles a screen reader uses, so a selector that breaks
 * usually means the screen got harder to use, not just different. The one
 * exception is `data-variant`, which says what a button *is* rather than what it
 * looks like; picking answer buttons out by their Tailwind classes would break
 * on any restyle.
 */
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

/** The seeded fixture the README documents. Local only, never a real credential. */
export const DEMO = {
  username: "grownup@example.com",
  password: "atlas-demo-password",
};

export const PASSWORD = "e2e-password-long-enough";

/** A username no other run can have taken — the stack keeps its rows. */
export function freshUsername(label: string): string {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return `e2e-${label}-${unique}@example.test`;
}

// -- screens ----------------------------------------------------------------

export async function open(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
}

export async function register(page: Page, username: string): Promise<void> {
  await page.getByRole("button", { name: "I need an account" }).click();
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
}

export async function signIn(page: Page, username: string, password = PASSWORD): Promise<void> {
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function createProfile(page: Page, name: string, grade = 2): Promise<void> {
  await page.getByRole("button", { name: "+ New explorer" }).click();
  await expect(page.getByRole("heading", { name: "New explorer" })).toBeVisible();
  await page.locator("#name").fill(name);
  await page.getByRole("button", { name: "Choose 🦊" }).click();
  await page.getByRole("button", { name: String(grade), exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

/** A signed-in grown-up with one child profile, sitting on the home screen. */
export async function signedInWithProfile(
  page: Page,
  label: string,
  profileName = "Fox",
): Promise<{ username: string; profileName: string }> {
  const username = freshUsername(label);
  await open(page);
  await register(page, username);
  await createProfile(page, profileName);
  return { username, profileName };
}

export async function pickProfile(page: Page, name: string): Promise<void> {
  await expect(page.getByRole("heading", { name: "Who is exploring?" })).toBeVisible();
  await page.locator('button[data-variant="choice"]').filter({ hasText: name }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Switch" }).click();
  await expect(page.getByRole("heading", { name: "Who is exploring?" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
}

// -- progress, as the child sees it -----------------------------------------

/** "N of M places filled in" — the map is the progress bar, so this is progress. */
export async function placesFilled(page: Page): Promise<number> {
  const text = await page.getByText(/places filled in/).innerText();
  const match = text.match(/(\d+)\s+of\s+(\d+)/);
  if (!match) throw new Error(`could not read progress from: ${text}`);
  return Number(match[1]);
}

/** The level line under the Start button, e.g. "2nd grade · Easy". */
export async function levelOnHome(page: Page): Promise<string> {
  return (await page.locator("main > p").last().innerText()).trim();
}

// -- the quiz ---------------------------------------------------------------

/**
 * Every quiz type the Setup screen offers, read from the app rather than
 * hardcoded — a topic added later is covered by these tests without editing
 * them. The topic buttons are the div immediately after the screen's heading;
 * the level buttons live under their own heading further down.
 */
export async function quizTypes(page: Page): Promise<string[]> {
  await expect(page.getByRole("heading", { name: "What do you want to find?" })).toBeVisible();
  const labels = await topicButtons(page).allInnerTexts();
  return labels.map((label) => label.trim()).filter(Boolean);
}

function topicButtons(page: Page): Locator {
  return page.locator('h1:has-text("What do you want to find?") + div').getByRole("button");
}

export async function openSetup(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What do you want to find?" })).toBeVisible();
}

export async function startQuiz(page: Page, quizType: string): Promise<void> {
  await openSetup(page);
  await topicButtons(page).filter({ hasText: quizType }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  // Setup's heading is also an h1, and so are the level buttons' container, so
  // "a heading is visible" is true before the session has started. Wait for the
  // screen to actually change.
  await expect(page.getByRole("heading", { name: "What do you want to find?" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Quit" })).toBeVisible();
  await expect(questionPrompt(page)).toBeVisible();
}

export function questionPrompt(page: Page): Locator {
  return page.getByRole("heading", { level: 1 });
}

/** The tappable answers, and nothing else on the screen. */
function choiceButtons(page: Page): Locator {
  return page.locator('button[data-variant="choice"]');
}

/** The reveal panel: a fun fact when right, the reason why when wrong. */
export function reveal(page: Page): Locator {
  return page.locator("section[aria-live='polite']");
}

/**
 * Answers one question with a randomly chosen option and waits for the reveal.
 *
 * Random on purpose. The point is not to score — it is that both outcomes work.
 * A test that always picked index 0 would exercise one of the two reveal paths
 * and never notice the other had broken.
 */
export async function answerAtRandom(page: Page): Promise<boolean> {
  await expect(questionPrompt(page)).toBeVisible();
  await expect(reveal(page), "asked to answer while the last reveal is up").toBeHidden();
  const options = choiceButtons(page);
  const count = await options.count();
  expect(count, "a question with nothing to answer it with").toBeGreaterThan(1);

  await options.nth(Math.floor(Math.random() * count)).click();
  return await gradedCorrect(page);
}

/**
 * Waits for the reveal to settle, then reports how the server graded it.
 *
 * Reading the banner the moment the panel becomes visible is a race: React can
 * paint the section before its text is the text for *this* answer, and a single
 * `innerText()` has no second chance. Asserting on the text first makes
 * Playwright retry until it is one of the two things it can legitimately be.
 */
async function gradedCorrect(page: Page): Promise<boolean> {
  const banner = reveal(page).locator("p").first();
  await expect(banner).toHaveText(/^(You got it|The answer is .+)$/);
  // `textContent`, not `innerText`. The banner is styled `uppercase`, and
  // `innerText` returns what CSS rendered — "YOU GOT IT" — so a comparison
  // against the string in the source silently never matches. It looked for an
  // afternoon like the server was grading correct answers wrong.
  const text = ((await banner.textContent()) ?? "").trim();
  return text.startsWith("You got it");
}

/**
 * A lookup from the question on screen to the right answer.
 *
 * The bank is public — `GET /questions` serves it with no token, and
 * `includeAnswerKey` still defaults to true (`tasks.md` T-053) — so a test can
 * know the answer even though the app deliberately does not: the server grades,
 * and the client is never sent the key.
 *
 * Needed because progress is earned, not given. Mastery moves +0.25 per correct
 * answer and a state fills in on the map at 0.7, so it takes four right answers
 * about one state; the level moves after four correct in a row. Random answers
 * across fifteen states will not reliably do either, so the tests that check
 * progress persists have to be able to answer on purpose.
 */
export type AnswerKey = Map<string, string>;

function keyOf(prompt: string, choices: string[]): string {
  return `${prompt.trim()}::${[...choices].sort().join("|")}`;
}

export async function fetchAnswerKey(request: APIRequestContext): Promise<AnswerKey> {
  const response = await request.get("/api/v1/questions", {
    params: { limit: 500, includeAnswerKey: "true" },
  });
  expect(response.ok(), "could not read the question bank").toBeTruthy();
  const body = (await response.json()) as {
    data: { prompt: string; choices?: string[]; correctIndex?: number }[];
  };

  const key: AnswerKey = new Map();
  for (const question of body.data) {
    const { prompt, choices, correctIndex } = question;
    if (!choices || correctIndex === undefined) continue;
    const answer = choices[correctIndex];
    if (answer) key.set(keyOf(prompt, choices), answer);
  }
  expect(key.size, "the bank served no answerable questions").toBeGreaterThan(0);
  return key;
}

/** Answers the question on screen correctly, or wrongly on purpose. */
export async function answerDeliberately(
  page: Page,
  key: AnswerKey,
  want: "correct" | "wrong",
): Promise<void> {
  await expect(questionPrompt(page)).toBeVisible();
  await expect(reveal(page), "asked to answer while the last reveal is up").toBeHidden();
  const prompt = await questionPrompt(page).innerText();
  const options = choiceButtons(page);
  const labels = (await options.allInnerTexts()).map((label) => label.trim());

  const answer = key.get(keyOf(prompt, labels));
  expect(answer, `no answer key for: ${prompt} [${labels.join(", ")}]`).toBeTruthy();

  const index =
    want === "correct"
      ? labels.indexOf(answer!)
      : labels.findIndex((label) => label !== answer);
  await options.nth(index).click();

  const graded = (await gradedCorrect(page)) ? "correct" : "wrong";
  expect(graded, `the server graded "${prompt}" differently than the key says`).toBe(want);
}

/** Plays `count` questions, all answered correctly. */
export async function playCorrectly(page: Page, key: AnswerKey, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await dismissSheets(page);
    await answerDeliberately(page, key, "correct");
    if (index < count - 1) await goToNextQuestion(page);
  }
}

/**
 * The app interrupts on its own terms: a milestone at 5, 10 and 20 answers, and
 * a review offer after five cumulative wrong ones. Both are features, and a test
 * that did not expect them would fail at question six for the wrong reason.
 */
export async function dismissSheets(page: Page): Promise<void> {
  const sheet = page.getByRole("dialog");
  for (let guard = 0; guard < 3; guard += 1) {
    if (!(await sheet.isVisible().catch(() => false))) return;
    const carryOn = sheet.getByRole("button", { name: /Keep going|Keep playing|Let's do it/ });
    if (!(await carryOn.first().isVisible().catch(() => false))) return;
    await carryOn.first().click();
  }
}

export async function goToNextQuestion(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await dismissSheets(page);
  await awaitFreshQuestion(page);
}

/**
 * Waits until the screen is a question again, not the last one's reveal.
 *
 * The next question is fetched from the server, so for a moment after "Next"
 * the old prompt and its answers are still on the page. Reading them there is
 * how a test ends up computing an answer for the previous question and clicking
 * a button that, by the time it is enabled, belongs to the new one — which
 * looks exactly like the server grading wrongly. It cost an afternoon.
 */
async function awaitFreshQuestion(page: Page): Promise<void> {
  await expect(reveal(page)).toBeHidden();
  await expect(choiceButtons(page).first()).toBeEnabled();
}

/** Plays `count` questions, handling whatever the app raises in between. */
export async function playQuestions(page: Page, count: number): Promise<number> {
  let correct = 0;
  for (let index = 0; index < count; index += 1) {
    await dismissSheets(page);
    if (await answerAtRandom(page)) correct += 1;
    if (index < count - 1) await goToNextQuestion(page);
  }
  return correct;
}

/** Ends the session through the quit sheet and lands on the summary. */
export async function finishSession(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Quit" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Done for now?" })).toBeVisible();
  await sheet.getByRole("button", { name: "Finish up" }).click();
  await expect(page.getByRole("button", { name: "Back home" })).toBeVisible();
}

export async function backHome(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Back home" }).click();
  await expect(page.getByText(/places filled in/)).toBeVisible();
}
