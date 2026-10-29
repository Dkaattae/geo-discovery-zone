"""T-085a, written by the `tester`: criterion 15, the served side.

Expected values come from the brief's criteria (Hawaii and Alaska 2 lower on
the two map templates and the climate template), not from the code. No
network: everything is read from the committed tree.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.content_build import CONTENT_FILE, QUESTION_FILE, render_committed_inputs

REPO = Path(__file__).resolve().parents[2]

SIX_AFTER = {
    "gen:tpl-identify-on-map:us-state-hi": 4.5,
    "gen:tpl-click-the-map:us-state-hi": 5.5,
    "gen:tpl-climate-of:us-state-hi": 7.5,
    "gen:tpl-identify-on-map:us-state-ak": 4,
    "gen:tpl-click-the-map:us-state-ak": 5,
    "gen:tpl-climate-of:us-state-ak": 6,
}


def _questions(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))["questions"]


def test_criterion_15_content_json_equals_what_make_content_writes() -> None:
    assert CONTENT_FILE == REPO / "backend" / "app" / "data" / "content.json"
    assert CONTENT_FILE.read_text(encoding="utf-8") == render_committed_inputs()


def test_criterion_15_each_served_level_equals_the_question_file_level() -> None:
    file_levels = {q["id"]: q["level"] for q in _questions(QUESTION_FILE)}
    served = _questions(CONTENT_FILE)
    assert served
    mismatched = [q["id"] for q in served if file_levels.get(q["id"]) != q["level"]]
    assert mismatched == []


def test_criterion_15_the_six_are_served_at_their_lowered_levels() -> None:
    served = {q["id"]: q["level"] for q in _questions(CONTENT_FILE)}
    assert {qid: served.get(qid) for qid in SIX_AFTER} == SIX_AFTER
