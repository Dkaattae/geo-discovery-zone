"""Session endpoints: serving, grading, undo, review rounds and the summary."""

from __future__ import annotations

from typing import Any

import httpx

from tests.conftest import DEMO_PROFILE_ID, assert_matches, assert_problem


async def start(
    client: httpx.AsyncClient, auth: dict[str, str], **body: Any
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    response = await client.post(
        "/sessions", headers=auth, json={"profileId": DEMO_PROFILE_ID, **body}
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    return payload["session"], payload.get("served")


async def answer(
    client: httpx.AsyncClient,
    auth: dict[str, str],
    session_id: str,
    served: dict[str, Any],
    *,
    correct: bool,
) -> dict[str, Any]:
    question = served["question"]
    choice = (
        question["correctIndex"]
        if correct
        else (question["correctIndex"] + 1) % len(question["choices"])
    )
    response = await client.post(
        f"/sessions/{session_id}/answers",
        headers=auth,
        json={"questionId": question["id"], "choiceIndex": choice},
    )
    assert response.status_code == 200, response.text
    return response.json()


async def next_question(
    client: httpx.AsyncClient, auth: dict[str, str], session_id: str, **body: Any
) -> dict[str, Any]:
    response = await client.post(
        f"/sessions/{session_id}/next-question", headers=auth, json=body or None
    )
    assert response.status_code == 200, response.text
    return response.json()


async def play(
    client: httpx.AsyncClient,
    auth: dict[str, str],
    session_id: str,
    served: dict[str, Any],
    outcomes: list[bool],
) -> dict[str, Any]:
    """Answers a run of questions, serving a fresh one between each."""
    result: dict[str, Any] = {}
    for index, correct in enumerate(outcomes):
        result = await answer(client, auth, session_id, served, correct=correct)
        if index < len(outcomes) - 1:
            served = await next_question(client, auth, session_id)
    return result


# -- access -----------------------------------------------------------------


async def test_session_endpoints_need_a_token(client: httpx.AsyncClient) -> None:
    assert (await client.post("/sessions", json={"profileId": DEMO_PROFILE_ID})).status_code == 401


async def test_a_session_cannot_be_started_for_another_accounts_profile(
    client: httpx.AsyncClient, other_auth: dict[str, str]
) -> None:
    assert_problem(
        await client.post("/sessions", headers=other_auth, json={"profileId": DEMO_PROFILE_ID}), 404
    )


async def test_another_account_cannot_read_a_session(
    client: httpx.AsyncClient, auth: dict[str, str], other_auth: dict[str, str]
) -> None:
    session, _ = await start(client, auth)
    assert_problem(await client.get(f"/sessions/{session['id']}", headers=other_auth), 404)


# -- starting ---------------------------------------------------------------


async def test_starting_a_session_serves_the_first_question(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    session, served = await start(client, auth)
    assert_matches(spec, "Session", session)
    assert served is not None
    assert_matches(spec, "ServedQuestion", served)
    assert served["index"] == 0
    assert served["phase"] == "PRESENTING"
    assert session["askedQuestionIds"] == [served["question"]["id"]]


async def test_the_first_question_carries_its_entity_for_the_map(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    _, served = await start(client, auth)
    assert served["entity"]["id"] == served["question"]["entityId"]


async def test_the_level_defaults_to_where_the_last_session_ended(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, _ = await start(client, auth)
    assert session["level"] == 6.0
    assert session["levelLabel"]["display"] == "3rd grade · Easy"


async def test_an_explicit_level_wins(client: httpx.AsyncClient, auth: dict[str, str]) -> None:
    session, _ = await start(client, auth, level=10)
    assert session["level"] == 10


async def test_a_session_can_start_without_serving(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth, serveFirstQuestion=False)
    assert served is None
    assert session["askedQuestionIds"] == []


async def test_a_topic_filters_every_question_served(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth, topic="capital")
    for _ in range(6):
        assert served["question"]["topic"] == "capital"
        await answer(client, auth, session["id"], served, correct=True)
        served = await next_question(client, auth, session["id"])


# -- serving ----------------------------------------------------------------


async def test_serving_advances_the_index_and_records_what_was_asked(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    await answer(client, auth, session["id"], served, correct=True)
    second = await next_question(client, auth, session["id"])
    assert second["index"] == 1
    assert second["question"]["id"] != served["question"]["id"]


async def test_asking_again_before_answering_re_serves_the_same_question(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    """A retried request must not skip a child past a question they never saw."""
    session, served = await start(client, auth)
    again = await next_question(client, auth, session["id"])
    assert again["question"]["id"] == served["question"]["id"]
    assert again["index"] == 0


async def test_a_question_can_be_served_without_its_answer_key(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    await answer(client, auth, session["id"], served, correct=True)
    withheld = await next_question(client, auth, session["id"], includeAnswerKey=False)
    assert "correctIndex" not in withheld["question"]


# -- answering --------------------------------------------------------------


async def test_a_correct_answer_returns_the_reward_and_the_key(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    session, served = await start(client, auth)
    result = await answer(client, auth, session["id"], served, correct=True)
    assert_matches(spec, "AnswerResult", result)
    assert result["correct"] is True
    assert result["reveal"]["tone"] == "reward"
    assert result["correctIndex"] == served["question"]["correctIndex"]
    assert result["session"]["counts"] == {
        "answered": 1,
        "correct": 1,
        "wrong": 0,
        "correctStreak": 1,
        "wrongStreak": 0,
    }


async def test_a_wrong_answer_returns_the_reason_and_queues_the_entity(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    result = await answer(client, auth, session["id"], served, correct=False)
    assert result["correct"] is False
    assert result["reveal"]["tone"] == "reason"
    assert result["reveal"]["nextEnabledAfterMs"] > 0
    assert served["question"]["entityId"] in result["profile"]["reviewQueue"]


async def test_the_profile_comes_back_advanced(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    session, served = await start(client, auth)
    result = await answer(client, auth, session["id"], served, correct=True)
    assert_matches(spec, "Profile", result["profile"])
    assert result["profile"]["stats"]["answered"] == 13  # the demo profile starts at 12
    assert result["profile"]["mastery"][served["question"]["entityId"]] > 0


async def test_answering_the_same_question_twice_is_refused(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    await answer(client, auth, session["id"], served, correct=True)
    repeat = await client.post(
        f"/sessions/{session['id']}/answers",
        headers=auth,
        json={"questionId": served["question"]["id"], "choiceIndex": 0},
    )
    assert_problem(repeat, 409)


async def test_answering_a_question_never_served_is_refused(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    other = "q-co-cap-1" if served["question"]["id"] != "q-co-cap-1" else "q-co-loc-1"
    response = await client.post(
        f"/sessions/{session['id']}/answers",
        headers=auth,
        json={"questionId": other, "choiceIndex": 0},
    )
    assert_problem(response, 409)


async def test_answering_an_unknown_question_is_a_404(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, _ = await start(client, auth)
    response = await client.post(
        f"/sessions/{session['id']}/answers",
        headers=auth,
        json={"questionId": "q-nope", "choiceIndex": 0},
    )
    assert_problem(response, 404)


async def test_an_answer_with_no_choice_cannot_be_graded(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    response = await client.post(
        f"/sessions/{session['id']}/answers",
        headers=auth,
        json={"questionId": served["question"]["id"]},
    )
    assert_problem(response, 422)


# -- level drift over the wire ---------------------------------------------


async def test_four_correct_in_a_row_raises_the_level_quietly(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    result = await play(client, auth, session["id"], served, [True] * 4)
    assert result["levelChange"] == 0.5
    assert result["profile"]["level"] == 6.5
    assert result["session"]["level"] == 6.5


async def test_three_wrong_in_a_row_drops_the_level_without_a_message(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    result = await play(client, auth, session["id"], served, [False] * 3)
    assert result["levelChange"] == -0.5
    assert result["profile"]["level"] == 5.5
    assert result["prompts"]["levelDroppedQuietly"] is True
    assert result["prompts"]["offerReview"] is False


async def test_a_level_change_is_absent_when_nothing_moved(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    result = await answer(client, auth, session["id"], served, correct=True)
    assert result.get("levelChange") is None


async def test_a_milestone_offers_a_stopping_point(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    result = await play(client, auth, session["id"], served, [True, False] * 2 + [True])
    assert result["prompts"]["milestone"] == 5


# -- undo -------------------------------------------------------------------


async def test_undo_backs_out_the_answer_and_its_profile_effects(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    before = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth)).json()

    result = await answer(client, auth, session["id"], served, correct=False)
    undone = await client.delete(
        f"/sessions/{session['id']}/answers/{result['answerId']}", headers=auth
    )
    assert undone.status_code == 204

    after = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth)).json()
    assert after == before

    state = (await client.get(f"/sessions/{session['id']}", headers=auth)).json()
    assert state["counts"]["answered"] == 0
    assert state["counts"]["wrongStreak"] == 0


async def test_the_question_returns_to_presenting_after_an_undo(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    result = await answer(client, auth, session["id"], served, correct=False)
    await client.delete(f"/sessions/{session['id']}/answers/{result['answerId']}", headers=auth)

    back = await next_question(client, auth, session["id"])
    assert back["question"]["id"] == served["question"]["id"]
    assert back["phase"] == "PRESENTING"
    assert back["index"] == 0


async def test_the_same_answer_cannot_be_undone_twice(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    result = await answer(client, auth, session["id"], served, correct=True)
    path = f"/sessions/{session['id']}/answers/{result['answerId']}"
    assert (await client.delete(path, headers=auth)).status_code == 204
    assert_problem(await client.delete(path, headers=auth), 404)


async def test_only_the_most_recent_answer_can_be_undone(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    first = await answer(client, auth, session["id"], served, correct=True)
    second_served = await next_question(client, auth, session["id"])
    await answer(client, auth, session["id"], second_served, correct=True)

    assert_problem(
        await client.delete(f"/sessions/{session['id']}/answers/{first['answerId']}", headers=auth),
        409,
    )


async def test_undoing_an_unknown_answer_is_a_404(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, _ = await start(client, auth)
    assert_problem(
        await client.delete(f"/sessions/{session['id']}/answers/a-nope", headers=auth), 404
    )


# -- review rounds ----------------------------------------------------------


async def test_a_review_round_serves_from_the_queue(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    session, _ = await start(client, auth, serveFirstQuestion=False)
    response = await client.post(f"/sessions/{session['id']}/review-round", headers=auth, json={})
    assert response.status_code == 200
    body = response.json()
    assert_matches(spec, "ServedQuestion", body["served"])
    # The demo profile has Texas queued.
    assert body["served"]["question"]["entityId"] == "us-state-tx"
    assert body["served"]["isReview"] is True


async def test_a_review_round_is_capped_by_the_queue(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, _ = await start(client, auth, serveFirstQuestion=False)
    body = (
        await client.post(
            f"/sessions/{session['id']}/review-round", headers=auth, json={"length": 5}
        )
    ).json()
    assert body["remaining"] == 0  # one entity queued, so one review question


async def test_a_review_round_needs_something_to_review(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    await client.delete(f"/profiles/{DEMO_PROFILE_ID}/review-queue/us-state-tx", headers=auth)
    session, _ = await start(client, auth, serveFirstQuestion=False)
    assert_problem(
        await client.post(f"/sessions/{session['id']}/review-round", headers=auth, json={}), 409
    )


async def test_a_review_round_is_never_longer_than_five(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, _ = await start(client, auth, serveFirstQuestion=False)
    assert_problem(
        await client.post(
            f"/sessions/{session['id']}/review-round", headers=auth, json={"length": 6}
        ),
        422,
    )


async def test_a_review_question_is_not_labelled_to_the_kid(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    """`isReview` is a flag for the client, never text in the prompt."""
    session, _ = await start(client, auth, serveFirstQuestion=False)
    body = (
        await client.post(f"/sessions/{session['id']}/review-round", headers=auth, json={})
    ).json()
    assert "review" not in body["served"]["question"]["prompt"].lower()


# -- ending -----------------------------------------------------------------


async def test_ending_writes_the_end_level_and_reports_places_learned(
    client: httpx.AsyncClient, auth: dict[str, str], spec: dict[str, Any]
) -> None:
    session, served = await start(client, auth, level=8)
    await play(client, auth, session["id"], served, [True, True])

    summary = (await client.post(f"/sessions/{session['id']}/end", headers=auth)).json()
    assert_matches(spec, "SessionSummary", summary)
    assert summary["answered"] == 2
    assert summary["endLevel"] == 8
    assert "%" not in summary["headline"]

    profile = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth)).json()
    assert profile["lastSessionEndLevel"] == 8


async def test_the_summary_counts_places_learned_this_session(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth, topic="location")
    await play(client, auth, session["id"], served, [True] * 8)

    summary = (await client.post(f"/sessions/{session['id']}/end", headers=auth)).json()
    state = (await client.get(f"/sessions/{session['id']}", headers=auth)).json()
    profile = (await client.get(f"/profiles/{DEMO_PROFILE_ID}", headers=auth)).json()

    assert summary["placesSeen"] == len(state["seenEntityIds"])
    assert summary["learnedCount"] == len(summary["learnedEntityIds"])
    # Everything reported as learned really did cross the mastery line, here.
    assert set(summary["learnedEntityIds"]) <= set(state["seenEntityIds"])
    assert all(profile["mastery"][entity_id] > 0.7 for entity_id in summary["learnedEntityIds"])
    assert "us-state-co" not in summary["learnedEntityIds"]  # already mastered before the session


async def test_an_ended_session_serves_nothing_more(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    await client.post(f"/sessions/{session['id']}/end", headers=auth)

    assert_problem(
        await client.post(f"/sessions/{session['id']}/next-question", headers=auth, json={}), 409
    )
    response = await client.post(
        f"/sessions/{session['id']}/answers",
        headers=auth,
        json={"questionId": served["question"]["id"], "choiceIndex": 0},
    )
    assert_problem(response, 409)


async def test_ending_twice_returns_the_same_summary(
    client: httpx.AsyncClient, auth: dict[str, str]
) -> None:
    session, served = await start(client, auth)
    await answer(client, auth, session["id"], served, correct=True)
    first = (await client.post(f"/sessions/{session['id']}/end", headers=auth)).json()
    second = (await client.post(f"/sessions/{session['id']}/end", headers=auth)).json()
    assert first == second


async def test_an_unknown_session_is_a_404(client: httpx.AsyncClient, auth: dict[str, str]) -> None:
    assert_problem(await client.get("/sessions/s-nope", headers=auth), 404)
