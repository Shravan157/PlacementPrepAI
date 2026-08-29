"""tests/test_evaluation.py — Unit and integration tests for answer evaluation endpoints."""

import pytest


@pytest.fixture
def auth_headers(client):
    """Register a user and return Authorization headers."""
    client.post(
        "/auth/register",
        json={"email": "eval_student@example.com", "password": "password123", "name": "Eval Student"},
    )
    res = client.post(
        "/auth/login",
        json={"email": "eval_student@example.com", "password": "password123"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_evaluation_flow(client, auth_headers):
    # 1. Generate Question
    q_res = client.post(
        "/practice/questions",
        json={"subject": "dbms", "topic": "indexing", "difficulty_tag": "medium", "generation_method": "rag_generated"},
        headers=auth_headers,
    )
    assert q_res.status_code == 201
    question_id = q_res.json()["id"]

    # 2. Submit Answer
    ans_res = client.post(
        "/practice/answers",
        json={
            "question_id": question_id,
            "answer_text": "B-Tree indexes speed up query retrieval by organizing key values in a balanced hierarchical search tree because node splits maintain logarithmic height.",
        },
        headers=auth_headers,
    )
    assert ans_res.status_code == 201
    answer_id = ans_res.json()["id"]

    # 3. Evaluate Answer
    eval_res = client.post(
        "/evaluation/evaluate",
        json={"answer_id": answer_id},
        headers=auth_headers,
    )
    assert eval_res.status_code == 201
    eval_data = eval_res.json()
    assert eval_data["answer_id"] == answer_id
    assert 0 <= eval_data["correctness_score"] <= 10
    assert 0 <= eval_data["completeness_score"] <= 10
    assert 0 <= eval_data["clarity_score"] <= 10
    assert "overall_score" in eval_data
    assert isinstance(eval_data["feedback_text"], str)

    # 4. Fetch Evaluation by Answer ID
    get_eval_res = client.get(f"/evaluation/{answer_id}", headers=auth_headers)
    assert get_eval_res.status_code == 200
    assert get_eval_res.json()["id"] == eval_data["id"]
