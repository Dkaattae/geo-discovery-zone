"""T-068 verification (tester): `top_livestock` in the contract and the served model.

Written from the acceptance criteria in `tasks/T-068-top-livestock.md`, not
from the implementation. Criteria 17 and 18 are asserted here, where the YAML
parser and the model already live; criterion 19 is the existing contract walk
(`test_climate_koppen_t067_criteria.py`'s "same entity fields" test and
`conftest.assert_matches`), re-checked here for the new field in both
directions. The pipeline criteria are in
`question-bank/src/top-livestock-verify.test.ts`.

No network: local files and the in-process model only.
"""

from __future__ import annotations

from typing import Any

import pytest
from pydantic import ValidationError

from app.models import Entity
from tests.conftest import assert_matches


def entity_schema(spec: dict[str, Any]) -> dict[str, Any]:
    return spec["components"]["schemas"]["Entity"]


def model_aliases() -> set[str]:
    return {field.alias or name for name, field in Entity.model_fields.items()}


# -- criterion 17 -------------------------------------------------------------


def test_criterion_17_entity_schema_has_top_livestock_as_array_of_string(
    spec: dict[str, Any],
) -> None:
    prop = entity_schema(spec)["properties"]["topLivestock"]
    assert prop["type"] == "array"
    assert prop["items"]["type"] == "string"


def test_criterion_17_top_crops_is_still_an_array_of_string(spec: dict[str, Any]) -> None:
    prop = entity_schema(spec)["properties"]["topCrops"]
    assert prop["type"] == "array"
    assert prop["items"]["type"] == "string"


def test_criterion_17_top_livestock_is_not_required(spec: dict[str, Any]) -> None:
    # "optional" on the model side (criterion 18) has to agree with the contract.
    assert "topLivestock" not in entity_schema(spec).get("required", [])


# -- criterion 18 -------------------------------------------------------------


BASE = {"id": "us-state-wi", "type": "state", "name": "Wisconsin"}


def test_criterion_18_model_has_top_livestock_and_still_top_crops() -> None:
    assert "top_livestock" in Entity.model_fields
    assert "top_crops" in Entity.model_fields


def test_criterion_18_top_livestock_is_optional() -> None:
    entity = Entity.model_validate(BASE)
    assert entity.top_livestock is None
    assert not Entity.model_fields["top_livestock"].is_required()


def test_criterion_18_accepts_a_list_of_strings_from_the_pipeline_key() -> None:
    entity = Entity.model_validate({**BASE, "top_livestock": ["dairy cows"]})
    assert entity.top_livestock == ["dairy cows"]


def test_criterion_18_accepts_an_empty_list() -> None:
    entity = Entity.model_validate({**BASE, "top_livestock": []})
    assert entity.top_livestock == []


def test_criterion_18_rejects_a_non_string_item() -> None:
    with pytest.raises(ValidationError):
        Entity.model_validate({**BASE, "top_livestock": [{"animal": "cow"}]})


def test_criterion_18_rejects_a_bare_string_where_the_list_belongs() -> None:
    with pytest.raises(ValidationError):
        Entity.model_validate({**BASE, "top_livestock": "dairy cows"})


def test_criterion_18_serialises_as_top_livestock_camel_case() -> None:
    dumped = Entity.model_validate({**BASE, "top_livestock": ["dairy cows"]}).model_dump(
        by_alias=True, exclude_none=True
    )
    assert dumped["topLivestock"] == ["dairy cows"]
    assert "top_livestock" not in dumped


# -- criterion 19 -------------------------------------------------------------


def test_criterion_19_contract_and_model_declare_the_same_entity_fields(
    spec: dict[str, Any],
) -> None:
    properties = set(entity_schema(spec)["properties"])
    aliases = model_aliases()
    assert "topLivestock" in properties
    assert "topLivestock" in aliases
    assert properties == aliases


def test_criterion_19_a_served_entity_with_top_livestock_matches_the_contract(
    spec: dict[str, Any],
) -> None:
    payload = Entity.model_validate(
        {**BASE, "top_crops": ["corn"], "top_livestock": ["dairy cows"]}
    ).model_dump(by_alias=True, exclude_none=True)
    assert_matches(spec, "Entity", payload)
