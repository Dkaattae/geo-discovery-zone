/**
 * Progress is logged, and it is still there next time.
 *
 * This is the claim the whole backend exists for. It used to live in
 * `localStorage`, where clearing site data or picking up a different device
 * silently threw away everything a child had learned. These tests sign out
 * completely — token gone, storage cleared — and sign back in as a fresh visit
 * on another device would.
 *
 * They answer **on purpose** rather than at random (see `fetchAnswerKey`).
 * Progress is earned: the level moves after four right answers in a row, and a
 * state fills in on the map after four right answers about that state. Random
 * answers over fifteen states produce neither reliably, so a test that played
 * randomly and asserted "progress went up" would be asserting a coin flip. The
 * random path is covered in `quiz.spec.ts`, where the point is that both
 * outcomes work rather than what they add up to.
 */
import { expect, test } from "@playwright/test";

import {
  PASSWORD,
  type AnswerKey,
  backHome,
  fetchAnswerKey,
  finishSession,
  levelOnHome,
  open,
  pickProfile,
  placesFilled,
  playCorrectly,
  signIn,
  signOut,
  signedInWithProfile,
  startQuiz,
} from "./app";

/** Four correct in a row raises the level by 0.5; twelve is three raises. */
const ENOUGH_TO_MOVE_THE_LEVEL = 12;

let answerKey: AnswerKey;

test.beforeAll(async ({ playwright, baseURL }) => {
  const request = await playwright.request.newContext(baseURL ? { baseURL } : {});
  answerKey = await fetchAnswerKey(request);
  await request.dispose();
});

test("signing out and back in starts where the child left off", async ({ page }) => {
  const { username, profileName } = await signedInWithProfile(page, "resume");
  const startingLevel = await levelOnHome(page);

  await startQuiz(page, "A bit of both");
  await playCorrectly(page, answerKey, ENOUGH_TO_MOVE_THE_LEVEL);
  await finishSession(page);
  await backHome(page);

  const level = await levelOnHome(page);
  const filled = await placesFilled(page);
  expect(level, "nothing changed, so there is nothing to prove was kept").not.toBe(startingLevel);

  await signOut(page);

  // A completely fresh visit: no token, no memory of the last profile — the
  // sign-in screen a child gets on a different device.
  await page.context().clearCookies();
  await page.evaluate(() => window.localStorage.clear());

  await open(page);
  await signIn(page, username, PASSWORD);
  await pickProfile(page, profileName);

  expect(await levelOnHome(page), "the level reset when the grown-up signed out").toBe(level);
  expect(await placesFilled(page), "the map reset when the grown-up signed out").toBe(filled);
});

test("the level a child reaches is remembered between sittings", async ({ page }) => {
  const { username, profileName } = await signedInWithProfile(page, "level-memory");
  const before = await levelOnHome(page);

  await startQuiz(page, "A bit of both");
  await playCorrectly(page, answerKey, ENOUGH_TO_MOVE_THE_LEVEL);
  await finishSession(page);
  await backHome(page);

  const after = await levelOnHome(page);
  expect(after, "twelve right answers in a row did not move the level").not.toBe(before);

  await signOut(page);
  await open(page);
  await signIn(page, username, PASSWORD);
  await pickProfile(page, profileName);

  expect(await levelOnHome(page)).toBe(after);
});

test("progress belongs to the profile, not the browser", async ({ page }) => {
  const { profileName } = await signedInWithProfile(page, "second-profile");
  const fresh = await levelOnHome(page);

  await startQuiz(page, "A bit of both");
  await playCorrectly(page, answerKey, ENOUGH_TO_MOVE_THE_LEVEL);
  await finishSession(page);
  await backHome(page);
  const earned = await levelOnHome(page);
  expect(earned).not.toBe(fresh);

  // A sibling on the same account starts from scratch, not from the first
  // child's level, and with an empty map.
  await page.getByRole("button", { name: "Switch" }).click();
  await page.getByRole("button", { name: "+ New explorer" }).click();
  await page.locator("#name").fill("Wren");
  await page.getByRole("button", { name: "Choose 🦜" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wren" })).toBeVisible();
  expect(await placesFilled(page), "a new sibling inherited someone else's map").toBe(0);
  expect(await levelOnHome(page), "a new sibling inherited someone else's level").toBe(fresh);

  // And the first child is untouched by any of that.
  await page.getByRole("button", { name: "Switch" }).click();
  await pickProfile(page, profileName);
  expect(await levelOnHome(page)).toBe(earned);
});

test("a session that is quit early still counts what was answered", async ({ page }) => {
  await signedInWithProfile(page, "quit-midway");

  await startQuiz(page, "Places on the map");
  await playCorrectly(page, answerKey, 2);
  await finishSession(page);
  await expect(page.locator("body")).toContainText("You answered 2 questions today.");

  await backHome(page);
  await expect(page.getByText(/places filled in/)).toBeVisible();
});

/**
 * The map is the progress bar, so it has to be able to move — and today it
 * cannot move on the first day.
 *
 * Mastery is +0.25 per right answer and a state fills in above 0.7, so a state
 * needs **four** right answers about it. The shipped bank has at most **two**
 * questions per state (26 questions over 15 states), and a session never repeats
 * a question. So the most any state can reach in one sitting is 0.5, and a
 * child's whole first session — even a perfect one — colours in nothing.
 * Mastery is stored on the profile, so it accumulates: a second sitting over the
 * same bank gets those states to 1.0. Measured against the API: 26 right answers
 * fill in 0 of 15, and 52 fill in 11.
 *
 * That is a content gap, not a bug — it goes away when there are more questions
 * per state (`tasks.md` T-050) — but it is worth a test that says so out loud,
 * because "the map never moved" is what a child would notice first. Two full
 * sittings in a browser is slow, hence the longer budget.
 */
test("the map fills in once a child has come back a second time", async ({ page }) => {
  test.slow();
  await signedInWithProfile(page, "map-fills");
  expect(await placesFilled(page), "a new explorer should start with an empty map").toBe(0);

  const BANK = 26;
  await startQuiz(page, "A bit of both");
  await playCorrectly(page, answerKey, BANK);
  await finishSession(page);
  await backHome(page);
  expect(
    await placesFilled(page),
    "the bank grew: a first session can now master a state, so this test's premise is stale",
  ).toBe(0);

  // Come back. The same questions are offered again and mastery accumulates.
  await startQuiz(page, "A bit of both");
  await playCorrectly(page, answerKey, BANK);
  await finishSession(page);
  await backHome(page);

  expect(await placesFilled(page), "a second full sitting filled in nothing").toBeGreaterThan(0);
});
