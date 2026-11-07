"""T-103 worker: one check per bank fact T-102's draw survey rests on.

Each parametrised case runs one fact from `tests/bank_facts.py` against the
committed `app/data/content.json`, read from disk. Its node ID carries the
fact's label (`test_bank_fact[B8c]`), and its failure lists every test whose
"holds under any draw" argument needs that fact. A bank change that breaks a
fact therefore fails here, every run, by name, instead of making those tests
flaky.

No HTTP, no router, no draw, no `random`. Edge cases for each check, on edited
copies of the bank, are in `test_t103_bank_fact_edges.py`.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest

from tests.bank_facts import DEPENDENTS, FACTS, assert_fact, load_bank

TESTS_DIR = Path(__file__).resolve().parent


@pytest.mark.parametrize("label", list(FACTS), ids=list(FACTS))
def test_bank_fact(label: str) -> None:
    assert_fact(label, load_bank())


def _test_functions(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    return {
        node.name
        for node in ast.walk(tree)
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef)
        and node.name.startswith("test_")
    }


def test_every_named_dependent_is_a_real_test() -> None:
    """A renamed or deleted dependent would make a failure message point nowhere."""
    assert set(DEPENDENTS) == set(FACTS)
    missing = [
        f"{file}::{name} (dependent of {label})"
        for label, deps in DEPENDENTS.items()
        for file, name in deps
        if name not in _test_functions(TESTS_DIR / file)
    ]
    assert not missing, missing
