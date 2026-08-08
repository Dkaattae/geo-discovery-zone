import { expect, test } from "bun:test";

test("T-003 6c probe — a FAILING test the find guard cannot see", () => {
  expect(1 + 1).toBe(3);
});
