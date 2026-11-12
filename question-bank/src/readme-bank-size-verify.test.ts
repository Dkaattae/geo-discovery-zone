/**
 * T-108 tester: one test (or more) per acceptance criterion of
 * `tasks/T-108-readme-bank-size.md`.
 *
 * Criteria 1-10 read the committed `README.md`. Criteria 11-13 are verified by
 * `git diff 8092372 -- README.md` and per-commit `git show --stat`, recorded in
 * the brief's Verdict, not by a committed digest pin (the criteria say so;
 * P-17). Criterion 14 is the full-suite run, also recorded in the Verdict.
 *
 * Pure: one committed file read from disk. No spawn, no network.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const README = readFileSync(join(REPO_ROOT, "README.md"), "utf8");
const LINES = README.split("\n");

const UNITS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
  "hundred",
  "thousand",
  "million",
  "billion",
];

/**
 * The brief's "a number": a digit token (`415`, `1,204`) or a spelled-out
 * cardinal (`fifteen`, `twenty-six`). Ordinals are not numbers.
 */
function isNumber(word: string): boolean {
  if (/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(word)) return true;
  const parts = word.toLowerCase().split("-");
  return parts.length > 0 && parts.every((p) => UNITS.includes(p));
}

/**
 * The brief's "a sentence": ends at `.`, `!` or `?` followed by whitespace or
 * end of text, or at a blank line.
 */
function sentences(text: string): string[] {
  return text
    .split(/\n[ \t]*\n/)
    .flatMap((para) => para.split(/(?<=[.!?])(?=\s|$)/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Words of a sentence: digit tokens and letter runs, hyphenated words kept whole. */
function words(sentence: string): string[] {
  return sentence.match(/\d+(?:,\d{3})*(?:\.\d+)?|[A-Za-z]+(?:-[A-Za-z]+)*/g) ?? [];
}

/**
 * Every number among the five words immediately before a word matching
 * `target`. A hyphenated compound (`question-bank`, `US-states`) also counts as
 * the word when one of its parts matches, so the scan errs towards catching.
 */
function numbersBefore(text: string, target: RegExp): string[] {
  const found: string[] = [];
  for (const s of sentences(text)) {
    const ws = words(s);
    ws.forEach((w, i) => {
      const hit = target.test(w) || w.split("-").some((p) => target.test(p));
      if (!hit) return;
      for (const prev of ws.slice(Math.max(0, i - 5), i)) {
        if (isNumber(prev)) found.push(prev);
      }
    });
  }
  return found;
}

/** The lines after `## Tech stack` and before the next line starting `## `. */
function techStackSection(): string[] {
  const heading = LINES.indexOf("## Tech stack");
  expect(heading).toBeGreaterThanOrEqual(0);
  const next = LINES.findIndex((l, i) => i > heading && l.startsWith("## "));
  return LINES.slice(heading + 1, next === -1 ? LINES.length : next);
}

/** Non-table paragraphs of the Tech stack section, as arrays of lines. */
function techStackProseParagraphs(): string[][] {
  const paras: string[][] = [];
  let cur: string[] = [];
  for (const l of techStackSection()) {
    if (l.trim() === "") {
      if (cur.length) paras.push(cur);
      cur = [];
    } else {
      cur.push(l);
    }
  }
  if (cur.length) paras.push(cur);
  return paras.filter((p) => !p.every((l) => l.startsWith("|")));
}

/** The lines strictly inside the first fenced code block after `## Layout`. */
function layoutBlock(): string[] {
  const heading = LINES.indexOf("## Layout");
  expect(heading).toBeGreaterThanOrEqual(0);
  const open = LINES.findIndex((l, i) => i > heading && l.startsWith("```"));
  const close = LINES.findIndex((l, i) => i > open && l.startsWith("```"));
  expect(open).toBeGreaterThan(heading);
  expect(close).toBeGreaterThan(open);
  return LINES.slice(open + 1, close);
}

describe("T-108 helpers — the scanners catch what the criteria forbid", () => {
  test("isNumber: digits, grouped digits and cardinal words; not ordinals or other words", () => {
    for (const w of ["415", "1,204", "15", "fifteen", "twenty-six", "fifty", "hundred", "one"]) {
      expect(isNumber(w)).toBe(true);
    }
    for (const w of ["first", "US", "states", "only", "none", "once"]) {
      expect(isNumber(w)).toBe(false);
    }
  });

  test("numbersBefore finds the base paragraph's counts and ignores numbers after the word", () => {
    const base =
      "Only a US-states bank ships today: **15 states, 26 questions**, with\nhuman-written and reviewed explanations.";
    expect(numbersBefore(base, /^questions?$/i)).toContain("26");
    expect(numbersBefore(base, /^states?$/i)).toContain("15");
    expect(numbersBefore("Some twenty-six questions here.", /^questions?$/i)).toEqual([
      "twenty-six",
    ]);
    expect(numbersBefore("Questions arrive at 5, 10 and 20.", /^questions?$/i)).toEqual([]);
    expect(numbersBefore("We have 7 things. Questions are fun.", /^questions?$/i)).toEqual([]);
  });

  test("sentences splits at blank lines and at end punctuation followed by whitespace", () => {
    expect(sentences("A b. C d!\n\nE f? g")).toEqual(["A b.", "C d!", "E f?", "g"]);
    expect(sentences("v1.2 stays whole.")).toEqual(["v1.2 stays whole."]);
  });
});

describe("T-108 criterion 1 — no stale size", () => {
  test("no line of README.md contains '15 states' (any case, any whitespace)", () => {
    expect(LINES.filter((l) => /15\s+states/i.test(l))).toEqual([]);
  });

  test("no line of README.md contains '26 questions' (any case, any whitespace)", () => {
    expect(LINES.filter((l) => /26\s+questions/i.test(l))).toEqual([]);
  });
});

describe("T-108 criterion 2 — no question count anywhere in README.md", () => {
  test("no number among the five words before 'question' or 'questions' in any sentence", () => {
    expect(numbersBefore(README, /^questions?$/i)).toEqual([]);
  });

  test("line 16-17's 'at 5, 10 and 20' (number after the word) is still there, unchanged", () => {
    expect(README).toMatch(/at 5, 10 and 20/);
  });
});

describe("T-108 criterion 3 — a state count, if stated, is 50", () => {
  test("every number among the five words before 'state' or 'states' is 50 or fifty", () => {
    const nums = numbersBefore(README, /^states?$/i);
    for (const n of nums) expect(["50", "fifty"]).toContain(n.toLowerCase());
  });
});

describe("T-108 criterion 4 — no claim about explanations in the Tech stack section", () => {
  test("no Tech stack line contains 'explanation' (any case)", () => {
    expect(techStackSection().filter((l) => /explanation/i.test(l))).toEqual([]);
  });

  test("no Tech stack line contains 'human-written' (any case)", () => {
    expect(techStackSection().filter((l) => /human-written/i.test(l))).toEqual([]);
  });
});

describe("T-108 criterion 5 — no 'human-written' anywhere in README.md", () => {
  test("README.md has no 'human-written' in any case", () => {
    expect(README).not.toMatch(/human-written/i);
  });
});

describe("T-108 criterion 6 — the paragraph still says what ships", () => {
  test("a non-table Tech stack sentence contains 'US', 'states' and 'only'", () => {
    const prose = techStackSection()
      .filter((l) => !l.startsWith("|"))
      .join("\n");
    const ok = sentences(prose).filter(
      (s) => /(?<![A-Za-z])US(?![A-Za-z])/.test(s) && /states/i.test(s) && /\bonly\b/i.test(s),
    );
    expect(ok.length).toBeGreaterThanOrEqual(1);
  });
});

describe("T-108 criterion 7 — the bank paragraph is one paragraph of one to four lines, in place", () => {
  test("after the 'The backend serves the API' paragraph: one blank, 1-4 lines, one blank, then the Docker heading", () => {
    const start = LINES.findIndex((l) => l.startsWith("The backend serves the API"));
    expect(start).toBeGreaterThanOrEqual(0);
    let i = start;
    while (LINES[i]?.trim() !== "") i++;
    // exactly one blank line before the bank paragraph
    expect(LINES[i]?.trim()).toBe("");
    expect(LINES[i + 1]?.trim()).not.toBe("");
    const paraStart = i + 1;
    let j = paraStart;
    while (LINES[j] !== undefined && LINES[j]?.trim() !== "") j++;
    const length = j - paraStart;
    expect(length).toBeGreaterThanOrEqual(1);
    expect(length).toBeLessThanOrEqual(4);
    // exactly one blank line after, then the heading
    expect(LINES[j]?.trim()).toBe("");
    expect(LINES[j + 1]).toBe("## Run it locally with Docker");
  });

  test("the Tech stack section has exactly two prose paragraphs, as at base: backend, then the bank", () => {
    const paras = techStackProseParagraphs();
    expect(paras).toHaveLength(2);
    expect(paras[0]?.[0]).toStartWith("The backend serves the API");
  });
});

describe("T-108 criterion 8 — the Tech stack row names engineering-decisions.md", () => {
  const rows = (): string[] => techStackSection().filter((l) => l.startsWith("| `openapi.yaml` |"));

  test("exactly one Tech stack row starts '| `openapi.yaml` |'", () => {
    expect(rows()).toHaveLength(1);
  });

  test("the row contains 'engineering-decisions.md'", () => {
    expect(rows()[0]).toContain("engineering-decisions.md");
  });

  test("the row contains E-14 as a whole word", () => {
    expect(rows()[0]).toMatch(/\bE-14\b/);
  });

  test("the row still contains 'follows the backend'", () => {
    expect(rows()[0]).toContain("follows the backend");
  });

  test("the row contains no 'contract' in any case", () => {
    expect(rows()[0]).not.toMatch(/contract/i);
  });
});

describe("T-108 criterion 9 — the Layout line names engineering-decisions.md", () => {
  const matches = (): string[] => layoutBlock().filter((l) => /^openapi\.yaml\s/.test(l));

  test("the Layout block has exactly one /^openapi\\.yaml\\s/ line", () => {
    expect(matches()).toHaveLength(1);
  });

  test("the line contains 'engineering-decisions.md'", () => {
    expect(matches()[0]).toContain("engineering-decisions.md");
  });

  test("the line contains E-14 as a whole word", () => {
    expect(matches()[0]).toMatch(/\bE-14\b/);
  });

  test("the line still contains 'follows the backend'", () => {
    expect(matches()[0]).toContain("follows the backend");
  });

  test("the line contains no 'contract' in any case", () => {
    expect(matches()[0]).not.toMatch(/contract/i);
  });

  test("its description starts at column 21 (1-based)", () => {
    const line = matches()[0] ?? "";
    expect(line.slice(0, 20)).toMatch(/^openapi\.yaml\s+$/);
    expect(line.charAt(20)).not.toMatch(/\s/);
  });
});

describe("T-108 criterion 10 — no 'contract' anywhere in README.md", () => {
  test("README.md has no 'contract' in any case", () => {
    expect(README).not.toMatch(/contract/i);
  });
});
