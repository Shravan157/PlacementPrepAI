"""tests/test_history.py — Integration tests for the history and dashboard endpoints."""

import pytest


@pytest.fixture
def seeded_client(client):
    """Register a user, generate a question, submit + evaluate an answer, return (client, headers)."""
    client.post("/auth/register", json={"email": "historian@example.com", "password": "password123", "name": "Historian"})
    res = client.post("/auth/login", json={"email": "historian@example.com", "password": "password123"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Generate question
    q = client.post(
        "/practice/questions",
        json={"subject": "dbms", "topic": "transactions", "difficulty_tag": "medium", "generation_method": "rag_generated"},
        headers=headers,
    )
    question_id = q.json()["id"]

    # Submit answer
    a = client.post(
        "/practice/answers",
        json={"question_id": question_id, "answer_text": "ACID properties ensure atomicity, consistency, isolation, and durability in DB transactions."},
        headers=headers,
    )
    answer_id = a.json()["id"]

    # Evaluate answer
    client.post("/evaluation/evaluate", json={"answer_id": answer_id}, headers=headers)

    return client, headers


def test_dashboard_empty(client):
    """A fresh user's dashboard should return zeroed counts."""
    client.post("/auth/register", json={"email": "newuser@example.com", "password": "password123", "name": "New"})
    res = client.post("/auth/login", json={"email": "newuser@example.com", "password": "password123"})
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    dash = client.get("/history/dashboard", headers=headers)
    assert dash.status_code == 200
    data = dash.json()
    assert data["total_questions_attempted"] == 0
    assert data["total_answers_submitted"] == 0
    assert data["total_evaluations"] == 0
    assert data["subject_scores"] == []
    assert data["weak_topics"] == []
    assert data["recent_activity"] == []


def test_dashboard_after_activity(seeded_client):
    """Dashboard should reflect one answered and evaluated dbms question."""
    c, headers = seeded_client
    dash = c.get("/history/dashboard", headers=headers)
    assert dash.status_code == 200
    data = dash.json()

    assert data["total_questions_attempted"] == 1
    assert data["total_answers_submitted"] == 1
    assert data["total_evaluations"] == 1

    assert len(data["subject_scores"]) == 1
    assert data["subject_scores"][0]["subject"] == "dbms"
    assert 0 <= data["subject_scores"][0]["avg_overall"] <= 10

    assert len(data["recent_activity"]) == 1


def test_answer_history_list(seeded_client):
    """Answer history should return the submitted answer with evaluation scores."""
    c, headers = seeded_client
    history = c.get("/history/answers", headers=headers)
    assert history.status_code == 200
    data = history.json()

    assert len(data) == 1
    entry = data[0]
    assert entry["subject"] == "dbms"
    assert entry["topic"] == "transactions"
    assert entry["overall_score"] is not None
    assert 0 <= entry["overall_score"] <= 10


def test_answer_history_subject_filter(seeded_client):
    """Filtering by a different subject returns empty list."""
    c, headers = seeded_client
    history = c.get("/history/answers?subject=dsa", headers=headers)
    assert history.status_code == 200
    assert history.json() == []


def test_history_requires_auth(client):
    """History endpoints must return 401 without a token."""
    assert client.get("/history/dashboard").status_code == 401
    assert client.get("/history/answers").status_code == 401
