import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a real stack — the docker compose one by default.
 *
 *   bun run test                                   # brings compose up if it is not already
 *   E2E_BASE_URL=http://localhost:8080 bun run test  # against `bun run dev` instead
 *
 * `reuseExistingServer` means a stack you already have running is used as-is
 * rather than rebuilt, which is the normal case: `docker compose up` in one
 * terminal, this in another.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:8000";
const managesTheStack = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  // The app is stateful per account, and every test makes its own, so they are
  // safe to run together. Serial only in CI, where the runner has fewer cores
  // than a laptop and a flaky timeout is worse than a slow run.
  fullyParallel: true,
  ...(process.env.CI ? { workers: 2 } : {}),
  // No `retries`. A quiz that only works the second time is not working, and a
  // retry would hide exactly the flake worth knowing about.
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL,
    // A child's tablet, roughly. The layout is responsive and the tap targets
    // are sized for fingers; testing at 1920px would miss that.
    ...devices["Desktop Chrome"],
    viewport: { width: 900, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Some sandboxes ship a Chromium that Playwright did not download.
    ...(process.env.E2E_CHROMIUM ? { launchOptions: { executablePath: process.env.E2E_CHROMIUM } } : {}),
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  ...(managesTheStack
    ? {
        webServer: {
          command: "docker compose -f ../docker-compose.yml up --build",
          url: `${baseURL}/health`,
          reuseExistingServer: true,
          // A cold build compiles the frontend and builds an image.
          timeout: 900_000,
          stdout: "pipe",
          stderr: "pipe",
        },
      }
    : {}),
});
