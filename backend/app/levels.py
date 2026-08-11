"""Difficulty level derivations.

`level` is the only stored scalar (0.0-18.0). `grade` and `band` are derived for
display and never stored, exactly as in `frontend/src/lib/level.ts` — the two
implementations must agree or the same profile reads differently on each side.
"""

from __future__ import annotations

import math

MAX_LEVEL = 18.0
MIN_LEVEL = 0.0

_GRADE_NAMES = ["K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]


def clamp_level(level: float) -> float:
    return min(MAX_LEVEL, max(MIN_LEVEL, level))


def grade_of(level: float) -> int:
    return math.floor(level / 2)


def band_of(level: float) -> float:
    return level - 2 * grade_of(level)


def grade_label(level: float) -> str:
    grade = min(8, max(0, grade_of(level)))
    return "Kindergarten" if grade == 0 else f"{_GRADE_NAMES[grade]} grade"


def band_label(level: float) -> str:
    band = band_of(level)
    if band < 0.75:
        return "Easy"
    if band < 1.5:
        return "Medium"
    return "Hard"


def level_display(level: float) -> str:
    return f"{grade_label(level)} · {band_label(level)}"


def level_label(level: float) -> dict[str, object]:
    """The display-only `LevelLabel` object from the contract."""
    return {
        "level": level,
        "grade": min(8, max(0, grade_of(level))),
        "band": band_of(level),
        "gradeLabel": grade_label(level),
        "bandLabel": band_label(level),
        "display": level_display(level),
    }


def level_window(current: float) -> list[float]:
    """The three or four choices the level picker offers, centred on `current`.

    Mirrors `levelWindow()` in the client: a K-2 child never scrolls past 7th
    grade because the window only ever reaches one level below and two above.
    """
    raw = [current - 1, current, current + 1, current + 2]
    rounded = {clamp_level(round(value * 2) / 2) for value in raw}
    return sorted(rounded)
