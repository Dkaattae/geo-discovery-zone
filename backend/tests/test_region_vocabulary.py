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
* **5** — `openapi.yaml`'s `Region` parameter description gives an example the
  API actually returns. The spec is already loaded here by the `spec` fixture
  that `test_contract.py` uses.

No network: every assertion reads a committed file or goes through the app with
the in-process test client.
"""

from __future__ import annotations

import json
import re
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


def test_the_fifteen_served_states_keep_the_region_they_carry_today() -> None:
    served = {entity["name"]: entity.get("region") for entity in content()["entities"]}
    assert served == ANCHORS


def test_content_json_still_serves_exactly_those_fifteen_states() -> None:
    """Criterion 3 freezes 15 rows; a 16th would mean the file was edited."""
    entities = content()["entities"]
    assert len(entities) == 15
    assert {entity["name"] for entity in entities} == set(ANCHORS)


async def test_the_api_returns_the_same_region_for_each_anchor(
    client: httpx.AsyncClient,
) -> None:
    body = (await client.get("/entities", params={"limit": 500})).json()
    served = {row["name"]: row.get("region") for row in body["data"]}
    assert served == ANCHORS


# -- criterion 4 -------------------------------------------------------------


def test_no_region_in_content_json_is_outside_the_thirteen() -> None:
    assert region_offenders(content(), "backend/app/data/content.json") == []


def test_both_entities_and_questions_in_content_json_were_checked() -> None:
    """A scan that found nothing to scan would pass the test above for free."""
    document = content()
    entity_regions = [entity.get("region") for entity in document["entities"]]
    question_regions = [question.get("region") for question in document["questions"]]
    assert len(entity_regions) == 15
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


def region_parameter_description(spec: dict[str, Any]) -> str:
    return spec["components"]["parameters"]["Region"]["description"]


def region_examples(spec: dict[str, Any]) -> list[str]:
    """The backticked example values in the Region parameter's description."""
    return re.findall(r"`([^`]+)`", region_parameter_description(spec))


def test_the_region_parameter_description_gives_at_least_one_example(
    spec: dict[str, Any],
) -> None:
    assert region_examples(spec), region_parameter_description(spec)


def test_every_region_example_in_the_contract_is_a_value_the_api_returns(
    spec: dict[str, Any],
) -> None:
    served = {entity.get("region") for entity in content()["entities"]}
    unreal = [value for value in region_examples(spec) if value not in served]
    assert unreal == [], f"examples the API never returns: {unreal}"


def test_no_region_example_in_the_contract_is_a_kebab_case_slug(
    spec: dict[str, Any],
) -> None:
    """The exact defect criterion 5 names: `mountain-west`, `europe`,
    `southeast-asia` were fabricated and matched nothing the API stores."""
    description = region_parameter_description(spec)
    for fabricated in ("mountain-west", "europe", "southeast-asia"):
        assert fabricated not in description
    slug = re.compile(r"[a-z0-9]+(-[a-z0-9]+)*")
    slugs = [value for value in region_examples(spec) if slug.fullmatch(value)]
    assert slugs == []


def test_the_region_parameter_is_still_a_plain_string_with_no_schema_change(
    spec: dict[str, Any],
) -> None:
    """Criterion 5 is documentation text only, and Out of scope rules out an
    enum; a schema change here would be outside the task."""
    parameter = spec["components"]["parameters"]["Region"]
    assert parameter["schema"] == {"type": "string"}
    assert parameter["in"] == "query"
    assert parameter["name"] == "region"


def test_the_description_does_not_claim_a_matching_rule_stricter_than_the_api(
    spec: dict[str, Any],
) -> None:
    """The first round of this task shipped "matched against Entity.region
    exactly", which `backend/app/store.py`'s slug comparison contradicts. The
    point of T-017 is that the contract and the data stop disagreeing about
    `region`, so a claim of exactness is a claim the served behaviour has to
    honour — and it does not (see the behavioural test below)."""
    description = region_parameter_description(spec).lower()
    assert "exactly" not in description
    assert "case- and hyphen-insensitively" in description


async def test_a_slug_form_of_a_documented_example_matches_the_same_entities(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    """The behavioural half: whatever the description claims about matching has
    to be true of the API. A kebab-case spelling of a documented example returns
    the same rows as the canonical titled spelling."""
    example = next(value for value in region_examples(spec) if value in VOCABULARY)
    canonical = (await client.get("/entities", params={"region": example, "limit": 500})).json()
    slugged = (
        await client.get(
            "/entities", params={"region": example.lower().replace(" ", "-"), "limit": 500}
        )
    ).json()
    assert canonical["data"], f"no entity matched the documented example {example!r}"
    assert [row["id"] for row in slugged["data"]] == [row["id"] for row in canonical["data"]]


async def test_the_documented_example_works_as_a_filter(
    client: httpx.AsyncClient, spec: dict[str, Any]
) -> None:
    """An example the contract gives has to be usable, not merely real."""
    usable = [value for value in region_examples(spec) if value in VOCABULARY]
    assert usable, f"no example in the description is one of the 13: {region_examples(spec)}"
    example = usable[0]
    body = (await client.get("/entities", params={"region": example, "limit": 500})).json()
    assert body["data"], f"no entity matched the documented example {example!r}"
    assert {row["region"] for row in body["data"]} == {example}
