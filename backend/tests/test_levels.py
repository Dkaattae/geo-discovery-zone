"""Level derivations — the same numbers the client computes.

`grade` and `band` are derived and never stored, so a disagreement between the
two implementations shows up as a profile that reads differently on each side
with nothing erroring.
"""

from __future__ import annotations

import pytest

from app.levels import (
    band_label,
    band_of,
    clamp_level,
    grade_label,
    grade_of,
    level_label,
    level_window,
)


@pytest.mark.parametrize(
    ("level", "grade", "band"),
    [(0.0, 0, 0.0), (1.5, 0, 1.5), (2.0, 1, 0.0), (7.0, 3, 1.0), (17.5, 8, 1.5), (18.0, 9, 0.0)],
)
def test_grade_and_band_are_derived_from_level(level: float, grade: int, band: float) -> None:
    assert grade_of(level) == grade
    assert band_of(level) == pytest.approx(band)


def test_third_hard_and_fourth_easy_are_one_axis() -> None:
    """Grade and difficulty are the same number by design."""
    assert grade_of(7.5) == 3 and band_label(7.5) == "Hard"
    assert grade_of(8.0) == 4 and band_label(8.0) == "Easy"


@pytest.mark.parametrize(
    ("level", "label"),
    [(0.0, "Easy"), (0.5, "Easy"), (1.0, "Medium"), (1.4, "Medium"), (1.5, "Hard")],
)
def test_band_label_boundaries(level: float, label: str) -> None:
    assert band_label(level) == label


def test_grade_zero_is_kindergarten_and_grade_eight_is_the_ceiling() -> None:
    assert grade_label(0.0) == "Kindergarten"
    assert grade_label(6.0) == "3rd grade"
    assert grade_label(18.0) == "8th grade"


def test_level_label_carries_every_display_field() -> None:
    label = level_label(6.0)
    assert label == {
        "level": 6.0,
        "grade": 3,
        "band": 0.0,
        "gradeLabel": "3rd grade",
        "bandLabel": "Easy",
        "display": "3rd grade · Easy",
    }


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
