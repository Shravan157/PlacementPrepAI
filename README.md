# Placement Prep AI

AI-powered technical mock interview and placement readiness evaluation system for Indian engineering campus placements. Grounded in standard CS curriculum (DSA, DBMS, OS, CN, OOP) using Retrieval-Augmented Generation (RAG) and strict 30-point rubric evaluations (Correctness, Completeness, Clarity).

---

## Architecture Overview

- **Backend**: FastAPI + SQLAlchemy ORM + PostgreSQL (Supabase) + ChromaDB vector embeddings + Gemini / Groq LLMs
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite + Axios
- **Data Model**: Normalized tables (`users`, `questions`, `answers`, `evaluations`, `topic_coverage`)

---

## Project Structure

```
PlacementPrepAI/
├── backend/
│   ├── app/
│   │   ├── auth/           # Registration, Login, JWT auth, User profile
│   │   ├── core/           # Security, LLM provider abstraction, Rate limiting
│   │   ├── db/             # SQLAlchemy engine & session factory
│   │   ├── evaluation/     # 30-point rubric evaluator service & endpoints
│   │   ├── history/        # Dashboard aggregate statistics & session audit trail
│   │   ├── practice/       # RAG question generation, answers, coverage
│   │   ├── rag/            # Retriever, Reranker, Vector store
│   │   ├── config.py       # Pydantic settings loading from .env
│   │   ├── dependencies.py # FastAPI DI helpers
│   │   └── main.py         # FastAPI application entrypoint with CORS
│   ├── tests/              # Pytest automated test suite (19 test cases)
│   ├── .env.example        # Environment variables template
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api.ts          # Typed Axios client wired to FastAPI backend
│   │   ├── App.tsx         # Full application UI (Dashboard, Interview, Evaluation, History, Profile)
│   │   ├── main.tsx        # React root entrypoint
│   │   └── index.css       # Tailwind CSS and global styling tokens
│   ├── public/             # Static assets & PlacementPrepAI favicon
│   ├── package.json        # Dependencies (React 19, Tailwind v4, Axios, Vite)
│   └── vite.config.ts      # Vite configuration
├── datasets/               # Core CS syllabus PDF datasets for RAG ingestion
├── API_REFERENCE.md        # Complete REST API specification
└── ARCHITECTURE.md         # Detailed architectural documentation
```

---

## Setup & Running Guide

### 1. Prerequisites
- Python 3.11+ / `uv`
- Node.js 18+ / `npm` or `pnpm`
- Git

---

### 2. Backend Setup

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create virtual environment and install dependencies**:
   Using `uv` (recommended):
   ```bash
   uv sync
   ```
   *Or using standard pip:*
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory (see `.env.example`):
   ```env
   DATABASE_URL=postgresql://postgres:placementVIMEET321app@db.oxiiikhtfvdglaxnzdut.supabase.co:5432/postgres
   JWT_SECRET_KEY=b5b8d33a31314ee9fdb95e96c1935e0fd6810cb499dad65d5ca99237149d7589
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   TEST_DATABASE_URL=sqlite:///:memory:
   DATASET_ROOT=../datasets
   CHROMA_PERSIST_DIRECTORY=./chroma_db
   GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>"
   GROQ_API_KEY="<YOUR_GROQ_API_KEY>"
   ```

4. **Run the Backend Server**:
   ```bash
   uv run uvicorn app.main:app --reload
   ```
   - API Server: `http://127.0.0.1:8000`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

5. **Run Backend Automated Tests**:
   ```bash
   uv run pytest tests
   ```

---

### 3. Frontend Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```
   - Access the web app in your browser at `http://localhost:8443` (or the URL shown in terminal).

---

## Key Features

- **Syllabus-Grounded Questions**: Questions synthesized dynamically using RAG over core textbook material (DSA, DBMS, OS, CN, OOP).
- **30-Point Rubric Evaluation**: Instant scoring broken into Correctness (10), Completeness (10), and Clarity (10) with targeted weak-subtopic recommendations.
- **Placement Dashboard**: Readiness progression bars across 5 core subjects and continuous practice recommendations.
- **Session History**: Detailed audit trail of all previous interview attempts and examiner feedback.
