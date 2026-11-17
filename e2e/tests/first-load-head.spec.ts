/**
 * T-048 criterion 9: the page title and description are unchanged on first load.
 *
 * Expected values are the criterion's: the title verbatim, and the K–8 sentence
 * the brief names in `index.tsx`. Read from the served page after hydration, so
 * a head that differs between the prerendered shell and the client shows here.
 */
import { expect, test } from "@playwright/test";

import { pageDescription, splashStart } from "./app";

const TITLE = "Wander the Atlas — Geography Quiz for Kids";
const DESCRIPTION =
  "A calm, timer-free map game for kids in K–8. Find states, learn their stories, and color in the map as you go.";

test("T-048 c9: the first load keeps the page title and description", async ({ page }) => {
  await page.goto("/");
  await expect(splashStart(page)).toBeVisible();

  await expect(page).toHaveTitle(TITLE);
  await expect(pageDescription(page)).toHaveCount(1);
  await expect(pageDescription(page)).toHaveAttribute("content", DESCRIPTION);
});
