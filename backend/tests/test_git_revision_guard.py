"""T-098, written by the `worker`: no backend test may hand `git` a revision.

A test that resolves a fixed commit, ref, range or merge base fails in CI's
shallow clone and goes red on `main` after the next merge (E-11, E-12). T-053's
tester wrote six of them; commit ce1cf88 deleted them. The frontend and
question-bank suites already refuse these. This is the same guard for
`backend/tests/` and `backend/integration/`.

**An invocation** is, read from the syntax tree (so `#` comments and docstrings
are never invocations):

- a list or tuple literal whose first element is the string `git`; or
- a call to a `subprocess` function (`subprocess.run`, an alias, or a name
  imported from it) whose command is a string, or f-string, that starts `git`.

**Every invocation must use an allowed subcommand** (`ALLOWED_SUBCOMMANDS`:
working tree and index only). Global options before the subcommand (`-C <dir>`,
`-c <k=v>`, `--no-pager`, ...) are skipped, so `-C` in front of `ls-files` is
fine and `-C` in front of `diff` is not. `diff`, `show`, `log`, `merge-base`,
`rev-parse` and every other subcommand are refused outright: an allowlist is
the only rule that also catches a revision held in a variable (T-053's `BASE`),
which no pattern on the argument can see. A subcommand the guard cannot read (a
variable it cannot resolve to a string, a spread) is refused too.

**Arguments to an allowed subcommand** may still not look like a revision
(`looks_like_revision`), and `ls-files --with-tree` is refused.

It never skips: it fails if listing files fails, or if either directory yields
no `.py` file. It reads git-tracked files plus untracked, not-ignored ones, so a
test written but not yet committed is checked too. The only `git` it runs is
`ls-files`. Sample invocations below are strings, which the guard does not read
as invocations; this file is scanned like any other.
"""

from __future__ import annotations

import ast
import re
import shlex
import subprocess
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
SCOPES = ("backend/tests", "backend/integration")

#: Working tree and index only. Anything else is refused.
ALLOWED_SUBCOMMANDS = frozenset({"ls-files", "status", "check-ignore"})

#: Global options that take the next argument as their value.
OPTIONS_WITH_VALUE = frozenset(
    {"-C", "-c", "--git-dir", "--work-tree", "--namespace", "--super-prefix", "--config-env"}
)

#: Shell words after which a new command starts.
SHELL_SEPARATORS = frozenset({"&&", "||", ";", "|"})

#: An argument this guard cannot read: a call, a spread, an unresolved name.
OPAQUE = None


def looks_like_revision(arg: str) -> bool:
    """A commit, ref, range, merge base or `<rev>:<path>`."""
    if arg.startswith("--with-tree"):
        return True
    if arg.startswith("-"):
        return False
    return bool(
        re.match(r"HEAD\b", arg)
        or "origin/" in arg
        or "@{" in arg
        or re.search(r"\w\.\.\.?\w", arg)
        or re.search(r"\b[0-9a-f]{7,40}\b", arg)
        # `<rev>:<path>`; pathspec magic (`:(exclude)x`, `:!x`) starts with ':'.
        or re.match(r"[^:\s]+:", arg)
    )


def _module_strings(tree: ast.Module) -> dict[str, str]:
    """Names bound to one string constant at module level."""
    values: dict[str, set[str]] = {}
    for node in tree.body:
        targets: list[ast.expr] = []
        value: ast.expr | None = None
        if isinstance(node, ast.Assign):
            targets, value = node.targets, node.value
        elif isinstance(node, ast.AnnAssign) and node.value is not None:
            targets, value = [node.target], node.value
        for target in targets:
            if isinstance(target, ast.Name):
                text = value.value if isinstance(value, ast.Constant) else None
                values.setdefault(target.id, set()).add(text if isinstance(text, str) else "")
    return {name: next(iter(found)) for name, found in values.items() if len(found) == 1}


def _subprocess_names(tree: ast.Module) -> tuple[set[str], set[str]]:
    """(aliases of the `subprocess` module, functions imported from it)."""
    modules, functions = {"subprocess"}, set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == "subprocess":
                    modules.add(alias.asname or alias.name)
        elif isinstance(node, ast.ImportFrom) and node.module == "subprocess":
            for alias in node.names:
                functions.add(alias.asname or alias.name)
    return modules, functions


def _argv_of(elements: list[ast.expr], strings: dict[str, str]) -> list[str | None]:
    argv: list[str | None] = []
    for element in elements:
        if isinstance(element, ast.Constant) and isinstance(element.value, str):
            argv.append(element.value)
        elif isinstance(element, ast.Name) and strings.get(element.id):
            argv.append(strings[element.id])
        else:
            argv.append(OPAQUE)
    return argv


def _command_string(node: ast.expr) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.JoinedStr):
        parts = [
            part.value if isinstance(part, ast.Constant) and isinstance(part.value, str) else "{?}"
            for part in node.values
        ]
        return "".join(parts)
    return None


def _split_shell(command: str) -> list[list[str | None]]:
    """Each `git ...` command in a shell string, as argv after `git`."""
    try:
        words = shlex.split(command)
    except ValueError:
        words = command.split()
    found: list[list[str | None]] = []
    for at, word in enumerate(words):
        if word == "git" and (at == 0 or words[at - 1] in SHELL_SEPARATORS):
            rest: list[str | None] = []
            for following in words[at + 1 :]:
                if following in SHELL_SEPARATORS:
                    break
                rest.append(OPAQUE if "{?}" in following else following)
            found.append(rest)
    return found


def _problem(argv: list[str | None]) -> str | None:
    """Why this argv (everything after `git`) is refused, or None."""
    at = 0
    while at < len(argv):
        word = argv[at]
        if word is OPAQUE or not word.startswith("-"):
            break
        at += 2 if word in OPTIONS_WITH_VALUE else 1
    if at >= len(argv):
        return "no subcommand"
    subcommand = argv[at]
    if subcommand is OPAQUE:
        return "a subcommand the guard cannot read"
    if subcommand not in ALLOWED_SUBCOMMANDS:
        return f"`{subcommand}` is not a working-tree subcommand"
    for arg in argv[at + 1 :]:
        if arg is not OPAQUE and looks_like_revision(arg):
            return f"`{arg}` looks like a revision"
    return None


def _render(argv: list[str | None]) -> str:
    return " ".join("<?>" if arg is OPAQUE else arg for arg in argv)


def offenders_in(source: str, name: str = "<source>") -> list[str]:
    """`name:line: git ... (why)` for every refused invocation in `source`."""
    tree = ast.parse(source, filename=name)
    strings = _module_strings(tree)
    modules, functions = _subprocess_names(tree)
    found: list[str] = []

    def check(line: int, argv: list[str | None]) -> None:
        problem = _problem(argv)
        if problem is not None:
            found.append(f"{name}:{line}: git {_render(argv)} ({problem})")

    for node in ast.walk(tree):
        if isinstance(node, (ast.List, ast.Tuple)) and node.elts:
            first = node.elts[0]
            if isinstance(first, ast.Constant) and first.value == "git":
                check(node.lineno, _argv_of(node.elts[1:], strings))
        elif isinstance(node, ast.Call):
            func = node.func
            is_subprocess = (
                isinstance(func, ast.Attribute)
                and isinstance(func.value, ast.Name)
                and func.value.id in modules
            ) or (isinstance(func, ast.Name) and func.id in functions)
            if not is_subprocess:
                continue
            command_nodes = node.args[:1] + [k.value for k in node.keywords if k.arg == "args"]
            for command_node in command_nodes:
                command = _command_string(command_node)
                if command is None:
                    continue
                for argv in _split_shell(command):
                    check(node.lineno, argv)
    return found


def _list_files(*extra: str) -> list[str]:
    proc = subprocess.run(
        ["git", "ls-files", "-z", *extra, "--", *SCOPES],
        cwd=REPO,
        capture_output=True,
    )
    assert proc.returncode == 0, f"git ls-files exited {proc.returncode}: {proc.stderr!r}"
    return [path for path in proc.stdout.decode().split("\0") if path.endswith(".py")]


def scanned_files() -> list[str]:
    """Tracked `.py` files under both scopes, plus untracked, not-ignored ones."""
    tracked = _list_files()
    untracked = _list_files("--others", "--exclude-standard")
    return sorted({path for path in tracked + untracked if (REPO / path).is_file()})


# -- the guard ---------------------------------------------------------------------


def test_the_scan_reaches_both_directories_so_it_cannot_pass_vacuously() -> None:
    files = scanned_files()
    for scope in SCOPES:
        assert [path for path in files if path.startswith(scope + "/")], f"no .py under {scope}"
    assert "backend/tests/conftest.py" in files
    assert "backend/integration/conftest.py" in files
    assert "backend/tests/test_git_revision_guard.py" in files


def test_no_backend_test_hands_git_a_revision() -> None:
    offenders: list[str] = []
    for path in scanned_files():
        offenders += offenders_in((REPO / path).read_text(encoding="utf-8"), path)
    assert offenders == []


# -- the rules, on inline sources ----------------------------------------------------
# Each sample is a string: the guard reads strings as text, never as invocations.

REVISION_FORMS = {
    "a-sha-and-head": '["git", "diff", "--name-only", "e2e6495", "HEAD", "--", "backend/"]\n',
    "b-revision-in-a-variable": (
        'BASE = "e2e6495"\ncmd = ["git", "diff", "--name-only", BASE, "--", "backend/"]\n'
    ),
    "c-show-rev-path": '["git", "show", "aa88101:backend/app/data/content.json"]\n',
    "d-log-range": '["git", "log", "origin/main..HEAD"]\n',
    "e-merge-base": '["git", "merge-base", "HEAD", "origin/main"]\n',
    "f-rev-parse": '["git", "rev-parse", "HEAD"]\n',
    "g-tuple": '("git", "diff", "abc1234", "HEAD")\n',
    "h-shell-string": (
        'import subprocess\nsubprocess.run("git diff abc1234 HEAD", shell=True, check=True)\n'
    ),
    "i-global-option-first": '["git", "-C", str(REPO), "diff", "e2e6495", "HEAD"]\n',
    "ls-files-with-tree": '["git", "ls-files", "--with-tree=HEAD"]\n',
    "unreadable-subcommand": 'cmd = ["git", sub, "HEAD"]\n',
    "imported-run": 'from subprocess import run as r\nr("git show HEAD:x.py", shell=True)\n',
    "f-string": 'import subprocess\nsubprocess.run(f"git diff {BASE}", shell=True)\n',
    "after-cd": 'import subprocess\nsubprocess.run("cd x && git log -1", shell=True)\n',
}

WORKING_TREE_READS = {
    "ls-files": '["git", "ls-files", "-z"]\n',
    "ls-files-scoped": '["git", "ls-files", "-z", "--", "backend/"]\n',
    "status": '["git", "status", "--porcelain"]\n',
    "status-scoped": '["git", "status", "--porcelain", "--", "backend/"]\n',
    "ls-files-spread": '["git", "ls-files", "-z", "--", *paths]\n',
    "ls-files-behind-c": '["git", "-C", str(REPO), "ls-files", "-z"]\n',
    "pathspec-magic": '["git", "ls-files", "--", ":(exclude)backend/app"]\n',
    "shell-status": 'import subprocess\nsubprocess.run("git status --porcelain", shell=True)\n',
}

PROSE = {
    "comment": '# cmd = ["git", "diff", "e2e6495", "HEAD"]\nx = 1\n',
    "module-docstring": '"""Computed from `git show 1032b77:backend/app/data/x.json`."""\n',
    "function-docstring": (
        'def f():\n    """subprocess.run("git diff abc1234 HEAD", shell=True)"""\n'
    ),
    "plain-string": 'note = "git log origin/main..HEAD"\n',
}


@pytest.mark.parametrize("source", REVISION_FORMS.values(), ids=REVISION_FORMS.keys())
def test_every_revision_form_is_refused(source: str) -> None:
    found = offenders_in(source, "backend/tests/test_sample.py")
    assert len(found) == 1
    assert found[0].startswith("backend/tests/test_sample.py:")


@pytest.mark.parametrize("source", WORKING_TREE_READS.values(), ids=WORKING_TREE_READS.keys())
def test_working_tree_reads_pass(source: str) -> None:
    assert offenders_in(source) == []


@pytest.mark.parametrize("source", PROSE.values(), ids=PROSE.keys())
def test_prose_is_not_an_invocation(source: str) -> None:
    assert offenders_in(source) == []
