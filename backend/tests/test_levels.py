"""Level derivations — the same numbers the client computes.

`grade` and `band` are derived and never stored, so a disagreement between the
two implementations shows up as a profile that reads differently on each side
with nothing erroring.

The table in `fixtures/level-labels.json` at the repo root is the agreed answer,
and `frontend/src/lib/level.test.ts` asserts against the same file. Changing
`app/levels.py` or `frontend/src/lib/level.ts` alone therefore turns one of the
two suites red instead of drifting quietly.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from app.levels import (
    band_label,
    band_of,
    clamp_level,
    grade_label,
    grade_of,
    level_display,
    level_label,
    level_window,
)

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
