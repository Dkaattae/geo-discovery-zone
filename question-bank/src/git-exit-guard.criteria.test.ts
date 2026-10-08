import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * T-081, written by the `worker`: a guard that keeps every `git` spawn in a
 * `question-bank/src/` test fail-closed. `frontend/src/git-baseline-guard.criteria.test.ts`
 * (T-073) does this for `frontend/src/`; it reads literal argv only, and five
 * files here reach `git` only through a local `git(args)` wrapper, so this
 * guard reads both shapes.
 *
 * **An invocation** is either
 * - **literal**: an array literal whose first element is the string `git`, or
 * - **wrapper**: a call, with an array literal, to a function in the same file
 *   whose body spawns exactly `[<git>, ...<its first parameter>]`.
 *   The literal inside such a function is its definition, not an invocation.
 *
 * Every invocation must:
 * 1. use a subcommand from `ALLOWED_SUBCOMMANDS` (working tree and index only);
 * 2. not be handed a commit, ref, range or sha (`looksLikeRevision`); `diff`
 *    additionally takes no positional argument before `--`, since a bare branch
 *    name is a revision no pattern can see;
 * 3. fail closed on a non-zero exit, in one of these shapes:
 *    - a wrapper that itself throws on a non-zero exit (its callers are then
 *      covered);
 *    - `expect(<call>.status).toBe(<integer>)` (or `.exitCode`, `.toEqual`);
 *    - `const { status } = <call>` / `const proc = <call>`, where the **first**
 *      later use of that status is `if (<status> !== 0) throw` or
 *      `expect(<status>).toBe(<integer>)`.
 *    Anything else — a disjunction, a `=== 0` turned into a boolean, a bare
 *    `return`, a `.stdout` read with no status check — is flagged. The guard
 *    cannot tell which of those happen to fail closed for other reasons, so it
 *    rejects the lot; the fix is always one line.
 *
 * Comments, strings, template text and regex literals are lexed out first, so
 * a `git` command in a doc comment, or `'git(["ls-files"'` inside a string, is
 * not an invocation. Mutation snippets below are built from `G` so that neither
 * this guard nor the frontend one reads them as invocations.
 *
 * Local files only; the one spawn is `git ls-files`, and it throws on failure.
 */

const REPO = join(import.meta.dirname, "../..");
const SCOPE = "question-bank/src";

/** `git`, assembled so the snippets below never contain a literal invocation. */
const G = "gi" + "t";

/** Working tree and index only. `diff` is allowed only without a revision. */
const ALLOWED_SUBCOMMANDS = ["ls-files", "status", "check-ignore", "diff"];

function trackedTestFiles(): string[] {
  const proc = Bun.spawnSync(["git", "ls-files", "-z", "--", SCOPE], { cwd: REPO });
  if (proc.exitCode !== 0) {
    throw new Error(`git ls-files ${SCOPE} exited ${proc.exitCode}: ${proc.stderr.toString()}`);
  }
  return proc.stdout
    .toString()
    .split("\0")
    .filter((path) => path.endsWith(".test.ts"));
}

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// -- lexing --------------------------------------------------------------------

const CODE = 0;
const TEXT = 1; // string, template text or regex literal
const COMMENT = 2;

const REGEX_AFTER_WORDS = new Set([
  "return",
  "typeof",
  "case",
  "in",
  "of",
  "throw",
  "else",
  "void",
  "delete",
  "yield",
  "await",
]);

/**
 * One kind per character of `source`: code, text (string / template text /
 * regex) or comment. A template's `${` and its closing brace are code, so the
 * expression inside is code too.
 */
function lex(source: string): Uint8Array {
  const kinds = new Uint8Array(source.length);
  const templateDepths: number[] = [];
  let braces = 0;
  let lastSignificant = "";
  let lastWord = "";
  let wordOpen = false;
  let index = 0;

  const scanTemplate = (from: number): number => {
    let at = from;
    while (at < source.length) {
      const char = source[at];
      if (char === "\\") {
        kinds[at] = TEXT;
        if (at + 1 < source.length) kinds[at + 1] = TEXT;
        at += 2;
        continue;
      }
      if (char === "`") {
        kinds[at] = TEXT;
        lastSignificant = "`";
        lastWord = "";
        return at + 1;
      }
      if (char === "$" && source[at + 1] === "{") {
        templateDepths.push(braces);
        braces += 1;
        lastSignificant = "{";
        lastWord = "";
        return at + 2;
      }
      kinds[at] = TEXT;
      at += 1;
    }
    return at;
  };

  while (index < source.length) {
    const char = source[index] ?? "";
    const next = source[index + 1];
    if (char === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") kinds[index++] = COMMENT;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      while (index < stop) kinds[index++] = COMMENT;
      continue;
    }
    if (char === '"' || char === "'") {
      kinds[index++] = TEXT;
      while (index < source.length && source[index] !== char && source[index] !== "\n") {
        if (source[index] === "\\") kinds[index++] = TEXT;
        kinds[index++] = TEXT;
      }
      if (index < source.length) kinds[index++] = TEXT;
      lastSignificant = char;
      lastWord = "";
      continue;
    }
    if (char === "`") {
      kinds[index] = TEXT;
      index = scanTemplate(index + 1);
      continue;
    }
    if (
      char === "/" &&
      (lastSignificant === "" ||
        "(,=:[!&|?{};+-*%<>~^".includes(lastSignificant) ||
        REGEX_AFTER_WORDS.has(lastWord))
    ) {
      kinds[index++] = TEXT;
      let inClass = false;
      while (index < source.length && source[index] !== "\n") {
        const at = source[index];
        if (at === "\\") {
          kinds[index++] = TEXT;
          kinds[index++] = TEXT;
          continue;
        }
        kinds[index++] = TEXT;
        if (at === "[") inClass = true;
        else if (at === "]") inClass = false;
        else if (at === "/" && !inClass) break;
      }
      while (index < source.length && /[a-z]/.test(source[index] ?? "")) kinds[index++] = TEXT;
      lastSignificant = "/";
      lastWord = "";
      continue;
    }
    if (char === "{") braces += 1;
    if (char === "}") {
      braces -= 1;
      if (templateDepths.length > 0 && templateDepths[templateDepths.length - 1] === braces) {
        templateDepths.pop();
        index = scanTemplate(index + 1);
        continue;
      }
    }
    if (/\s/.test(char)) {
      wordOpen = false;
      index += 1;
      continue;
    }
    if (/[\w$]/.test(char)) {
      lastWord = wordOpen ? lastWord + char : char;
      wordOpen = true;
    } else {
      lastWord = "";
      wordOpen = false;
    }
    lastSignificant = char;
    index += 1;
  }
  return kinds;
}

/** A lexed file: `code` is `raw` with every text and comment character blanked
 * (newlines kept), so offsets line up and brackets inside strings vanish. */
type Lexed = { raw: string; kinds: Uint8Array; code: string };

function lexed(raw: string): Lexed {
  const kinds = lex(raw);
  let code = "";
  for (let at = 0; at < raw.length; at += 1) {
    const char = raw[at] ?? "";
    code += kinds[at] === CODE || char === "\n" ? char : " ";
  }
  return { raw, kinds, code };
}

// -- argv parsing --------------------------------------------------------------

type Element =
  | { kind: "string"; value: string }
  | { kind: "template"; text: string }
  | { kind: "spread"; name: string }
  | { kind: "expr"; text: string };

/** Index of the bracket closing the one at `open`, read from code only. */
function closeOf(code: string, open: number): number {
  let depth = 0;
  for (let at = open; at < code.length; at += 1) {
    const char = code[at];
    if (char === "(" || char === "[" || char === "{") depth += 1;
    else if (char === ")" || char === "]" || char === "}") {
      depth -= 1;
      if (depth === 0) return at;
    }
  }
  return code.length;
}

function elementsOf(file: Lexed, open: number): { elements: Element[]; close: number } {
  const close = closeOf(file.code, open);
  const ranges: [number, number][] = [];
  let depth = 0;
  let start = open + 1;
  for (let at = open + 1; at < close; at += 1) {
    const char = file.code[at];
    if (char === "(" || char === "[" || char === "{") depth += 1;
    else if (char === ")" || char === "]" || char === "}") depth -= 1;
    else if (char === "," && depth === 0) {
      ranges.push([start, at]);
      start = at + 1;
    }
  }
  ranges.push([start, close]);

  const elements: Element[] = [];
  for (let [from, to] of ranges) {
    while (from < to && (/\s/.test(file.raw[from] ?? "") || file.kinds[from] === COMMENT)) from++;
    while (to > from && (/\s/.test(file.raw[to - 1] ?? "") || file.kinds[to - 1] === COMMENT)) to--;
    if (from === to) continue;
    const text = file.raw.slice(from, to);
    const quote = text[0] ?? "";
    let allText = true;
    for (let at = from; at < to; at += 1) if (file.kinds[at] !== TEXT) allText = false;
    if (text.startsWith("...")) elements.push({ kind: "spread", name: text.slice(3).trim() });
    else if (allText && `"'\``.includes(quote) && text.endsWith(quote) && text.length >= 2)
      elements.push({ kind: "string", value: text.slice(1, -1) });
    else if (quote === "`") elements.push({ kind: "template", text });
    else elements.push({ kind: "expr", text });
  }
  return { elements, close };
}

// -- invocations ---------------------------------------------------------------

/** One `git` spawn: `args` is everything after `git`. `start`/`end` bound the
 * whole call expression; the exit check reads around it. */
type Invocation = {
  file: string;
  line: number;
  shape: "literal" | "wrapper";
  args: Element[];
  start: number;
  end: number;
  snippet: string;
  /** The lexed file, for the exit check. */
  source: Lexed;
  /** Called through a wrapper that throws on a non-zero exit itself. */
  throughThrowingWrapper: boolean;
};

type Wrapper = { name: string; throws: boolean };

const lineAt = (raw: string, at: number) => raw.slice(0, at).split("\n").length;

/** The call that `open` (an argv `[`) is the first argument of, if any. */
function callAround(code: string, open: number): { start: number; end: number } {
  const before = /([\w$][\w$.]*)\s*\(\s*$/.exec(code.slice(Math.max(0, open - 200), open));
  if (!before) return { start: open, end: closeOf(code, open) + 1 };
  const start = open - before[0].length;
  const paren = code.indexOf("(", start);
  return { start, end: closeOf(code, paren) + 1 };
}

/** The function, if any, whose first parameter `[git, ...param]` spreads. */
function enclosingFunction(code: string, at: number): { name: string; param: string } | undefined {
  const pattern =
    /function\s+([\w$]+)\s*(?:<[^>]*>)?\s*\(\s*([\w$]+)|(?:const|let)\s+([\w$]+)\s*=\s*(?:async\s*)?\(\s*([\w$]+)/g;
  let last: RegExpExecArray | undefined;
  for (const match of code.slice(0, at).matchAll(pattern)) last = match;
  if (!last) return undefined;
  const name = last[1] ?? last[3];
  const param = last[2] ?? last[4];
  return name && param ? { name, param } : undefined;
}

const isGit = (element: Element | undefined) =>
  element?.kind === "string" && element.value === "git";

/** Every invocation in one file, plus the wrappers it defines. */
function scan(path: string, raw: string): { invocations: Invocation[]; wrappers: Wrapper[] } {
  const file = lexed(raw);
  const invocations: Invocation[] = [];
  const wrappers: Wrapper[] = [];

  for (let open = file.code.indexOf("["); open !== -1; open = file.code.indexOf("[", open + 1)) {
    const { elements } = elementsOf(file, open);
    if (!isGit(elements[0])) continue;
    const args = elements.slice(1);
    const { start, end } = callAround(file.code, open);
    const only = args[0];
    const fn = enclosingFunction(file.code, open);
    if (args.length === 1 && only?.kind === "spread" && fn && only.name === fn.param) {
      wrappers.push({ name: fn.name, throws: exitProblem(file, start, end) === undefined });
      continue;
    }
    invocations.push({
      file: path,
      line: lineAt(raw, open),
      shape: "literal",
      args,
      start,
      end,
      snippet: raw.slice(start, end).replace(/\s+/g, " "),
      source: file,
      throughThrowingWrapper: false,
    });
  }

  for (const wrapper of wrappers) {
    const callPattern = new RegExp(`(?<![\\w$.])${escaped(wrapper.name)}\\s*\\(`, "g");
    for (const match of file.code.matchAll(callPattern)) {
      const start = match.index ?? 0;
      if (/(?:function|const|let|var)\s+$/.test(file.code.slice(Math.max(0, start - 20), start)))
        continue;
      const paren = start + match[0].length - 1;
      const end = closeOf(file.code, paren) + 1;
      const firstArg = file.code.slice(paren + 1).search(/\S/) + paren + 1;
      const args: Element[] =
        file.code[firstArg] === "["
          ? elementsOf(file, firstArg).elements
          : [{ kind: "expr", text: raw.slice(paren + 1, end - 1).trim() }];
      invocations.push({
        file: path,
        line: lineAt(raw, start),
        shape: "wrapper",
        args,
        start,
        end,
        snippet: raw.slice(start, end).replace(/\s+/g, " "),
        source: file,
        throughThrowingWrapper: wrapper.throws,
      });
    }
  }
  return { invocations, wrappers };
}

// -- the three rules ---------------------------------------------------------

/** A commit, ref, range, reflog entry or sha, or an option that takes one. */
const looksLikeRevision = (arg: string) =>
  /HEAD/.test(arg) ||
  /\b(?:origin|upstream|refs)\//.test(arg) ||
  /\w\.\.\.?\w/.test(arg) ||
  /@\{/.test(arg) ||
  /[\w}][~^]\d*(?![\w-])/.test(arg) ||
  /\b[0-9a-f]{7,40}\b/.test(arg) ||
  /^--(?:with-tree|merge-base|since|until)\b/.test(arg);

function subcommandProblem(invocation: Invocation): string | undefined {
  const first = invocation.args[0];
  if (invocation.shape === "wrapper" && first?.kind === "expr")
    return "wrapper called without an array literal";
  if (first?.kind !== "string") return "subcommand is not a string literal";
  if (!ALLOWED_SUBCOMMANDS.includes(first.value))
    return `subcommand \`${first.value}\` is not allowed`;
  return undefined;
}

function revisionProblem(invocation: Invocation): string | undefined {
  const texts = invocation.args.flatMap((element) =>
    element.kind === "string" ? [element.value] : element.kind === "template" ? [element.text] : [],
  );
  const revision = texts.find(looksLikeRevision);
  if (revision !== undefined) return `handed a revision: \`${revision}\``;
  const first = invocation.args[0];
  if (first?.kind === "string" && first.value === "diff") {
    const rest = invocation.args.slice(1);
    const dashes = rest.findIndex((element) => element.kind === "string" && element.value === "--");
    const beforeDashes = dashes === -1 ? rest : rest.slice(0, dashes);
    const positional = beforeDashes.find(
      (element) => element.kind !== "string" || !element.value.startsWith("-"),
    );
    if (positional) return "`diff` with an argument before `--` (a revision no pattern can read)";
  }
  return undefined;
}

const CHECK_AFTER_EXPECT = /^\s*,?\s*\)\s*\.\s*(?:toBe|toEqual|toStrictEqual)\(\s*-?\d+\s*,?\s*\)/;
const CHECK_AFTER_IF = /^\s*!==?\s*0\s*\)\s*\{?\s*throw\b/;

/** Why the call spanning `start`..`end` is not fail-closed, or `undefined`. */
function exitProblem(file: Lexed, start: number, end: number): string | undefined {
  const before = file.code.slice(Math.max(0, start - 200), start);
  const after = file.code.slice(end);

  if (/expect\(\s*$/.test(before)) {
    const inline = /^\s*\.\s*(?:status|exitCode)\b/.exec(after);
    if (inline && CHECK_AFTER_EXPECT.test(after.slice(inline[0].length))) return undefined;
    return "asserted, but not as `expect(<call>.status).toBe(<integer>)`";
  }

  const binding = /(?:const|let|var)\s+(\{[^{}]*\}|[\w$]+)\s*=\s*$/.exec(before);
  if (!binding) return "exit status is used inline without an exact check";
  const target = binding[1] ?? "";
  let reference: RegExp;
  if (target.startsWith("{")) {
    const local = target
      .slice(1, -1)
      .split(",")
      .map((entry) => entry.split(":").map((part) => part.trim()))
      .find(([key]) => key === "status" || key === "exitCode");
    if (!local) return "destructured without its exit status";
    reference = new RegExp(`(?<![\\w$.])${escaped(local[1] ?? local[0] ?? "")}(?![\\w$])`);
  } else {
    reference = new RegExp(
      `(?<![\\w$.])${escaped(target)}\\s*\\.\\s*(?:status|exitCode)(?![\\w$])`,
    );
  }
  const use = reference.exec(after);
  if (!use) return "exit status is never checked";
  const at = end + use.index;
  const lead = file.code.slice(Math.max(0, at - 40), at);
  const rest = file.code.slice(at + use[0].length);
  if (/if\s*\(\s*$/.test(lead) && CHECK_AFTER_IF.test(rest)) return undefined;
  if (/expect\(\s*$/.test(lead) && CHECK_AFTER_EXPECT.test(rest)) return undefined;
  const shown = file.code
    .slice(Math.max(0, at - 20), at + 60)
    .replace(/\s+/g, " ")
    .trim();
  return `first use of the exit status is not \`if (… !== 0) throw\` or \`expect(…).toBe(n)\`: \`${shown}\``;
}

function exitProblemOf(invocation: Invocation): string | undefined {
  if (invocation.throughThrowingWrapper) return undefined;
  return exitProblem(invocation.source, invocation.start, invocation.end);
}

const RULES = [subcommandProblem, revisionProblem, exitProblemOf];

const report = (invocation: Invocation, problem: string) =>
  `${invocation.file}:${invocation.line}: ${problem} — ${invocation.snippet}`;

/** Every invocation that breaks `rule`, as `file:line: problem — snippet`. */
const offenders = (invocations: Invocation[], rule: (i: Invocation) => string | undefined) =>
  invocations.flatMap((invocation) => {
    const problem = rule(invocation);
    return problem === undefined ? [] : [report(invocation, problem)];
  });

/** Every problem in one source, as `file:line: problem — snippet`. */
function offendersIn(path: string, raw: string): string[] {
  const { invocations } = scan(path, raw);
  return RULES.flatMap((rule) => offenders(invocations, rule));
}

// -- the guard, on the real tree -----------------------------------------------

const FILES = trackedTestFiles();
const SCANS = FILES.map((path) => ({
  path,
  ...scan(path, readFileSync(join(REPO, path), "utf8")),
}));
const INVOCATIONS = SCANS.flatMap((s) => s.invocations);

describe("T-081 criterion 11 — the scan cannot pass vacuously", () => {
  test("it reads the tracked test files under question-bank/src", () => {
    expect(FILES.length).toBeGreaterThan(20);
    expect(FILES).toContain("question-bank/src/git-exit-guard.criteria.test.ts");
  });

  test("it finds git invocations under question-bank/src", () => {
    expect(INVOCATIONS.length).toBeGreaterThan(0);
  });

  // Both reach git only through a wrapper; finding none here means the
  // wrapper reading broke, not that the files are clean.
  for (const file of ["fun-facts.test.ts", "committed-bank.test.ts"]) {
    test(`it finds wrapper invocations in ${file}`, () => {
      const found = INVOCATIONS.filter((i) => i.file === `${SCOPE}/${file}`);
      expect(found.length).toBeGreaterThan(0);
      expect(found.every((i) => i.shape === "wrapper")).toBe(true);
    });
  }
});

describe("T-081 criteria 3–8 — every git invocation under question-bank/src is fail-closed", () => {
  test("every invocation uses a working-tree subcommand", () => {
    expect(offenders(INVOCATIONS, subcommandProblem)).toEqual([]);
  });

  test("no invocation is handed a revision", () => {
    expect(offenders(INVOCATIONS, revisionProblem)).toEqual([]);
  });

  test("every invocation fails when git exits with a status it does not expect", () => {
    expect(offenders(INVOCATIONS, exitProblemOf)).toEqual([]);
  });
});

describe("T-081 criterion 16 — the guard passes its own scan", () => {
  test("its one git spawn is found, allowed, and throws on failure", () => {
    const own = INVOCATIONS.filter((i) => i.file === `${SCOPE}/git-exit-guard.criteria.test.ts`);
    expect(own).toHaveLength(1);
    expect(RULES.flatMap((rule) => offenders(own, rule))).toEqual([]);
  });
});

// -- the guard, on the brief's mutations ---------------------------------------
//
// The tester's mutations (criteria 4–8) paste these into a real file. These
// run the same scan on a synthetic source, so a regression in the reader shows
// up without anyone pasting anything.

const STATUS_WRAPPER = `function ${G}(args: string[]) {
  const proc = Bun.spawnSync(["${G}", ...args], { cwd: REPO });
  return { status: proc.exitCode, stdout: proc.stdout.toString() };
}
`;

const THROWING_WRAPPER = `function ${G}(args: string[]): string {
  const proc = Bun.spawnSync(["${G}", ...args], { cwd: REPO });
  if (proc.exitCode !== 0) throw new Error(\`${G} exited \${proc.exitCode}\`);
  return proc.stdout.toString();
}
`;

const flags = (body: string, wrapper = STATUS_WRAPPER) => offendersIn("x.test.ts", wrapper + body);

describe("T-081 criteria 4–8 — the guard rejects the brief's mutations", () => {
  test("criterion 4: a literal invocation of a history subcommand", () => {
    const found = flags(`const proc = Bun.spawnSync(["${G}", "rev-parse", "HEAD"]);
if (proc.exitCode !== 0) throw new Error("x");`);
    expect(found.join("\n")).toContain("x.test.ts:");
    expect(found.join("\n")).toContain("`rev-parse` is not allowed");
  });

  for (const sub of [
    "show",
    "log",
    "rev-parse",
    "rev-list",
    "merge-base",
    "cat-file",
    "blame",
    "describe",
    "for-each-ref",
  ]) {
    test(`criterion 4: a wrapper invocation of \`${sub}\``, () => {
      expect(flags(`expect(${G}(["${sub}", "-1"]).status).toBe(0);`, THROWING_WRAPPER)).toEqual([
        expect.stringContaining(`\`${sub}\` is not allowed`),
      ]);
    });
  }

  test("criterion 4: the brief's wrapper mutation, a bare log call", () => {
    expect(flags(`${G}(["log", "-1"]);`).join("\n")).toContain("`log` is not allowed");
  });

  test("criterion 5: diff handed a range", () => {
    const found = flags(
      `expect(${G}(["diff", "--name-only", "origin/main...HEAD"]).status).toBe(0);`,
    );
    expect(found.join("\n")).toContain("handed a revision");
  });

  test("criterion 5: ls-files handed --with-tree", () => {
    const found = flags(`const proc = Bun.spawnSync(["${G}", "ls-files", "--with-tree=HEAD~1"]);
expect(proc.exitCode).toBe(0);`);
    expect(found.join("\n")).toContain("handed a revision");
  });

  for (const sha of ["323254c", "0123456789abcdef0123456789abcdef01234567"]) {
    test(`criterion 5: an argument containing the sha ${sha}`, () => {
      const found = flags(`expect(${G}(["ls-files", "${sha}:question-bank"]).status).toBe(0);`);
      expect(found.join("\n")).toContain("handed a revision");
    });
  }

  test("criterion 5: diff with a bare branch name before --", () => {
    const found = flags(`expect(${G}(["diff", "--name-only", "main", "--", "x"]).status).toBe(0);`);
    expect(found.join("\n")).toContain("`diff` with an argument before `--`");
  });

  test("criterion 6: the disjunction from climate-kid.test.ts:598", () => {
    const found =
      flags(`const { status, stdout } = ${G}(["diff", "--name-only", "--", "question-bank/sample-data"]);
expect(status === 0 || status === 1).toBe(true);
expect(stdout).not.toContain("us-state-co.json");`);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("first use of the exit status");
  });

  test("criterion 7: a bare return on a non-zero exit after a literal invocation", () => {
    const found = flags(`const proc = Bun.spawnSync(["${G}", "ls-files"]);
if (proc.exitCode !== 0) return;`);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("first use of the exit status");
  });

  test("criterion 8: the status turned into a boolean, from fun-facts.test.ts:388", () => {
    const found = flags(`expect({
  path,
  ignored: ${G}(["check-ignore", "--no-index", "-q", path]).status === 0,
}).toEqual({ path, ignored: false });`);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("exit status is used inline");
  });

  test("a .stdout read with no status check", () => {
    const found = flags(`const matches = ${G}(["ls-files", "--", file]).stdout.split("\\n");`);
    expect(found).toHaveLength(1);
  });

  test("an asserted exit status that is not exact", () => {
    expect(flags(`expect(${G}(["ls-files"]).status).not.toBe(128);`)).toHaveLength(1);
  });
});

describe("T-081 criteria 9–10 — the guard accepts every fail-closed shape", () => {
  test("a wrapper that throws, and calls through it", () => {
    expect(flags(`const names = ${G}(["ls-files", "x"]).split("\\n");`, THROWING_WRAPPER)).toEqual(
      [],
    );
  });

  test("a destructured status followed by if (status !== 0) throw", () => {
    expect(
      flags(`function trackedUnder(path: string): string[] {
  const { status, stdout } = ${G}(["ls-files", path]);
  if (status !== 0) throw new Error(\`${G} ls-files \${path} exited \${status}\`);
  return stdout.split("\\n");
}`),
    ).toEqual([]);
  });

  test("expect(<call>.status).toBe(0) and .toBe(1), including across lines", () => {
    expect(
      flags(`expect(${G}(["check-ignore", "--no-index", "-q", path]).status).toBe(1);
expect(${G}(["check-ignore", "-q", "question-bank/data/subset/us-state-co.json"]).status).toBe(
  0,
);
expect(
  ${G}(["check-ignore", "-q", "question-bank/data/us-states/anything.review.json"]).status,
).toBe(0);`),
    ).toEqual([]);
  });

  test("a destructured status followed by expect(status).toBe(0)", () => {
    expect(
      flags(`const { status, stdout } = ${G}(["diff", "--name-only", "--", "question-bank/sample-data"]);
expect(status).toBe(0);
expect(stdout).not.toContain("us-state-co.json");`),
    ).toEqual([]);
  });

  test("expect(proc.exitCode).toBe(0) after a literal invocation", () => {
    expect(
      flags(`const proc = Bun.spawnSync(["${G}", "ls-files"], { cwd: REPO });
expect(proc.exitCode).toBe(0);`),
    ).toEqual([]);
  });

  test("a literal with a readable subcommand and a spread of paths, throwing", () => {
    expect(
      flags(`const proc = Bun.spawnSync(["${G}", "ls-files", "-z", "--", ...paths], { cwd: REPO });
if (proc.exitCode !== 0) throw new Error("x");`),
    ).toEqual([]);
  });

  test("criterion 10: git written in a comment, a string or a regex is not an invocation", () => {
    const source = `/**
 * Reads \`${G} show 323254c:<path>\` — and Bun.spawnSync(["${G}", "log"]) in prose.
 */
// ${G}(["log", "-1"]);
const quoted = '${G}(["ls-files"';
const pattern = /\\[\\s*["'\`]${G}["'\`]/;
`;
    expect(scan("x.test.ts", STATUS_WRAPPER + source).invocations).toEqual([]);
  });

  test("an invocation inside a template expression is still read", () => {
    const found = flags(`const text = \`\${${G}(["log"]).stdout}\`;`);
    expect(found.join("\n")).toContain("`log` is not allowed");
  });
});
