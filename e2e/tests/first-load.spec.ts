/**
 * The first load is clean: no hydration error (T-048).
 *
 * The served bundle is a prerendered shell the client hydrates. When the two
 * disagree, production React logs "Minified React error #418" and throws away
 * the server HTML to re-render the whole tree. The app looks fine afterwards,
 * which is exactly why it needs a test: a mismatch that "recovers" hides the
 * next real bug behind a full re-render, and nobody reads the console.
 *
 * Both first screens are covered, because they hydrate into different trees:
 * a visitor with nothing stored, and one whose `localStorage` already holds a
 * token and a last-picked profile — whose queries start on mount and whose
 * Start button leads to Home.
 */
import { expect, test } from "@playwright/test";

import { collectHydrationErrors, homeProgress, signedInWithProfile, splashStart } from "./app";

test("a signed-out first load emits no hydration error", async ({ page }) => {
  const errors = collectHydrationErrors(page);

  await page.goto("/");
  await expect(splashStart(page)).toBeVisible();
  await expect(splashStart(page)).toBeEnabled();

  expect(errors, `hydration errors on first load:\n${errors.join("\n")}`).toEqual([]);
});

test("a signed-in first load emits no hydration error", async ({ page, context }) => {
  // Sign in and pick a profile the way a child's grown-up would, so storage
  // holds what the app really writes rather than what a test guesses it writes.
  await signedInWithProfile(page, "first-load");
  await expect(homeProgress(page)).toBeVisible();
  await page.close();

  // A fresh page in the same context: same `localStorage`, new document, and
  // listeners that hear only this load.
  const fresh = await context.newPage();
  const errors = collectHydrationErrors(fresh);

  // The app always opens on the Splash, signed in or not; with a token and a
  // last profile stored, Start goes straight to Home rather than the picker.
  await fresh.goto("/");
  await splashStart(fresh).click();
  await expect(homeProgress(fresh)).toBeVisible();

  expect(errors, `hydration errors on first load:\n${errors.join("\n")}`).toEqual([]);
});
