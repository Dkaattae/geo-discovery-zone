import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CURATED_US_STATES } from "./curated/us-states";

/**
 * T-015 — shape checks for `top_crops` that no existing suite covered.
 *
 * `climate-kid.test.ts`, `climate-kid-verify.test.ts`, `landmarks.test.ts` and
 * `state-animals.test.ts` each replace their stale "always `[]`" assertion with
 * a check that the tracked file equals `CURATED_US_STATES` (criterion 5) and
 * falls in the 1–3 range (criterion 1). `committed-bank.test.ts` already runs
 * two offline rebuilds and diffs the whole entity byte-for-byte against the
 * tracked files (criterion 6) and pins `built_at` (part of criterion 13) — this
 * task's own values ride along in that comparison with no new rebuild needed
 * here, which is why this file does not import `rebuildOffline`: nothing below
 * spans the network or a build.
 *
 * What is genuinely new here: criteria 2 (register), 3 (distinctness) and 4
 * (plant crops only) constrain the string *content*, not just where it comes
 * from, and nothing else in the suite reads every crop string looking for a
 * comma, a machine label or a livestock word.
 */

const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const DATA_DIR = join(PKG, "data/us-states");

function git(args: string[]): { status: number; stdout: string } {
  const proc = Bun.spawnSync(["git", ...args], { cwd: REPO });
  return { status: proc.exitCode, stdout: proc.stdout.toString() };
}

/** Throws rather than returning `[]`: an empty list would make the loops vacuous. */
function trackedStateFiles(): string[] {
  const { status, stdout } = git(["ls-files", "question-bank/data/us-states/us-state-??.json"]);
  if (status !== 0) throw new Error(`git ls-files exited ${status}`);
  const paths = stdout
    .split("\n")
    .filter(Boolean)
    .map((p) => p.split("/").pop() as string)
    .sort();
  if (paths.length !== 50) throw new Error(`expected 50 tracked state files, found ${paths.length}`);
  return paths;
}

interface TrackedEntity {
  top_crops?: unknown;
}

function trackedCrops(): { file: string; crops: unknown }[] {
  return trackedStateFiles().map((file) => ({
    file,
    crops: (JSON.parse(readFileSync(join(DATA_DIR, file), "utf8")) as TrackedEntity).top_crops,
  }));
}

/** Every `top_crops` string, tagged with where it came from, curated table and tracked bank both. */
function allCropStrings(): { source: string; value: string }[] {
  const out: { source: string; value: string }[] = [];
  for (const state of CURATED_US_STATES) {
    for (const crop of state.top_crops ?? []) {
      out.push({ source: `CURATED_US_STATES/${state.postal}`, value: crop });
    }
  }
  for (const { file, crops } of trackedCrops()) {
    for (const crop of crops as string[]) {
      out.push({ source: file, value: crop });
    }
  }
  return out;
}

describe("criterion 1 — count", () => {
  test("every tracked file's top_crops has 1 to 3 non-blank strings", () => {
    for (const { file, crops } of trackedCrops()) {
      expect(Array.isArray(crops)).toBe(true);
      const arr = crops as string[];
      expect({ file, length: arr.length }).toEqual({
        file,
        length: Math.min(Math.max(arr.length, 1), 3),
      });
      for (const crop of arr) {
        expect({ file, crop, trimmedNonEmpty: crop.trim().length > 0 }).toEqual({
          file,
          crop,
          trimmedNonEmpty: true,
        });
      }
    }
  });

  test("every CURATED_US_STATES entry carries top_crops with 1 to 3 entries", () => {
    expect(CURATED_US_STATES).toHaveLength(50);
    for (const state of CURATED_US_STATES) {
      const crops = state.top_crops;
      expect({ postal: state.postal, defined: crops !== undefined }).toEqual({
        postal: state.postal,
        defined: true,
      });
      const arr = crops as string[];
      expect({ postal: state.postal, length: arr.length }).toEqual({
        postal: state.postal,
        length: Math.min(Math.max(arr.length, 1), 3),
      });
    }
  });
});

describe("criterion 2 — register", () => {
  for (const { source, value } of allCropStrings()) {
    test(`${source}: "${value}" is trimmed, no shouted acronym, no comma, no " - "`, () => {
      expect({ source, value, trimmed: value === value.trim() }).toEqual({
        source,
        value,
        trimmed: true,
      });
      expect({ source, value, hasAcronym: /[A-Z]{2,}/.test(value) }).toEqual({
        source,
        value,
        hasAcronym: false,
      });
      expect({ source, value, hasComma: value.includes(",") }).toEqual({
        source,
        value,
        hasComma: false,
      });
      expect({ source, value, hasDash: value.includes(" - ") }).toEqual({
        source,
        value,
        hasDash: false,
      });
    });
  }
});

describe("criterion 3 — distinctness within a state", () => {
  test("no tracked file repeats a crop case-insensitively", () => {
    for (const { file, crops } of trackedCrops()) {
      const arr = (crops as string[]).map((c) => c.trim().toLowerCase());
      expect({ file, unique: new Set(arr).size }).toEqual({ file, unique: arr.length });
    }
  });

  test("no CURATED_US_STATES entry repeats a crop case-insensitively", () => {
    for (const state of CURATED_US_STATES) {
      const arr = (state.top_crops ?? []).map((c) => c.trim().toLowerCase());
      expect({ postal: state.postal, unique: new Set(arr).size }).toEqual({
        postal: state.postal,
        unique: arr.length,
      });
    }
  });
});

describe("criterion 4 — plant crops only", () => {
  const BANNED = [
    "cattle",
    "beef",
    "dairy",
    "milk",
    "poultry",
    "chicken",
    "broiler",
    "turkey",
    "egg",
    "hog",
    "pig",
    "swine",
    "cow",
    "livestock",
  ];

  for (const { source, value } of allCropStrings()) {
    test(`${source}: "${value}" contains no livestock word`, () => {
      const lower = value.toLowerCase();
      const hits = BANNED.filter((word) => lower.includes(word));
      expect({ source, value, hits }).toEqual({ source, value, hits: [] });
    });
  }
});
