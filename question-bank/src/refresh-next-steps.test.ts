import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { US_STATES_ELEVATION_QUERY } from "./queries/us-states-elevation";
import {
  CONTENT_COMMAND,
  EXIT_CHANGED,
  EXIT_FAILED,
  EXIT_UNCHANGED,
  QUESTIONS_COMMAND,
  refreshBank,
} from "./refresh";
import type { SparqlResults, SparqlTransport } from "./sparql";

/**
 * T-087 (worker). A changed refresh prints the two regenerate commands, in
 * order, after the change summary; no other outcome prints them; and it never
 * runs them. Offline: the committed fixture is replayed through
 * `SparqlTransport`, against temp copies of the bank and fixture.
 */
const PKG = resolve(import.meta.dirname, "..");
const REPO = resolve(PKG, "..");
const BANK = join(PKG, "data/us-states");
const FIXTURE = join(PKG, "src/fixtures/us-states.sparql.json");
const ELEVATION_FIXTURE = join(PKG, "src/fixtures/us-states-elevation.sparql.json");
const QUESTION_FILE = join(PKG, "data/questions/us-states.json");
const SERVED_BANK = join(REPO, "backend/app/data/content.json");

let work: string;
let bankDir: string;
let fixturePath: string;
let stdout: string[];
let stderr: string[];

function liveResponse(): SparqlResults {
  const { _fixture: _drop, ...rest } = JSON.parse(
    readFileSync(FIXTURE, "utf8"),
  ) as SparqlResults & {
    _fixture: unknown;
  };
  return rest;
}

const transportOf =
  (response: unknown): SparqlTransport =>
  async (query) =>
    query === US_STATES_ELEVATION_QUERY
      ? (JSON.parse(readFileSync(ELEVATION_FIXTURE, "utf8")) as SparqlResults)
      : (response as SparqlResults);

function changedResponse(): SparqlResults {
  const response = liveResponse();
  const co = response.results.bindings.find((b) => b["stateLabel"]?.value === "Colorado");
  if (!co?.["population"]) throw new Error("fixture has no Colorado population");
  co["population"] = { ...co["population"], value: "5900001" };
  return response;
}

const run = (sparql: SparqlTransport) =>
  refreshBank({
    bankDir,
    fixturePath,
    sparql,
    now: () => new Date("2026-10-30T00:00:00Z"),
    out: (line) => stdout.push(line),
    err: (line) => stderr.push(line),
  });

const mentionsEither = (lines: string[]) =>
  lines.some((line) => line.includes(QUESTIONS_COMMAND) || line.includes(CONTENT_COMMAND));

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "question-bank-next-steps-"));
  bankDir = join(work, "bank");
  fixturePath = join(work, "fixture.sparql.json");
  cpSync(BANK, bankDir, { recursive: true });
  cpSync(FIXTURE, fixturePath);
  stdout = [];
  stderr = [];
});

afterEach(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("T-087 — a changed refresh says what to run next", () => {
  test("the commands are the brief's exact text", () => {
    expect(QUESTIONS_COMMAND).toBe("cd question-bank && bun run questions");
    expect(CONTENT_COMMAND).toBe("make -C backend content");
  });

  test("both commands on stdout, question first, after the summary line; neither on stderr", async () => {
    expect(await run(transportOf(changedResponse()))).toBe(EXIT_CHANGED);

    const summary = stdout.findIndex((line) => line.startsWith("bank changed ("));
    const questions = stdout.findIndex((line) => line.includes(QUESTIONS_COMMAND));
    const content = stdout.findIndex((line) => line.includes(CONTENT_COMMAND));
    expect(summary).toBeGreaterThanOrEqual(0);
    expect(questions).toBeGreaterThan(summary);
    expect(content).toBeGreaterThan(questions);
    expect(mentionsEither(stderr)).toBe(false);
  });

  test("no reminder line starts `  us-state-`, so the change-line count holds", async () => {
    await run(transportOf(changedResponse()));
    const reminder = stdout.filter(
      (line) => line.includes(QUESTIONS_COMMAND) || line.includes(CONTENT_COMMAND),
    );
    expect(reminder).toHaveLength(2);
    for (const line of reminder) expect(line.startsWith("  us-state-")).toBe(false);
  });

  test("it does not run either command: question file and served bank keep their bytes", async () => {
    const questionsBefore = readFileSync(QUESTION_FILE);
    const servedBefore = readFileSync(SERVED_BANK);
    expect(await run(transportOf(changedResponse()))).toBe(EXIT_CHANGED);
    expect(readFileSync(QUESTION_FILE).equals(questionsBefore)).toBe(true);
    expect(readFileSync(SERVED_BANK).equals(servedBefore)).toBe(true);
  });
});

describe("T-087 — no other outcome prints the commands", () => {
  test("exit 2, bank unchanged", async () => {
    expect(await run(transportOf(liveResponse()))).toBe(EXIT_UNCHANGED);
    expect(mentionsEither([...stdout, ...stderr])).toBe(false);
  });

  test("exit 1, the transport fails", async () => {
    const failing: SparqlTransport = async () => {
      throw new Error("connection reset");
    };
    expect(await run(failing)).toBe(EXIT_FAILED);
    expect(mentionsEither([...stdout, ...stderr])).toBe(false);
  });

  test("exit 1, the response has no results.bindings array", async () => {
    expect(await run(transportOf({ head: { vars: [] }, results: {} }))).toBe(EXIT_FAILED);
    expect(mentionsEither([...stdout, ...stderr])).toBe(false);
  });

  test("exit 1, fewer than 50 states match", async () => {
    const response = liveResponse();
    response.results.bindings = response.results.bindings.filter(
      (b) => b["stateLabel"]?.value !== "Colorado",
    );
    expect(await run(transportOf(response))).toBe(EXIT_FAILED);
    expect(stderr.join("\n")).toContain("49/50");
    expect(mentionsEither([...stdout, ...stderr])).toBe(false);
  });
});
