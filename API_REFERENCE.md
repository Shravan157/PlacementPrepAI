# API Reference

Base URL (dev): `http://localhost:8000`

Status legend: **[LIVE]** implemented and tested · **[PLANNED]** documented for reference, not yet built.

## Auth — `/auth` **[BUILDING NOW]**

### POST `/auth/register`
Create a new user account.

**Request**
```json
{
  "email": "student@example.com",
  "password": "min-8-chars",
  "name": "Student Name"
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "name": "Student Name",
  "created_at": "2026-08-08T00:00:00Z"
}
```

**Errors**: `409` if email already registered, `422` on validation failure.

### POST `/auth/login`
Authenticate and receive a JWT access token.

**Request** (form or JSON, decide when building)
```json
{ "email": "student@example.com", "password": "..." }
```

**Response `200`**
```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

**Errors**: `401` on invalid credentials. Rate-limited via slowapi (exact limit TBD when built — brute-force protection is the reason this endpoint is limited specifically).

### GET `/auth/me`
Return the currently authenticated user. Requires `Authorization: Bearer <token>` header.

**Response `200`**
```json
{ "id": "uuid", "email": "student@example.com", "name": "Student Name" }
```

**Errors**: `401` if token missing/invalid/expired.

---

## Practice — `/practice` **[PLANNED]**

- `POST /practice/start` — begin a mock interview session for a subject (`subject` query param: dbms, dsa, os, cn, oop)
- `POST /practice/{session_id}/answer` — submit an answer to the current question
- `GET /practice/{session_id}/question` — retrieve the current/next generated question

## Evaluation — `/evaluation` **[PLANNED]**

- `GET /evaluation/{answer_id}` — retrieve rubric-based evaluation for a submitted answer

## Resume — `/resume` **[PLANNED]**

- `POST /resume/upload` — upload resume file
- `POST /resume/match` — submit a JD, receive skill-gap comparison against uploaded resume

## History — `/history` **[PLANNED]**

- `GET /history/summary` — aggregate stats for dashboard
- `GET /history/{subject}` — per-subject performance over time, for bar charts

---

## Auth requirements by endpoint

All `/practice`, `/evaluation`, `/resume`, and `/history` endpoints will require a valid Bearer token once built. `/auth/register` and `/auth/login` are the only unauthenticated endpoints.

## Conventions

- All timestamps: ISO 8601, UTC.
- All IDs: UUID.
- Error responses: `{ "detail": "<message>" }`, following FastAPI's default `HTTPException` shape.
