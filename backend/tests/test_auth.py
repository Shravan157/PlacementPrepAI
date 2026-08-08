"""
tests/test_auth.py — Auth endpoint test suite.

Covers all six cases from PROGRESS.md / PROMPT.md:
    1. Register with valid data → 201
    2. Register with duplicate email → 409
    3. Login with correct credentials → 200 + token
    4. Login with wrong password → 401
    5. GET /auth/me with valid token → 200
    6. GET /auth/me with missing/invalid token → 401

All tests run against the SQLite in-memory database configured in conftest.py.
Never add tests that call the shared Supabase dev database.
"""

import pytest
from fastapi.testclient import TestClient

# ── Shared test data ──────────────────────────────────────────────────────────
VALID_USER = {
    "email": "student@example.com",
    "password": "strongpass1",
    "name": "Test Student",
}


# ─────────────────────────────────────────────────────────────────────────────
# 1. Register — success
# ─────────────────────────────────────────────────────────────────────────────

def test_register_success(client: TestClient) -> None:
    response = client.post("/auth/register", json=VALID_USER)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == VALID_USER["email"]
    assert body["name"] == VALID_USER["name"]
    assert "id" in body
    assert "created_at" in body
    # hashed_password must never be returned
    assert "hashed_password" not in body
    assert "password" not in body


# ─────────────────────────────────────────────────────────────────────────────
# 2. Register — duplicate email
# ─────────────────────────────────────────────────────────────────────────────

def test_register_duplicate_email(client: TestClient) -> None:
    # First registration succeeds
    client.post("/auth/register", json=VALID_USER)
    # Second with the same email must return 409
    response = client.post("/auth/register", json=VALID_USER)
    assert response.status_code == 409
    assert "already" in response.json()["detail"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# 3. Login — success
# ─────────────────────────────────────────────────────────────────────────────

def test_login_success(client: TestClient) -> None:
    client.post("/auth/register", json=VALID_USER)
    response = client.post(
        "/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 20  # sanity-check it's a real JWT


# ─────────────────────────────────────────────────────────────────────────────
# 4. Login — wrong password
# ─────────────────────────────────────────────────────────────────────────────

def test_login_wrong_password(client: TestClient) -> None:
    client.post("/auth/register", json=VALID_USER)
    response = client.post(
        "/auth/login",
        json={"email": VALID_USER["email"], "password": "wrongpassword"},
    )
    assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 5. GET /auth/me — valid token
# ─────────────────────────────────────────────────────────────────────────────

def test_me_with_valid_token(client: TestClient) -> None:
    client.post("/auth/register", json=VALID_USER)
    login_resp = client.post(
        "/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    token = login_resp.json()["access_token"]

    me_resp = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    body = me_resp.json()
    assert body["email"] == VALID_USER["email"]
    assert body["name"] == VALID_USER["name"]
    assert "hashed_password" not in body


# ─────────────────────────────────────────────────────────────────────────────
# 6. GET /auth/me — missing token
# ─────────────────────────────────────────────────────────────────────────────

def test_me_missing_token(client: TestClient) -> None:
    response = client.get("/auth/me")
    assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 7. GET /auth/me — invalid / tampered token
# ─────────────────────────────────────────────────────────────────────────────

def test_me_invalid_token(client: TestClient) -> None:
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer this.is.not.a.valid.jwt"},
    )
    assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 8. Register — password too short (schema validation)
# ─────────────────────────────────────────────────────────────────────────────

def test_register_short_password(client: TestClient) -> None:
    payload = {**VALID_USER, "password": "short"}
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422
