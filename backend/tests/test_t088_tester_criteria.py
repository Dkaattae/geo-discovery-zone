"""T-088, written by the `tester`: criterion 19, the served bank.

The question-bank criteria are in
`question-bank/src/agriculture-true-wrong-answers-verify.test.ts`. Expected
values come from the brief: `make -C backend content` reproduces the committed
`content.json` byte for byte, and every agriculture question served has the
question file's `choices`. Committed files only; no network.
"""

from __future__ import annotations

import json
from typing import Any

from app import content_build

AGRI = {"tpl-crop-of", "tpl-farm-animal-of"}


def _question_file() -> dict[str, dict[str, Any]]:
    data = json.loads(content_build.QUESTION_FILE.read_text(encoding="utf-8"))
    return {q["id"]: q for q in data["questions"]}


def _served() -> dict[str, dict[str, Any]]:
    data = json.loads(content_build.CONTENT_FILE.read_text(encoding="utf-8"))
    return {q["id"]: q for q in data["questions"]}


def test_c19_make_content_reproduces_the_committed_served_bank_byte_for_byte() -> None:
    # `make -C backend content` writes exactly render_committed_inputs() (content_build.main).
    committed = content_build.CONTENT_FILE.read_text(encoding="utf-8")
    assert content_build.render_committed_inputs() == committed


def test_c19_every_served_agriculture_question_has_the_question_files_choices() -> None:
    generated = _question_file()
    served = _served()
    agri = [qid for qid, q in generated.items() if q["templateId"] in AGRI]
    assert len(agri) == 74
    for qid in agri:
        assert qid in served, qid
        assert served[qid]["choices"] == generated[qid]["choices"], qid
