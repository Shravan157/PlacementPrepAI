"""tests/test_practice.py — Unit and integration tests for practice endpoints."""

import pytest


@pytest.fixture
def auth_headers(client):
    """Register a user and return Authorization headers."""
    client.post(
        "/auth/register",
        json={"email": "student@example.com", "password": "password123", "name": "Student"},
    )
    res = client.post(
        "/auth/login",
        json={"email": "student@example.com", "password": "password123"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_generate_question_unauthorized(client):
    res = client.post(
        "/practice/questions",
        json={"subject": "dbms", "topic": "normalization", "difficulty_tag": "medium"},
    )
    assert res.status_code == 401


def test_generate_question_and_submit_answer(client, auth_headers):
    # 1. Generate Question
    q_res = client.post(
        "/practice/questions",
        json={"subject": "dbms", "topic": "normalization", "difficulty_tag": "medium", "generation_method": "rag_generated"},
        headers=auth_headers,
    )
    assert q_res.status_code == 201
    q_data = q_res.json()
    assert "id" in q_data
    assert q_data["subject"] == "dbms"
    assert q_data["topic"] == "normalization"
    assert "question_text" in q_data

    question_id = q_data["id"]

    # 2. Submit Answer
    ans_res = client.post(
        "/practice/answers",
        json={"question_id": question_id, "answer_text": "3NF requires the table to be in 2NF and have no transitive functional dependencies."},
        headers=auth_headers,
    )
    assert ans_res.status_code == 201
    ans_data = ans_res.json()
    assert ans_data["question_id"] == question_id

    # 3. Check Topic Coverage
    cov_res = client.get("/practice/coverage?subject=dbms", headers=auth_headers)
    assert cov_res.status_code == 200
    cov_data = cov_res.json()
    assert len(cov_data) == 1
    assert cov_data[0]["subject"] == "dbms"
    assert cov_data[0]["topic"] == "normalization"
    assert cov_data[0]["attempts"] == 1
