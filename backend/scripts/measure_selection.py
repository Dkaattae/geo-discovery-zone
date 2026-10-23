"""Measure how selection and the seeded levels behave over the served bank (T-050).

Prints the tables `engineering-decisions.md` E-26 records. Nothing under
`app/` imports this module, and it changes nothing: it reads
`app/data/content.json` and the pipeline's `climate_kid` phrases, and times
`store.candidate_questions` against a throwaway SQLite file.

    cd backend && uv run python scripts/measure_selection.py          # tables A-D and E
    cd backend && uv run python scripts/measure_selection.py --no-timing

No network. The measurement functions are pure, over plain question dicts, so
`tests/test_measure_selection.py` checks them on inline fixtures rather than on
the bank, whose counts change with every regeneration.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import platform
import statistics
import sys
import tempfile
import time
from collections.abc import Iterable, Mapping, Sequence
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.selection import LEVEL_SPANS, topic_matches  # noqa: E402

CONTENT_FILE = BACKEND_DIR / "app" / "data" / "content.json"
STATES_DIR = BACKEND_DIR.parent / "question-bank" / "data" / "us-states"

TOPIC_CHOICES = (
    "mixed",
    "location",
    "capital",
    "superlative",
    "wildlife",
    "landmark",
    "climate",
    "agriculture",
)
SESSION_LEVELS = tuple(step / 2 for step in range(0, 37))  # 0, 0.5, ... 18
GRADES = tuple(range(0, 10))

# The T-025 rows T-085 owns that are served (`tpl-click-the-map` is not, E-24).
T085_QUESTION_IDS = frozenset(
    {
        "gen:tpl-identify-on-map:us-state-hi",
        "gen:tpl-identify-on-map:us-state-ak",
        "gen:tpl-capital-of:us-state-co",
        "gen:tpl-capital-of:us-state-hi",
    }
)

CLIMATE_TEMPLATE = "tpl-climate-of"
HAND_CHECK_STATES = ("ca", "tx", "fl", "ny", "wa", "co", "ky", "hi", "ak", "ri")


# -- pure measurements ------------------------------------------------------


def pool_size(questions: Iterable[Mapping[str, Any]], level: float, topic: str, span: float) -> int:
    """Questions in `topic` within `span` of `level`, boundary inclusive, as
    `selection.pick_question` filters a session with nothing asked yet."""
    return sum(1 for q in questions if topic_matches(q, topic) and abs(q["level"] - level) <= span)


def first_span(questions: Sequence[Mapping[str, Any]], level: float, topic: str) -> float | None:
    """The first `LEVEL_SPANS` value whose pool is non-empty, or `None`."""
    for span in LEVEL_SPANS:
        if pool_size(questions, level, topic, span):
            return span
    return None


def table_a(
    questions: Sequence[Mapping[str, Any]],
    levels: Sequence[float] = SESSION_LEVELS,
    topics: Sequence[str] = TOPIC_CHOICES,
) -> dict[float, dict[str, tuple[int, float | None]]]:
    """level -> topic -> (pool within the first span, first non-empty span)."""
    first = LEVEL_SPANS[0]
    return {
        level: {
            topic: (pool_size(questions, level, topic, first), first_span(questions, level, topic))
            for topic in topics
        }
        for level in levels
    }


def table_b(
    questions: Iterable[Mapping[str, Any]],
    grades: Sequence[int] = GRADES,
    flagged_ids: frozenset[str] = T085_QUESTION_IDS,
) -> dict[int, tuple[int, int]]:
    """grade (`floor(level / 2)`) -> (questions, of which flagged)."""
    rows = {grade: [0, 0] for grade in grades}
    for q in questions:
        grade = math.floor(q["level"] / 2)
        row = rows.setdefault(grade, [0, 0])
        row[0] += 1
        if q["id"] in flagged_ids:
            row[1] += 1
    return {grade: (row[0], row[1]) for grade, row in rows.items()}


def level_extremes(
    questions: Sequence[Mapping[str, Any]],
) -> tuple[tuple[float, list[tuple[str, str]]], tuple[float, list[tuple[str, str]]]]:
    """(lowest, [(template, entity), ...]), (highest, [...])."""

    def at(level: float) -> list[tuple[str, str]]:
        return sorted((q["templateId"], q["entityId"]) for q in questions if q["level"] == level)

    low = min(q["level"] for q in questions)
    high = max(q["level"] for q in questions)
    return (low, at(low)), (high, at(high))


def table_c(
    questions: Sequence[Mapping[str, Any]],
    entity_ids: Sequence[str],
    topics: Sequence[str] = TOPIC_CHOICES,
) -> dict[str, tuple[int, int, int]]:
    """topic -> (min per entity, max per entity, entities with none).

    The size of a single-topic review pool for one queued entity before the
    recent window is applied: `review_pool` over `candidate_questions(topic)`.
    """
    result = {}
    for topic in topics:
        counts = [
            sum(1 for q in questions if q["entityId"] == entity and topic_matches(q, topic))
            for entity in entity_ids
        ]
        result[topic] = (min(counts), max(counts), sum(1 for c in counts if c == 0))
    return result


def distractors(question: Mapping[str, Any]) -> list[str]:
    return [c for i, c in enumerate(question["choices"]) if i != question["correctIndex"]]


def phrase_counts(
    questions: Iterable[Mapping[str, Any]], phrases: Sequence[str], template_id: str
) -> tuple[int, int]:
    """(questions of `template_id` offering at least one of `phrases` as a wrong
    choice, questions offering all of them)."""
    wanted = set(phrases)
    any_count = all_count = 0
    for q in questions:
        if q["templateId"] != template_id:
            continue
        offered = wanted & set(distractors(q))
        any_count += bool(offered)
        all_count += offered == wanted
    return any_count, all_count


# -- the bank ---------------------------------------------------------------


def load_content(path: Path = CONTENT_FILE) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def climate_kid(state_code: str, states_dir: Path = STATES_DIR) -> str:
    record = json.loads((states_dir / f"us-state-{state_code}.json").read_text(encoding="utf-8"))
    return record["climate_kid"]


def time_candidate_questions(
    topics: Sequence[str], calls: int, path: Path = CONTENT_FILE
) -> dict[str, list[float]]:
    """Seconds per `store.candidate_questions` call, on a temporary SQLite file
    with the served bank loaded by `store.ensure_content_loaded`."""
    from sqlalchemy.orm import Session

    from app import db, orm, store

    with tempfile.TemporaryDirectory() as directory:
        engine = db.configure(f"sqlite:///{Path(directory) / 'measure.db'}")
        orm.Base.metadata.create_all(engine)
        with Session(bind=engine) as session:
            store.ensure_content_loaded(session, path=path)
            session.commit()
        timings: dict[str, list[float]] = {}
        with Session(bind=engine) as session:
            for topic in topics:
                store.candidate_questions(session, topic)  # warm-up, not counted
                samples = []
                for _ in range(calls):
                    session.expunge_all()
                    start = time.perf_counter()
                    store.candidate_questions(session, topic)
                    samples.append(time.perf_counter() - start)
                timings[topic] = samples
        engine.dispose()
    return timings


# -- printing ---------------------------------------------------------------


def _num(value: float | None) -> str:
    if value is None:
        return "none"
    return f"{value:g}"


def _state(entity_id: str) -> str:
    return entity_id.removeprefix("us-state-").upper()


def report(content: Mapping[str, Any], *, timing_calls: int) -> str:
    questions = content["questions"]
    entity_ids = sorted(e["id"] for e in content["entities"] if e.get("type") == "state")
    raw = CONTENT_FILE.read_bytes()
    out: list[str] = []
    out.append(f"content.json sha256 {hashlib.sha256(raw).hexdigest()}")
    out.append(f"served questions {len(questions)}, states {len(entity_ids)}")
    per_topic = {t: pool_size(questions, 0, t, 99.0) for t in TOPIC_CHOICES}
    out.append("per topic " + ", ".join(f"{t} {n}" for t, n in per_topic.items()))

    out.append("\n### Table A — pool within 1.5 / first non-empty span\n")
    out.append("| Level | " + " | ".join(f"`{t}`" for t in TOPIC_CHOICES) + " |")
    out.append("|---" * (len(TOPIC_CHOICES) + 1) + "|")
    for level, cells in table_a(questions).items():
        row = " | ".join(f"{n} / {_num(span)}" for n, span in cells.values())
        out.append(f"| {_num(level)} | {row} |")

    out.append("\n### Table B — grade = floor(level / 2)\n")
    out.append("| Grade | Questions | Of which T-085 rows |")
    out.append("|---|---|---|")
    total = 0
    for grade, (count, flagged) in table_b(questions).items():
        total += count
        out.append(f"| {grade} | {count} | {flagged} |")
    out.append(f"| total | {total} | {len(T085_QUESTION_IDS & {q['id'] for q in questions})} |")
    (low, low_at), (high, high_at) = level_extremes(questions)
    out.append(f"\nlowest {_num(low)}: " + ", ".join(f"{t} {_state(e)}" for t, e in low_at))
    out.append(f"highest {_num(high)}: " + ", ".join(f"{t} {_state(e)}" for t, e in high_at))

    out.append("\n### Table C — questions about one state, per topic\n")
    out.append("| Topic | Min | Max | States with none |")
    out.append("|---|---|---|---|")
    for topic, (lo, hi, zero) in table_c(questions, entity_ids).items():
        out.append(f"| `{topic}` | {lo} | {hi} | {zero} |")

    out.append("\n### Table D — tpl-climate-of for the T-025 states\n")
    by_id = {q["id"]: q for q in questions}
    for code in HAND_CHECK_STATES:
        q = by_id.get(f"gen:{CLIMATE_TEMPLATE}:us-state-{code}")
        if q is None:
            out.append(f"{code.upper()}: no served question")
            continue
        out.append(f"{code.upper()} | level {_num(q['level'])} | {q['prompt']}")
        out.append(f"    correct: {q['choices'][q['correctIndex']]}")
        for choice in distractors(q):
            out.append(f"    wrong:   {choice}")
    hi, ak = climate_kid("hi"), climate_kid("ak")
    any_count, both = phrase_counts(questions, [hi, ak], CLIMATE_TEMPLATE)
    climate_total = sum(1 for q in questions if q["templateId"] == CLIMATE_TEMPLATE)
    out.append(
        f"\n{CLIMATE_TEMPLATE}: {climate_total} served; "
        f"Hawaii's or Alaska's phrase as a wrong choice in {any_count}; both in {both}"
    )

    if timing_calls:
        out.append("\n### E — store.candidate_questions wall time (SQLite)\n")
        for topic, samples in time_candidate_questions(
            ("mixed", "agriculture"), timing_calls
        ).items():
            median_ms = statistics.median(samples) * 1000
            out.append(f"`{topic}`: median {median_ms:.3f} ms over {len(samples)} calls")
        out.append(
            f"on {platform.platform()}, {platform.machine()}, "
            f"Python {platform.python_version()}, {platform.processor() or 'cpu n/a'}"
        )
    return "\n".join(out)


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--calls", type=int, default=200, help="timed calls per topic")
    parser.add_argument("--no-timing", action="store_true", help="skip section E")
    args = parser.parse_args(argv)
    print(report(load_content(), timing_calls=0 if args.no_timing else args.calls))


if __name__ == "__main__":
    main()
