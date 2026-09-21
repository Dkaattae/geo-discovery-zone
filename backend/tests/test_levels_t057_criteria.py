"""T-057's acceptance criteria, written out as assertions by the verifying
session (`process.md` step 4).

Every expected value here comes from the wording of a criterion in
`tasks/T-057-level-window-docstring.md`, or from the authority a criterion
names — `openapi.yaml`'s `ProfileProgress.suggestedLevels` description for the
three-or-four rule, and `frontend/src/lib/level.ts`'s export list for what the
client actually has. None of it was read out of `app/levels.py`: the module is
the thing under test, so taking an expectation from it would only ratify
whatever it happens to do.

Deliberately separate from `test_levels.py`, which is the worker's suite. The
two overlap on criteria 4, 5 and 6 on purpose — the point of this file is that
its numbers were derived from the brief rather than from the implementation.

Pure functions, called directly, plus two files read from disk. No network and
no server (`test-guidelines.md`, "Start below the transport").
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.levels import MAX_LEVEL, MIN_LEVEL, clamp_level, level_window

REPO_ROOT = Path(__file__).resolve().parents[2]
LEVELS_PY = REPO_ROOT / "backend" / "app" / "levels.py"
LEVEL_TS = REPO_ROOT / "frontend" / "src" / "lib" / "level.ts"
OPENAPI = REPO_ROOT / "openapi.yaml"

# Criterion 4 and 5 both quantify over "every `L` in {0.0, 0.5, 1.0, …, 17.5,
# 18.0}" — the 37 half-integers of the 0-18 scale, spelled out from the
# criterion rather than from any constant in the module under test.
SCALE = [round(step * 0.5, 1) for step in range(0, 37)]
SCALE_IDS = [f"L-{level}" for level in SCALE]


# --- criterion 2 -------------------------------------------------------------


def _client_exports() -> set[str]:
    """Every name `frontend/src/lib/level.ts` exports."""
    source = LEVEL_TS.read_text(encoding="utf-8")
    return set(re.findall(r"export\s+(?:function|const|class|let|var)\s+(\w+)", source))


def _python_symbols() -> set[str]:
    """Every name `app/levels.py` itself defines."""
    source = LEVELS_PY.read_text(encoding="utf-8")
    return set(re.findall(r"^(?:def|class)\s+(\w+)", source, re.MULTILINE)) | set(
        re.findall(r"^(\w+)\s*(?::[^=]+)?=", source, re.MULTILINE)
    )


def test_criterion_2_the_docstring_names_the_field_the_result_becomes() -> None:
    """Criterion 2: "names the `suggestedLevels` field"."""
    doc = level_window.__doc__ or ""
    assert "suggestedLevels" in doc


def test_criterion_2_the_docstring_says_the_client_renders_the_list_rather_than_computing_one() -> (
    None
):
    """Criterion 2: "states that the client renders that list rather than computing a window
    of its own"."""
    doc = level_window.__doc__ or ""
    assert re.search(r"client|frontend/src", doc), (
        "the docstring never mentions the client side at all, so it cannot say "
        "what the client does with the result"
    )
    assert re.search(
        r"rather than (deriving|computing|calculating)|never (computed|computes|derived)"
        r"|does not (compute|derive)|only formats",
        doc,
    ), (
        "the docstring does not say the client renders the list rather than "
        f"computing a window of its own. Docstring was:\n{doc}"
    )


def test_criterion_2_no_comment_in_levels_py_attributes_a_function_to_a_client_that_lacks_it() -> (
    None
):
    """Criterion 2: "No docstring or comment anywhere in `backend/app/levels.py` attributes a
    function to the client that `frontend/src/lib/level.ts` does not export."

    Scans the whole module, not just `level_window`'s docstring. Every
    ``\\`name(...)\\``-shaped mention has to be either something this module
    defines itself or something the client really exports.
    """
    source = LEVELS_PY.read_text(encoding="utf-8")
    mentioned = set(re.findall(r"`(\w+)\([^`]*\)`", source))
    known = _client_exports() | _python_symbols()
    unknown = mentioned - known
    assert unknown == set(), (
        f"app/levels.py names {sorted(unknown)} as a function, but neither "
        f"app/levels.py nor frontend/src/lib/level.ts defines it. "
        f"level.ts exports {sorted(_client_exports())}."
    )


# --- criterion 4 -------------------------------------------------------------


def test_criterion_4_the_contract_still_promises_three_or_four() -> None:
    """The brief forbids editing `openapi.yaml`: the code moves to the contract.

    If this goes red, the contract was changed to match the code, which is the
    thing criterion 4 exists to prevent.
    """
    spec = OPENAPI.read_text(encoding="utf-8")
    start = spec.index("        suggestedLevels:")
    description = spec[start : start + 400]
    assert "three or four choices to show in the level picker" in description


@pytest.mark.parametrize("level", SCALE, ids=SCALE_IDS)
def test_criterion_4_every_level_on_the_scale_offers_three_or_four_choices(level: float) -> None:
    assert len(level_window(level)) in (3, 4)


def test_criterion_4_the_top_of_the_scale_boundary_returns_at_least_three() -> None:
    """The two boundaries criterion 4 names: 17.5 returned 3 before this task
    and must stay >= 3; 18.0 returned 2 and must not."""
    assert len(level_window(17.5)) >= 3
    assert len(level_window(18.0)) >= 3


# --- criterion 5 -------------------------------------------------------------


@pytest.mark.parametrize("level", SCALE, ids=SCALE_IDS)
def test_criterion_5_the_window_is_sorted_strictly_ascending(level: float) -> None:
    window = level_window(level)
    assert all(earlier < later for earlier, later in zip(window, window[1:], strict=False))


@pytest.mark.parametrize("level", SCALE, ids=SCALE_IDS)
def test_criterion_5_every_value_is_on_the_scale(level: float) -> None:
    assert all(MIN_LEVEL <= value <= MAX_LEVEL for value in level_window(level))


@pytest.mark.parametrize("level", SCALE, ids=SCALE_IDS)
def test_criterion_5_every_value_is_a_multiple_of_a_half(level: float) -> None:
    assert all((value / 0.5).is_integer() for value in level_window(level))


@pytest.mark.parametrize("level", SCALE, ids=SCALE_IDS)
def test_criterion_5_the_child_is_always_offered_the_level_they_are_on(level: float) -> None:
    assert clamp_level(level) in level_window(level)


# --- criterion 6 -------------------------------------------------------------


def test_criterion_6_the_middle_of_the_scale_has_not_moved() -> None:
    assert level_window(6.0) == [5.0, 6.0, 7.0, 8.0]


def test_criterion_6_a_k2_child_still_never_scrolls_past_7th_grade() -> None:
    assert max(level_window(2.0)) == 4.0


def test_criterion_6_the_bottom_of_the_scale_still_starts_at_zero() -> None:
    assert min(level_window(0.0)) == 0.0
