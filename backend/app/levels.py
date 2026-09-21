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
    """The three or four choices for the level picker, centred on `current`.

    This is the only place the window is computed — the result becomes
    `suggestedLevels` on `GET /profiles/{profileId}/progress`
    (`app/serializers.py`), and the client renders that list as-is
    (`frontend/src/components/screens.tsx`'s `Setup`) rather than deriving a
    window of its own. `frontend/src/lib/level.ts` only formats a level the
    server already sent; it has never computed one.

    The window normally reaches one level below and two above, so a K-2 child
    never scrolls past 7th grade. Clamping can collapse that at the very top of
    the 0-18 scale, where `current + 1` and `current + 2` both round down to
    the same value as `current`; when that happens the window is extended
    downward instead, so every level still offers at least three choices.
    """
    values = {clamp_level(round((current + offset) * 2) / 2) for offset in (-1, 0, 1, 2)}
    extra = -2
    while len(values) < 3:
        before = len(values)
        values.add(clamp_level(round((current + extra) * 2) / 2))
        if len(values) == before:
            # Ran into the bottom of the scale too; no further extension helps.
            break
        extra -= 1
    return sorted(values)
