/**
 * A child signs in and plays — every quiz type the app offers.
 *
 * The point of these is the loop working in a browser against the real stack:
 * the question renders, an answer is graded by the server, the reveal comes
 * back, and the next question arrives. Answers are picked at random, so a run
 * exercises both the right and the wrong path without the test deciding which.
 */
import { expect, test } from "@playwright/test";

import {
  DEMO,
  answerDeliberately,
  fetchAnswerKey,
  backHome,
  finishSession,
  goToNextQuestion,
  open,
  openSetup,
  pickProfile,
  playQuestions,
  questionPrompt,
  quizTypes,
  reveal,
  signIn,
  signedInWithProfile,
  startQuiz,
} from "./app";

test("a grown-up signs in with the account the README documents", async ({ page }) => {
  await open(page);
  await signIn(page, DEMO.username, DEMO.password);
  await expect(page.getByRole("heading", { name: "Who is exploring?" })).toBeVisible();
});

test("a wrong password does not get in, and says so", async ({ page }) => {
  await open(page);
  await signIn(page, DEMO.username, "not-the-password");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Who is exploring?" })).toBeHidden();
});

test("a new grown-up makes an account and a child profile", async ({ page }) => {
  const { profileName } = await signedInWithProfile(page, "signup");
  await expect(page.getByRole("heading", { name: profileName })).toBeVisible();
  await expect(page.getByText(/places filled in/)).toBeVisible();
});

/**
 * The one that matters: every quiz type, played the same way.
 *
 * The list is read off the Setup screen rather than written here, so the day a
 * third or fourth topic lands (`tasks.md` T-026) this test covers it with no
 * edit. That is why it is one test with a loop rather than a test per topic —
 * Playwright needs the list before the browser exists to generate them.
 */
test("every quiz type can be played through", async ({ page }) => {
  await signedInWithProfile(page, "all-topics");

  await openSetup(page);
  const types = await quizTypes(page);
  expect(types.length, "the Setup screen offered no quiz types").toBeGreaterThan(0);
  await page.getByRole("button", { name: "Back" }).click();

  for (const quizType of types) {
    await test.step(`plays "${quizType}"`, async () => {
      await startQuiz(page, quizType);
      await expect(questionPrompt(page)).not.toBeEmpty();
      await playQuestions(page, 4);
      await finishSession(page);
      await backHome(page);
    });
  }
});

test("a right answer earns a fact and a wrong one earns the reason", async ({
  page,
  playwright,
  baseURL,
}) => {
  const request = await playwright.request.newContext(baseURL ? { baseURL } : {});
  const key = await fetchAnswerKey(request);
  await request.dispose();

  await signedInWithProfile(page, "reveal-tones");
  await startQuiz(page, "Places on the map");

  // Both outcomes on purpose rather than by luck: the asymmetric reveal is the
  // product, so a test of it should not be able to miss half.
  await answerDeliberately(page, key, "correct");
  await expect(reveal(page).locator("p").first()).toHaveText("You got it");
  await expect(reveal(page).locator("p").nth(1), "a right answer with no fact").not.toBeEmpty();

  await goToNextQuestion(page);

  await answerDeliberately(page, key, "wrong");
  // Never a red X: a miss earns the answer and the reason it is right.
  await expect(reveal(page).locator("p").first()).toContainText("The answer is");
  await expect(reveal(page).locator("p").nth(1), "a wrong answer with no reason").not.toBeEmpty();
  await expect(page.getByRole("button", { name: "Oops, tapped by mistake" })).toBeVisible();
});

test("the summary counts places, never a percentage or a score", async ({ page }) => {
  await signedInWithProfile(page, "summary");
  await startQuiz(page, "A bit of both");
  await playQuestions(page, 3);
  await finishSession(page);

  const summary = page.locator("body");
  await expect(summary).toContainText("You answered 3 questions today.");
  await expect(summary).not.toContainText("%");
  await expect(summary).not.toContainText(/\bscore\b/i);
});

test("there are no timers anywhere in a session", async ({ page }) => {
  await signedInWithProfile(page, "no-timers");
  await startQuiz(page, "Places on the map");

  const body = page.locator("body");
  await expect(body).not.toContainText(/seconds? left|time'?s up|\b\d+:\d\d\b/i);

  // Thinking for a while must not move the app on by itself.
  const prompt = await questionPrompt(page).innerText();
  await page.waitForTimeout(4000);
  await expect(questionPrompt(page)).toHaveText(prompt);
});

test("a session can be picked up by switching profiles and back", async ({ page }) => {
  const { profileName } = await signedInWithProfile(page, "switch");
  await startQuiz(page, "Places on the map");
  await playQuestions(page, 2);
  await finishSession(page);
  await backHome(page);

  await page.getByRole("button", { name: "Switch" }).click();
  await pickProfile(page, profileName);
  await expect(page.getByText(/places filled in/)).toBeVisible();
});
