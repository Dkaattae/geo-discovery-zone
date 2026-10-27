/**
 * T-051 tester: a `map_click` question in a real browser, against the real
 * stack. Criteria 25 to 32 of `tasks/T-051-map-click-render.md`, the half that
 * static markup cannot show: keyboard activation, one request per tap, the
 * reveal's banner and drawing, Next's delay, and undo.
 *
 * Selection is random, so the test plays a "Places on the map" quiz until the
 * server serves a `map_click` question (half that topic's questions are), and
 * answers anything else on the way with its first button. The answer key comes
 * from the public `GET /questions/{id}`, which still serves it by default
 * (T-053), keyed on the id the server served.
 *
 * Self-contained on purpose: `app.ts`'s answer helpers assume answer buttons,
 * and they are on the brief's stale list.
 */
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

import { dismissSheets, reveal, signedInWithProfile, startQuiz } from "./app";

const TAPPABLE = '[role="button"][data-geometry-id]';
const ANSWERS = /\/api\/v1\/sessions\/[^/]+\/answers$/;
const SERVES = /\/api\/v1\/sessions(\/[^/]+\/(next-question|review-round))?$/;

type Served = { id: string; format: string };

/** Every question the server serves this page, in order. */
function watchServes(page: Page): Served[] {
  const served: Served[] = [];
  page.on("response", async (response) => {
    if (response.request().method() !== "POST") return;
    if (!SERVES.test(new URL(response.url()).pathname)) return;
    const body = (await response.json().catch(() => null)) as {
      question?: Served;
      served?: { question?: Served };
    } | null;
    const question = body?.served?.question ?? body?.question;
    if (question) served.push({ id: question.id, format: question.format });
  });
  return served;
}

/** The body of every answer the page sends. */
function watchAnswers(page: Page): Record<string, unknown>[] {
  const sent: Record<string, unknown>[] = [];
  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (!ANSWERS.test(new URL(request.url()).pathname)) return;
    sent.push(request.postDataJSON() as Record<string, unknown>);
  });
  return sent;
}

/** Plays on until the question on screen is a `map_click`. */
async function untilMapClick(page: Page, served: Served[]): Promise<Served> {
  for (let guard = 0; guard < 40; guard += 1) {
    await dismissSheets(page);
    await expect
      .poll(
        async () =>
          (await page.locator(TAPPABLE).count()) +
          (await choices(page).count()),
      )
      .toBeGreaterThan(0);
    const last = served.at(-1);
    if ((await page.locator(TAPPABLE).count()) > 0) {
      expect(last?.format).toBe("map_click");
      return last!;
    }
    await choices(page).first().click();
    await expect(reveal(page)).toBeVisible();
    const next = page.getByRole("button", { name: "Next", exact: true });
    await expect(next).toBeEnabled();
    await next.click();
    await dismissSheets(page);
    await expect(reveal(page)).toBeHidden();
  }
  throw new Error("forty questions and no map_click");
}

function choices(page: Page) {
  return page.locator('button[data-variant="choice"]:enabled');
}

async function answerKey(
  request: APIRequestContext,
  questionId: string,
): Promise<{ geometryId: string; name: string }> {
  const question = await request.get(
    `/api/v1/questions/${encodeURIComponent(questionId)}`,
  );
  expect(question.ok()).toBeTruthy();
  const { answerGeometryId, entityId } = (await question.json()) as {
    answerGeometryId: string;
    entityId: string;
  };
  const entity = await request.get(
    `/api/v1/entities/${encodeURIComponent(entityId)}`,
  );
  expect(entity.ok()).toBeTruthy();
  const { name } = (await entity.json()) as { name: string };
  return { geometryId: answerGeometryId, name };
}

/** A state that is not the answer, and not a neighbour by accident of choice. */
function wrongFor(answer: string): string {
  return answer === "06" ? "36" : "06";
}

async function activateByKeyboard(
  page: Page,
  geometryId: string,
): Promise<void> {
  const state = page.locator(`${TAPPABLE}[data-geometry-id="${geometryId}"]`);
  await expect(state).toHaveCount(1);
  await state.focus();
  await page.keyboard.press("Enter");
}

test("a map_click question: one tap answers, the reveal draws both states, undo reopens the map", async ({
  page,
  playwright,
  baseURL,
}) => {
  const request = await playwright.request.newContext(
    baseURL ? { baseURL } : {},
  );
  const served = watchServes(page);
  const sent = watchAnswers(page);

  await signedInWithProfile(page, "map-click");
  await startQuiz(page, "Places on the map");
  const question = await untilMapClick(page, served);
  const key = await answerKey(request, question.id);
  await request.dispose();
  const wrong = wrongFor(key.geometryId);
  const before = sent.length;

  // 25: every drawn state is a control in the tab order.
  const states = page.locator("path.rsm-geography");
  const drawn = await states.count();
  expect(drawn).toBeGreaterThanOrEqual(51);
  await expect(page.locator(TAPPABLE)).toHaveCount(drawn);
  await expect(page.locator(`${TAPPABLE}:not([tabindex="0"])`)).toHaveCount(0);

  // 25, 26: Enter on a focused state submits exactly one answer, by its id.
  await activateByKeyboard(page, wrong);
  await expect(reveal(page)).toBeVisible();
  expect(sent.slice(before)).toEqual([
    { questionId: question.id, tappedGeometryId: wrong },
  ]);

  // 29: the banner names the server's answer.
  await expect(reveal(page).locator("p").first()).toHaveText(
    `The answer is ${key.name}`,
  );

  // 31: Next waits for nextEnabledAfterMs, and the undo is offered.
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Oops, tapped by mistake" }),
  ).toBeVisible();

  // 27: with the reveal up nothing is tappable, and a click sends nothing.
  await expect(page.locator(TAPPABLE)).toHaveCount(0);
  await states.nth(10).dispatchEvent("click");
  await states.nth(20).dispatchEvent("click");
  expect(sent.length).toBe(before + 1);

  // 29, 30: the answer is lit with the correct-answer colour; the tapped state
  // is drawn apart from it and from every untapped state.
  await expect(
    page.locator('path.rsm-geography[fill="var(--map-correct)"]'),
  ).toHaveCount(1);
  const looks = await states.evaluateAll((paths) =>
    paths.map((p) =>
      ["fill", "stroke", "stroke-width", "stroke-dasharray"]
        .map((name) => p.getAttribute(name))
        .join("|"),
    ),
  );
  const counts = new Map<string, number>();
  for (const look of looks) counts.set(look, (counts.get(look) ?? 0) + 1);
  const unique = [...counts].filter(([, n]) => n === 1).map(([look]) => look);
  // Exactly two one-of-a-kind drawings: the answer and the tapped state.
  expect(unique).toHaveLength(2);
  expect(
    unique.filter((look) => look.startsWith("var(--map-correct)")),
  ).toHaveLength(1);

  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeEnabled();

  // 32: undo returns every state alike and tappable.
  await page.getByRole("button", { name: "Oops, tapped by mistake" }).click();
  await expect(reveal(page)).toBeHidden();
  await expect(page.locator(TAPPABLE)).toHaveCount(drawn);
  const reopened = await page.locator(TAPPABLE).evaluateAll((paths) =>
    paths.map((p) =>
      Array.from(p.attributes)
        // `style` carries react-simple-maps' focus/hover look, which follows
        // the keyboard focus left by the first answer, not the answer. `d` is
        // each state's own outline.
        .filter((a) => !["data-geometry-id", "style", "d"].includes(a.name))
        .map((a) => `${a.name}=${a.value}`)
        .sort()
        .join(" "),
    ),
  );
  expect(new Set(reopened).size).toBe(1);

  // 26, 28: a tap on the answer is right, and the banner says so.
  const tappedAgain = sent.length;
  await page
    .locator(`${TAPPABLE}[data-geometry-id="${key.geometryId}"]`)
    .dispatchEvent("click");
  await expect(reveal(page).locator("p").first()).toHaveText("You got it");
  await expect(reveal(page).locator("p").nth(1)).not.toBeEmpty();
  expect(sent.slice(tappedAgain)).toEqual([
    { questionId: question.id, tappedGeometryId: key.geometryId },
  ]);
  await expect(
    page.locator('path.rsm-geography[fill="var(--map-correct)"]'),
  ).toHaveCount(1);
});
