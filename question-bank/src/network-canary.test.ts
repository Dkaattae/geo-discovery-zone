// TEMPORARY — T-005 criteria 7/8. Proves the CI guard actually blocks (and,
// without it, allows) a real outbound request. Removed before this branch
// ships; see the brief's Handoff and Notes for the recorded run URLs.
import { describe, expect, test } from "bun:test";

describe("canary — reaches the network", () => {
  test("fetches a public host over HTTPS", async () => {
    const response = await fetch("https://example.com/");
    expect(response.status).toBe(200);
  });
});
