"""Level derivations — the same numbers the client computes.

`grade` and `band` are derived and never stored, so a disagreement between the
two implementations shows up as a profile that reads differently on each side
with nothing erroring.

The table in `fixtures/level-labels.json` at the repo root is the agreed answer,
and `frontend/src/lib/level.test.ts` asserts against the same file. Changing
`app/levels.py` or `frontend/src/lib/level.ts` alone therefore turns one of the
two suites red instead of drifting quietly.

`level_window` is not part of that shared table — `frontend/src/lib/level.ts`
has never computed a window, only formatted one the server already sent — so
its tests live here only, pinned against `openapi.yaml`'s `suggestedLevels`
description directly (T-057).
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import pytest

from app.levels import (
    MAX_LEVEL,
    MIN_LEVEL,
    band_label,
    band_of,
    clamp_level,
    grade_label,
    grade_of,
    level_display,
    level_label,
    level_window,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
LEVEL_TS = REPO_ROOT / "frontend" / "src" / "lib" / "level.ts"

# Every half-integer on the 0-18 scale — the same set the client's Setup
# picker could ever be asked to render a window for.
ALL_LEVELS = [i * 0.5 for i in range(37)]

LABELS_PATH = Path(__file__).resolve().parents[2] / "fixtures" / "level-labels.json"

LABEL_ROWS: list[dict[str, Any]] = json.loads(LABELS_PATH.read_text(encoding="utf-8"))["rows"]

# Named so a failure reads `level-0.75` rather than `rows12`.
LABEL_IDS = [f"level-{row['level']}" for row in LABEL_ROWS]


def test_the_shared_table_covers_the_whole_scale() -> None:
    levels = [row["level"] for row in LABEL_ROWS]
    assert min(levels) == 0
    assert max(levels) == 18
    assert len(levels) > 20


@pytest.mark.parametrize("row", LABEL_ROWS, ids=LABEL_IDS)
def test_labels_match_the_table_the_client_also_asserts(row: dict[str, Any]) -> None:
    level = row["level"]
    assert grade_of(level) == row["grade"]
    # Tolerant, not exact: `level - 2 * grade` is not exact for a level that is
    # not a multiple of 0.5 — band_of(16.74) is 0.7400000000000002.
    assert band_of(level) == pytest.approx(row["band"], abs=1e-9)
    assert grade_label(level) == row["gradeLabel"]
    assert band_label(level) == row["bandLabel"]
    assert level_display(level) == row["display"]


def test_third_hard_and_fourth_easy_are_one_axis() -> None:
    """Grade and difficulty are the same number by design."""
    assert grade_of(7.5) == 3 and band_label(7.5) == "Hard"
    assert grade_of(8.0) == 4 and band_label(8.0) == "Easy"


def test_a_level_below_the_scale_clamps_to_kindergarten() -> None:
    """Outside 0-18, so deliberately not in the shared table."""
    assert grade_of(-2.0) == -1
    assert grade_label(-2.0) == "Kindergarten"
    assert level_display(-2.0) == "Kindergarten · Easy"


def test_level_label_carries_every_display_field() -> None:
    label = level_label(6.0)
    assert set(label) == {"level", "grade", "band", "gradeLabel", "bandLabel", "display"}
    row = next(r for r in LABEL_ROWS if r["level"] == 6)
    assert label == {
        "level": 6.0,
        "grade": row["grade"],
        "band": pytest.approx(row["band"], abs=1e-9),
        "gradeLabel": row["gradeLabel"],
        "bandLabel": row["bandLabel"],
        "display": row["display"],
    }


def test_level_label_clamps_the_grade_it_reports_at_the_top_of_the_scale() -> None:
    """`grade_of(18)` is 9; the contract's LevelLabel may only carry 0-8."""
    assert grade_of(18.0) == 9
    assert level_label(18.0)["grade"] == 8
    assert level_label(18.0)["gradeLabel"] == "8th grade"


def test_level_window_offers_three_or_four_choices_around_the_current_level() -> None:
    assert level_window(6.0) == [5.0, 6.0, 7.0, 8.0]
    assert 3 <= len(level_window(6.0)) <= 4


def test_level_window_never_leaves_the_scale() -> None:
    assert min(level_window(0.0)) == 0.0
    assert max(level_window(18.0)) == 18.0


def test_a_k2_child_never_scrolls_past_7th_grade() -> None:
    """The window reaches one level below and two above, never the whole scale."""
    assert max(level_window(2.0)) == 4.0


@pytest.mark.parametrize(("raw", "clamped"), [(-3.0, 0.0), (0.0, 0.0), (18.0, 18.0), (99.0, 18.0)])
def test_clamp_level(raw: float, clamped: float) -> None:
    assert clamp_level(raw) == clamped


# T-057 criterion 4: `openapi.yaml`'s `suggestedLevels` description promises
# three or four choices at every level, not just the ones the tests above
# happened to cover. This is a bug-fix test — `level_window(18.0)` returned
# only two values before this task, and this fails against that code.
@pytest.mark.parametrize("level", ALL_LEVELS, ids=[f"level-{level}" for level in ALL_LEVELS])
def test_level_window_offers_three_or_four_choices_at_every_level_on_the_scale(
    level: float,
) -> None:
    assert 3 <= len(level_window(level)) <= 4


def test_level_window_stays_at_least_three_choices_at_the_boundaries_criterion_4_names() -> None:
    # Already 3 before this task; must not regress below it.
    assert len(level_window(17.5)) >= 3
    # The bug this task fixes: `level_window(18.0)` returned exactly 2.
    assert len(level_window(18.0)) >= 3


# Criterion 5.
@pytest.mark.parametrize("level", ALL_LEVELS, ids=[f"level-{level}" for level in ALL_LEVELS])
def test_level_window_is_well_formed_at_every_level_on_the_scale(level: float) -> None:
    window = level_window(level)
    assert window == sorted(window)
    assert len(window) == len(set(window))  # sorted + no duplicates == strictly ascending
    assert all(MIN_LEVEL <= value <= MAX_LEVEL for value in window)
    assert all(value * 2 == round(value * 2) for value in window)
    assert clamp_level(level) in window


def _client_level_exports() -> set[str]:
    """Every name `frontend/src/lib/level.ts` exports as a function or const."""
    source = LEVEL_TS.read_text(encoding="utf-8")
    return set(re.findall(r"export (?:function|const) (\w+)", source))


def test_level_window_docstring_names_no_client_function_the_client_does_not_have() -> None:
    """Criteria 2 and 7: `level_window`'s docstring must not attribute a
    function to the client that `frontend/src/lib/level.ts` does not export.

    Reads no network and spawns no server. T-057 deleted a sentence here that
    claimed this function mirrored a same-named one in the client; putting
    that sentence back turns this red, because the client never exported the
    function it named.
    """
    doc = level_window.__doc__ or ""
    named_as_client_functions = set(re.findall(r"`(\w+)\(\)`", doc))
    exports = _client_level_exports()
    unknown = named_as_client_functions - exports
    assert unknown == set(), (
        f"level_window's docstring names {sorted(unknown)} as a client function, "
        f"but frontend/src/lib/level.ts exports only {sorted(exports)}"
    )
