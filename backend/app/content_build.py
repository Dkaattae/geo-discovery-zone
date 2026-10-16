"""Pipeline JSON → the served bank (`app/data/content.json`), T-040.

Run with `make -C backend content` (or `uv run python -m app.content_build`
from `backend/`). Reads two committed inputs and writes one committed output:

- `question-bank/data/us-states/` — the entity bank (E-6), snake_case;
- `question-bank/data/questions/us-states.json` — every generated question
  (`cd question-bank && bun run ./src/write-questions.ts`);
- → `backend/app/data/content.json`, camelCase, what `store.ensure_content_loaded`
  reads at startup.

The mapping is an allowlist in both directions. An entity keeps only the fields
in `ENTITY_FIELDS`, renamed to the contract's names, and drops any that is
absent or null; its `funFact` is the first fun fact marked `reviewed: true`, and
no other prose is written. A question keeps only `QUESTION_FIELDS`, so the
pipeline's `answer`, `answerGeometryId` and `choiceGeometryIds` never reach the
app, and `map_click` questions are withheld until T-051 renders them
(engineering-decisions.md E-24).

No clock, no network: running it twice on an unchanged tree writes the same
bytes. `tests/test_content_build.py` fails when the committed `content.json` is
not what this would write.
"""

from __future__ import annotations

import json
from collections.abc import Iterable, Mapping, Sequence
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
ENTITY_DIR = REPO_ROOT / "question-bank" / "data" / "us-states"
QUESTION_FILE = REPO_ROOT / "question-bank" / "data" / "questions" / "us-states.json"
CONTENT_FILE = BACKEND_DIR / "app" / "data" / "content.json"

# Pipeline field → served (openapi.yaml `Entity`) field. Anything not listed —
# `state_animal`, `highest_point`, `highest_point_m`, `sources`, `fun_facts` —
# is not served.
ENTITY_FIELDS: tuple[tuple[str, str], ...] = (
    ("id", "id"),
    ("type", "type"),
    ("scope", "scope"),
    ("name", "name"),
    ("capital", "capital"),
    ("region", "region"),
    ("geometry_id", "geometryId"),
    ("centroid", "centroid"),
    ("population", "population"),
    ("population_rank", "populationRank"),
    ("area_km2", "areaKm2"),
    ("area_rank", "areaRank"),
    ("borders", "borders"),
    ("climate_kid", "climateKid"),
    ("landmark", "landmark"),
    ("top_crops", "topCrops"),
    ("top_livestock", "topLivestock"),
)

# Question-file fields copied to the served question, in this order. The file
# is already camelCase (the tag stage writes openapi.yaml's names).
QUESTION_FIELDS: tuple[str, ...] = (
    "id",
    "entityId",
    "templateId",
    "format",
    "prompt",
    "choices",
    "correctIndex",
    "level",
    "topic",
    "scope",
    "entityType",
    "region",
    "ageBand",
    "highlightGeometryId",
)

# Formats the client renders today (`Session.tsx`). `map_click` joins in T-051.
SERVED_FORMATS = frozenset({"map_identify", "multiple_choice"})

# What a correct answer reveals: the map for a map question, nothing extra for a
# capital — as the hand-written bank did. A wrong answer always highlights.
REVEAL_BY_FORMAT = {"map_identify": "map_highlight", "multiple_choice": "none"}


def reviewed_fun_fact(fun_facts: Any) -> str | None:
    """The text of the first fun fact, in array order, with `reviewed: true`."""
    if not isinstance(fun_facts, list):
        return None
    for fact in fun_facts:
        if isinstance(fact, Mapping) and fact.get("reviewed") is True:
            text = fact.get("text")
            if isinstance(text, str) and text.strip():
                return text
    return None


def served_entity(pipeline: Mapping[str, Any]) -> dict[str, Any]:
    """One pipeline entity as the app serves it.

    Absent and null values are left out rather than written as null; an empty
    list is kept, because "none" is a real answer for `topLivestock`.
    """
    entity: dict[str, Any] = {}
    for source, target in ENTITY_FIELDS:
        value = pipeline.get(source)
        if value is not None:
            entity[target] = value
    fun_fact = reviewed_fun_fact(pipeline.get("fun_facts"))
    if fun_fact is not None:
        entity["funFact"] = fun_fact
    return entity


def served_question(generated: Mapping[str, Any]) -> dict[str, Any]:
    """One generated question as the app serves it. Raises on a broken answer key."""
    question = {field: generated[field] for field in QUESTION_FIELDS if field in generated}
    choices = question.get("choices")
    index = question.get("correctIndex")
    if (
        not isinstance(choices, list)
        or len(choices) != 4
        or not isinstance(index, int)
        or not 0 <= index < len(choices)
        or choices[index] != generated.get("answer")
    ):
        raise ValueError(f"question {generated.get('id')!r}: choices/correctIndex/answer disagree")
    question["reveal"] = REVEAL_BY_FORMAT[question["format"]]
    return question


def build_content(
    entities: Sequence[Mapping[str, Any]],
    questions: Iterable[Mapping[str, Any]],
) -> dict[str, Any]:
    """The whole served bank: entities in input order, then the servable questions.

    Raises when a served question names an entity that is not served.
    """
    served_entities = [served_entity(e) for e in entities]
    entity_ids = {e["id"] for e in served_entities}
    served_questions = []
    for generated in questions:
        if generated.get("format") not in SERVED_FORMATS:
            continue
        question = served_question(generated)
        if question.get("entityId") not in entity_ids:
            raise ValueError(f"question {question['id']!r} names an unknown entity")
        served_questions.append(question)

    built = sorted(
        str(e["sources"]["built_at"])
        for e in entities
        if isinstance(e.get("sources"), Mapping) and e["sources"].get("built_at")
    )
    return {
        "_source": {
            "from": [
                "question-bank/data/us-states/",
                "question-bank/data/questions/us-states.json",
            ],
            # The entity bank's own build date, not today's: the version must
            # not change on a rerun over the same inputs.
            "extractedAt": built[-1][:10] if built else "1970-01-01",
            "generatedBy": "make -C backend content (backend/app/content_build.py)",
            "note": (
                "Generated from the pipeline, not edited by hand. Each entity's funFact "
                "is its first fun fact marked reviewed: true; no other prose is added. "
                "map_click questions are withheld until T-051."
            ),
        },
        "entities": served_entities,
        "questions": served_questions,
    }


def render(content: Mapping[str, Any]) -> str:
    return json.dumps(content, indent=2, ensure_ascii=False) + "\n"


def load_pipeline_entities(entity_dir: Path = ENTITY_DIR) -> list[dict[str, Any]]:
    """The committed entities, in `index.json` order."""
    index = json.loads((entity_dir / "index.json").read_text(encoding="utf-8"))
    return [
        json.loads((entity_dir / f"{row['id']}.json").read_text(encoding="utf-8"))
        for row in index["entities"]
    ]


def load_generated_questions(path: Path = QUESTION_FILE) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))["questions"]


def render_committed_inputs(
    entity_dir: Path = ENTITY_DIR, question_file: Path = QUESTION_FILE
) -> str:
    """What `content.json` should hold, from the committed inputs."""
    return render(
        build_content(load_pipeline_entities(entity_dir), load_generated_questions(question_file))
    )


def main() -> None:
    text = render_committed_inputs()
    CONTENT_FILE.write_text(text, encoding="utf-8")
    content = json.loads(text)
    print(
        f"wrote {CONTENT_FILE.relative_to(REPO_ROOT)}: "
        f"{len(content['entities'])} entities, {len(content['questions'])} questions"
    )


if __name__ == "__main__":
    main()
