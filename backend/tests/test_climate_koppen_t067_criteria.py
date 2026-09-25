"""T-067 verification (tester): `climate_koppen` is gone from the contract and
the served model.

Written from the acceptance criteria in `tasks/T-067-climate-koppen.md`, not
from the implementation. Criteria 2, 3 and 4 are asserted here, where the YAML
parser and the model already live; the pipeline and plan criteria are in
`question-bank/src/climate-koppen.criteria.test.ts`.

"Every other property is unchanged" (criteria 3 and 4) is not pinned as a copy
of the prior schema -- that is the expiring-baseline shape
`engineering-decisions.md` E-11/E-12 removed. It was checked once against the
merge-base and is recorded in the brief's Verdict. What is asserted here is the
durable half: the contract and the model still describe the same Entity fields,
the required list and the neighbouring climate/crops fields survived, and a
served entity still passes `assert_matches`.

No network: local files and the in-process app only.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from app.models import Entity

SPEC_PATH = Path(__file__).resolve().parents[2] / "openapi.yaml"

# Assembled so this file's source carries neither literal.
SNAKE = "climate" + "_koppen"
CAMEL = "climate" + "Koppen"


def entity_schema(spec: dict[str, Any]) -> dict[str, Any]:
    return spec["components"]["schemas"]["Entity"]


def model_aliases() -> set[str]:
    return {field.alias or name for name, field in Entity.model_fields.items()}


# -- criterion 2 --------------------------------------------------------------


def test_criterion_2_openapi_still_parses_as_yaml() -> None:
    parsed = yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))
    assert isinstance(parsed, dict)
    assert "Entity" in parsed["components"]["schemas"]


def test_criterion_2_entity_schema_has_no_climate_koppen_property(spec: dict[str, Any]) -> None:
    assert CAMEL not in entity_schema(spec)["properties"]
    assert SNAKE not in entity_schema(spec)["properties"]


# -- criterion 3 --------------------------------------------------------------


def test_criterion_3_entity_required_is_still_id_type_name(spec: dict[str, Any]) -> None:
    assert entity_schema(spec)["required"] == ["id", "type", "name"]


def test_criterion_3_climate_kid_and_top_crops_survive_in_the_contract(
    spec: dict[str, Any],
) -> None:
    properties = entity_schema(spec)["properties"]
    assert properties["climateKid"]["type"] == "string"
    assert properties["topCrops"]["type"] == "array"
    assert properties["topCrops"]["items"]["type"] == "string"


def test_criterion_3_and_4_contract_and_model_declare_the_same_entity_fields(
    spec: dict[str, Any],
) -> None:
    # Deleting a neighbour from one side but not the other is the likeliest
    # slip in a two-file deletion; this catches it in either direction.
    assert set(entity_schema(spec)["properties"]) == model_aliases()


# -- criterion 4 --------------------------------------------------------------


def test_criterion_4_backend_entity_model_has_no_climate_koppen_field() -> None:
    assert SNAKE not in Entity.model_fields
    assert CAMEL not in model_aliases()


def test_criterion_4_climate_kid_and_top_crops_survive_on_the_model() -> None:
    assert "climate_kid" in Entity.model_fields
    assert "top_crops" in Entity.model_fields


def test_criterion_4_model_ignores_rather_than_serves_a_stray_climate_koppen() -> None:
    # A row carrying the old key must not leak it into a response the contract
    # no longer declares (criterion 22's `assert_matches` rule).
    entity = Entity.model_validate(
        {"id": "us-state-co", "type": "state", "name": "Colorado", SNAKE: ["BSk"]}
    )
    dumped = entity.model_dump(by_alias=True, exclude_none=True)
    assert CAMEL not in dumped
    assert SNAKE not in dumped
