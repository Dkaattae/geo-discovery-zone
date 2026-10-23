"""The T-050 measurement script, on inline fixtures.

Nothing here reads `app/data/content.json`: the bank's counts change with every
regeneration (T-088, T-051), and the numbers E-26 records are a snapshot, not
something a test should pin.
"""

from __future__ import annotations

from scripts.measure_selection import (
    SESSION_LEVELS,
    TOPIC_CHOICES,
    first_span,
    level_extremes,
    phrase_counts,
    pool_size,
    table_a,
    table_b,
    table_c,
)


def q(
    qid: str,
    level: float,
    *,
    topic: str = "location",
    entity: str = "us-state-aa",
    template: str = "tpl-identify-on-map",
    choices: tuple[str, ...] = ("A", "B", "C", "D"),
    correct: int = 0,
) -> dict[str, object]:
    return {
        "id": qid,
        "level": level,
        "topic": topic,
        "entityId": entity,
        "templateId": template,
        "choices": list(choices),
        "correctIndex": correct,
    }


def test_the_session_levels_are_every_half_step_from_0_to_18() -> None:
    assert SESSION_LEVELS[0] == 0 and SESSION_LEVELS[-1] == 18
    assert all(b - a == 0.5 for a, b in zip(SESSION_LEVELS, SESSION_LEVELS[1:], strict=False))


def test_a_question_exactly_one_span_away_is_in_the_pool() -> None:
    questions = [q("edge", 6.5), q("past", 6.51)]
    assert pool_size(questions, 5.0, "location", 1.5) == 1


def test_mixed_counts_every_topic_and_a_topic_only_its_own() -> None:
    questions = [q("a", 5, topic="location"), q("b", 5, topic="capital")]
    assert pool_size(questions, 5, "mixed", 1.5) == 2
    assert pool_size(questions, 5, "capital", 1.5) == 1
    assert pool_size(questions, 5, "climate", 1.5) == 0


def test_first_span_is_the_first_that_reaches_a_question() -> None:
    questions = [q("a", 10)]
    assert first_span(questions, 10, "location") == 1.5
    assert first_span(questions, 7, "location") == 3.0
    assert first_span(questions, 4, "location") == 6.0
    assert first_span(questions, 0, "location") == 99.0
    assert first_span(questions, 10, "capital") is None


def test_table_a_has_a_cell_for_every_level_and_topic() -> None:
    table = table_a([q("a", 3)])
    assert list(table) == list(SESSION_LEVELS)
    assert all(list(cells) == list(TOPIC_CHOICES) for cells in table.values())
    assert table[3.0]["location"] == (1, 1.5)
    assert table[0.0]["mixed"] == (0, 3.0)


def test_table_b_buckets_by_floor_of_half_the_level_and_counts_flagged_rows() -> None:
    questions = [q("a", 3.5), q("b", 4), q("c", 5.5), q("d", 18)]
    table = table_b(questions, flagged_ids=frozenset({"c"}))
    assert table[1] == (1, 0)
    assert table[2] == (2, 1)
    assert table[9] == (1, 0)
    assert table[0] == (0, 0)
    assert sum(count for count, _ in table.values()) == len(questions)


def test_level_extremes_name_every_question_at_the_extreme() -> None:
    questions = [
        q("a", 3, entity="us-state-ca", template="tpl-x"),
        q("b", 3, entity="us-state-tx", template="tpl-x"),
        q("c", 7, entity="us-state-ri", template="tpl-y"),
    ]
    (low, low_at), (high, high_at) = level_extremes(questions)
    assert low == 3 and low_at == [("tpl-x", "us-state-ca"), ("tpl-x", "us-state-tx")]
    assert high == 7 and high_at == [("tpl-y", "us-state-ri")]


def test_table_c_counts_per_entity_and_the_entities_with_none() -> None:
    questions = [
        q("a", 5, topic="landmark", entity="us-state-aa"),
        q("b", 5, topic="landmark", entity="us-state-aa"),
        q("c", 5, topic="capital", entity="us-state-bb"),
    ]
    table = table_c(questions, ["us-state-aa", "us-state-bb"], topics=("mixed", "landmark"))
    assert table["mixed"] == (1, 2, 0)
    assert table["landmark"] == (0, 2, 1)


def test_phrase_counts_look_only_at_wrong_choices_of_the_template() -> None:
    hot, cold = "hot all year", "cold all year"
    questions = [
        q("both", 5, template="tpl-climate-of", choices=("x", hot, cold, "y")),
        q("one", 5, template="tpl-climate-of", choices=("x", hot, "y", "z")),
        q("answer", 5, template="tpl-climate-of", choices=(cold, "x", "y", "z")),
        q("other-template", 5, template="tpl-capital-of", choices=("x", hot, cold, "y")),
    ]
    assert phrase_counts(questions, [hot, cold], "tpl-climate-of") == (2, 1)
