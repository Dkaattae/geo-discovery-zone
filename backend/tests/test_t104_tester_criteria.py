"""T-104 tester: the two module docstrings stop calling `openapi.yaml` a contract.

Criteria 1 and 2 are properties of the module docstrings of
`backend/tests/test_contract.py` and `backend/tests/conftest.py`, read with
`ast.get_docstring` as the brief defines. They assert what the docstrings must
and must not say, never a digest of either file (P-17).

Criteria 3 and 4 ("nothing else changed", compared with `dca80da`) are
task-scoped no-change criteria. They are verified at hand-off by executed
procedure recorded in the brief's Verdict, not pinned here, so a later task
that edits these files does not inherit a stale pin (P-17).
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

TESTS = Path(__file__).resolve().parent


def module_docstring(name: str) -> str:
    tree = ast.parse((TESTS / name).read_text(encoding="utf-8"))
    doc = ast.get_docstring(tree)
    assert doc, f"{name} has no module docstring"
    return doc


def flat(text: str) -> str:
    """Collapse line wrapping so a phrase split across lines still matches."""
    return re.sub(r"\s+", " ", text)


# A statement that `openapi.yaml` follows, or is kept in step with, the backend.
FOLLOWS_BACKEND = re.compile(
    r"`?openapi\.yaml`?[^.]*?\b(follows|is kept in step with)\b[^.]*?\bthe backend\b",
    re.IGNORECASE,
)


# -- criterion 1: test_contract.py ------------------------------------------


def test_criterion_1_contract_docstring_drops_contract_between() -> None:
    assert "contract between" not in flat(module_docstring("test_contract.py")).lower()


def test_criterion_1_contract_docstring_says_spec_follows_backend_and_cites_e14() -> None:
    doc = flat(module_docstring("test_contract.py"))
    assert FOLLOWS_BACKEND.search(doc), doc
    assert "E-14" in doc


def test_criterion_1_contract_docstring_keeps_route_with_no_operation() -> None:
    doc = flat(module_docstring("test_contract.py")).lower()
    assert re.search(r"\broute\b[^.;:,]*\bno operation\b", doc), doc


def test_criterion_1_contract_docstring_keeps_operation_with_no_route() -> None:
    doc = flat(module_docstring("test_contract.py")).lower()
    assert re.search(r"\boperation\b[^.;:,]*\bno route\b", doc), doc


def test_criterion_1_contract_docstring_keeps_unmarked_protected_group() -> None:
    doc = flat(module_docstring("test_contract.py")).lower()
    # A protected group that does not say it is protected.
    assert re.search(r"\bprotected group\b[^.;]*\b(not|forgot)\b[^.;]*\bprotected\b", doc), doc


# -- criterion 2: conftest.py -----------------------------------------------


def test_criterion_2_conftest_docstring_drops_contract_promises() -> None:
    doc = flat(module_docstring("conftest.py")).lower()
    assert "contract promises" not in doc
    assert "what the contract" not in doc


def test_criterion_2_conftest_docstring_says_spec_follows_backend_and_cites_e14() -> None:
    doc = flat(module_docstring("conftest.py"))
    assert FOLLOWS_BACKEND.search(doc), doc
    assert "E-14" in doc


def test_criterion_2_conftest_docstring_still_gives_a_reason_for_async_client() -> None:
    paragraphs = [flat(p) for p in module_docstring("conftest.py").split("\n\n")]
    para = next((p for p in paragraphs if "httpx.AsyncClient" in p), None)
    assert para is not None, "no paragraph mentions `httpx.AsyncClient`"
    # Through the app, not by calling the handler, and then a reason for it.
    m = re.search(r"not by calling the\s+handler\s*(—|-|,|because|since)\s*(.+)", para)
    assert m, para
    reason = m.group(2)
    assert len(reason.split()) >= 5, f"no reason given after the handler clause: {reason!r}"


def test_criterion_2_conftest_docstring_keeps_database_choice_paragraph() -> None:
    doc = flat(module_docstring("conftest.py"))
    assert "The database is real, and which one is a choice" in doc
    assert "by default a temporary SQLite file" in doc
    assert "`GEO_TEST_DATABASE_URL`" in doc
    assert "Both are supported backends, so both can be run" in doc


def test_criterion_2_conftest_docstring_keeps_both_uv_run_pytest_lines() -> None:
    # The source's trailing backslash is a line continuation inside the string
    # literal, so in the docstring `ast` returns the Postgres command is one line.
    lines = module_docstring("conftest.py").splitlines()
    sqlite = [ln for ln in lines if re.fullmatch(r"\s*uv run pytest\s+# SQLite", ln)]
    assert len(sqlite) == 1, lines
    pg = [
        ln
        for ln in lines
        if re.fullmatch(
            r"\s*GEO_TEST_DATABASE_URL=postgresql\+psycopg://postgres@localhost/geoquiz_test"
            r"\s+uv run pytest\s+# Postgres",
            ln,
        )
    ]
    assert len(pg) == 1, lines


def test_criterion_2_conftest_docstring_keeps_alembic_and_rollback_paragraph() -> None:
    doc = flat(module_docstring("conftest.py"))
    assert "The schema is built by the same Alembic migrations production runs" in doc
    assert (
        "a migration that does not match the models fails the suite rather than a deployment" in doc
    )
    assert "Each test runs inside a transaction that is rolled back afterwards" in doc
    assert "tests cannot see each other's rows and none of them has to clean up" in doc


def test_criterion_2_conftest_docstring_keeps_postgres_clean_schema_paragraph() -> None:
    doc = flat(module_docstring("conftest.py"))
    assert "A Postgres run starts from a clean schema" in doc
    assert "drops and recreates `public` first" in doc
    assert "a database left over from a previous run is not a fixture" in doc
