"""T-017 verification (tester) — the served side of the region vocabulary.

Written from the acceptance criteria in `tasks/T-017-region-vocabulary.md`, not
from the implementation: the 13 vocabulary strings are criterion 1's closed set
and the 15 name/region pairs are criterion 3's list, both copied out of the
brief's own wording rather than read off `content.json`.

Three criteria land here rather than in `question-bank/`:

* **3** — the 15 states already served keep exactly the region they carry
  today, and this task does not touch `content.json`.
* **4** — the closed-set check over `backend/app/data/content.json`, which is
  where that file ships from. `question-bank/src/region-vocabulary.test.ts`
  checks the same file plus the curated table and the built bank.
* **5** — the region filter matches the way `openapi.yaml`'s `Region`
  description says it does. Only the behaviour is tested; the description's
  text is kept in step by hand (`engineering-decisions.md` E-14).

No network: every assertion reads a committed file or goes through the app with
the in-process test client.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import httpx

CONTENT_JSON = Path(__file__).resolve().parents[1] / "app" / "data" / "content.json"

#: Criterion 1's closed set, verbatim.
VOCABULARY = {
    "Great Basin",
    "Great Lakes",
    "Great Plains",
    "Mountain West",
    "New England",
    "Northeast",
    "Pacific",
    "Pacific Northwest",
    "Pacific West",
    "South Central",
    "Southeast",
    "Southwest",
    "Upper Midwest",
}

#: Criterion 3's 15 anchor pairs, verbatim.
ANCHORS = {
    "Colorado": "Mountain West",
    "Florida": "Southeast",
    "Texas": "South Central",
    "Alaska": "Pacific Northwest",
    "Hawaii": "Pacific",
    "Maine": "New England",
    "Michigan": "Great Lakes",
    "Louisiana": "South Central",
    "California": "Pacific West",
    "New York": "Northeast",
    "Arizona": "Southwest",
    "Kansas": "Great Plains",
    "Washington": "Pacific Northwest",
    "Minnesota": "Upper Midwest",
    "Nevada": "Great Basin",
}


def content() -> dict[str, Any]:
    return json.loads(CONTENT_JSON.read_text(encoding="utf-8"))


def region_offenders(node: Any, where: str) -> list[tuple[str, Any]]:
    """Every `region` anywhere under `node` that is not one of the 13.

    Returns where as well as what, so a failure names the offending row instead
    of just saying `False != True`.
    """
    if isinstance(node, list):
        found: list[tuple[str, Any]] = []
        for index, item in enumerate(node):
            found += region_offenders(item, f"{where}[{index}]")
        return found
    if isinstance(node, dict):
        found = []
        for key, value in node.items():
            if key == "region" and value is not None:
                if not isinstance(value, str) or value not in VOCABULARY:
                    found.append((f"{where}.region", value))
                continue
            found += region_offenders(value, f"{where}.{key}")
        return found
    return []


# -- criterion 3 -------------------------------------------------------------


def test_the_fifteen_anchor_states_keep_the_region_they_carry_today() -> None:
    """T-040 replaced the 15 hand-copied states with the 50 pipeline ones; the
    15 anchors are still served, each with the region criterion 3 fixed."""
    served = {entity["name"]: entity.get("region") for entity in content()["entities"]}
    assert {name: served.get(name) for name in ANCHORS} == ANCHORS


def test_content_json_serves_the_fifty_pipeline_states_the_fifteen_anchors_among_them() -> None:
    """Criterion 3 froze 15 rows until T-040 served the 50 pipeline states."""
    entities = content()["entities"]
    assert len(entities) == 50
    assert set(ANCHORS) <= {entity["name"] for entity in entities}


async def test_the_api_returns_the_same_region_for_each_anchor(
    client: httpx.AsyncClient,
) -> None:
    body = (await client.get("/entities", params={"limit": 500})).json()
    served = {row["name"]: row.get("region") for row in body["data"]}
    assert {name: served.get(name) for name in ANCHORS} == ANCHORS


# -- criterion 4 -------------------------------------------------------------


def test_no_region_in_content_json_is_outside_the_thirteen() -> None:
    assert region_offenders(content(), "backend/app/data/content.json") == []


def test_both_entities_and_questions_in_content_json_were_checked() -> None:
    """A scan that found nothing to scan would pass the test above for free."""
    document = content()
    entity_regions = [entity.get("region") for entity in document["entities"]]
    question_regions = [question.get("region") for question in document["questions"]]
    assert len(entity_regions) == 50
    assert len(question_regions) > 0
    assert all(value in VOCABULARY for value in entity_regions)
    assert all(value in VOCABULARY for value in question_regions if value is not None)


def test_no_region_anywhere_in_content_json_is_a_kebab_case_slug() -> None:
    """The specific old-vocabulary shape criterion 5 calls out as never real."""
    document = content()
    values = {entity.get("region") for entity in document["entities"]}
    values |= {question.get("region") for question in document["questions"]}
    slugs = [value for value in values if isinstance(value, str) and "-" in value]
    assert slugs == []


def test_the_closed_set_check_rejects_a_value_outside_the_vocabulary() -> None:
    """Anti-tautology guard: the scanner above must actually report offenders."""
    assert region_offenders({"entities": [{"region": "Midwest"}]}, "x") == [
        ("x.entities[0].region", "Midwest")
    ]
    assert region_offenders({"questions": [{"region": "mountain-west"}]}, "x") == [
        ("x.questions[0].region", "mountain-west")
    ]
    assert region_offenders({"region": 7}, "x") == [("x.region", 7)]


async def test_no_region_the_api_serves_is_outside_the_thirteen(
    client: httpx.AsyncClient,
) -> None:
    entities = (await client.get("/entities", params={"limit": 500})).json()["data"]
    questions = (await client.get("/questions", params={"limit": 500})).json()["data"]
    assert region_offenders(entities, "GET /entities") == []
    assert region_offenders(questions, "GET /questions") == []


# -- criterion 5 -------------------------------------------------------------
#
# Criterion 5 was about `openapi.yaml`'s `Region` description; its text checks
# were deleted when CI stopped checking the backend against `openapi.yaml`
# (`engineering-decisions.md` E-14). What the description promised about the
# filter is API behaviour, so that half stays, on a fixed value from the 13.

#: A two-word value, so its kebab-case spelling differs from the titled one.
EXAMPLE = "Mountain West"


async def test_a_slug_form_of_a_region_matches_the_same_entities(
    client: httpx.AsyncClient,
) -> None:
    """A kebab-case spelling of a region returns the same rows as the canonical
    titled spelling (`backend/app/store.py` compares slugs)."""
    canonical = (await client.get("/entities", params={"region": EXAMPLE, "limit": 500})).json()
    slugged = (
        await client.get(
            "/entities", params={"region": EXAMPLE.lower().replace(" ", "-"), "limit": 500}
        )
    ).json()
    assert canonical["data"], f"no entity matched {EXAMPLE!r}"
    assert [row["id"] for row in slugged["data"]] == [row["id"] for row in canonical["data"]]


async def test_a_region_works_as_a_filter(client: httpx.AsyncClient) -> None:
    body = (await client.get("/entities", params={"region": EXAMPLE, "limit": 500})).json()
    assert body["data"], f"no entity matched {EXAMPLE!r}"
    assert {row["region"] for row in body["data"]} == {EXAMPLE}
