import { expect, test } from "bun:test";

test("throwaway probe for T-003 criterion 6 — passes, outside tsconfig include", () => {
  expect(1 + 1).toBe(2);
});
