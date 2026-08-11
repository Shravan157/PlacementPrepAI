# Architecture

Status: **Locked.** Changes to this document require a deliberate decision, not an incidental one made while building something else.

## 1. Data

- Source material: narrow, branch- and subject-specific PDFs collected manually by the team (not scraped, not synthetic).
- Ingestion order: DBMS for the `cs` branch first. Once the pipeline is confirmed end-to-end (ingestion → retrieval → question generation → evaluation), ingest the remaining available CS subjects: DSA, OS, CN, OOP, C programming, C++ programming, Java, JavaScript, Python, Linux, Git and GitHub, SOLID principles, and System Design. Other branches begin only after their resources are reviewed.
- Storage location: `/datasets/<branch>/<subject>/*.pdf` at project root, gitignored. Initial branch roots are `cs`, `mech`, `extc`, and `electrical`.

## 2. RAG pipeline

1. **Ingestion**: PyMuPDF extracts text from PDFs.
2. **Chunking**: recursive chunking, each chunk tagged with metadata (branch, subject, source file, page, topic if extractable).
3. **Embeddings**: all-MiniLM-L6-v2 (sentence-transformers).
4. **Vector store**: Chroma, with per-chunk metadata filters (branch, subject, company-type tag, topic). Every retrieval filters by branch before applying subject/topic filters.
5. **Reflective layer (Self-RAG-inspired)**:
   - Relevance filtering: discard retrieved chunks that don't actually support the query.
   - Groundedness checking: verify generated content is supported by retrieved chunks before returning it.
6. **Question generation**: the LLM generates interview questions from retrieved chunks at runtime. No pre-written Q&A pairs, no static question bank.

## 3. Company tagging

Tagged by **type**, not specific company name — initial archetypes are `mass_recruiter_it`, `product_based`, and `fintech_core` (extensible). This keeps the dataset general and avoids the maintenance burden and legal ambiguity of company-specific scraped content.

## 4. Backend

- **Framework**: FastAPI.
- **Database**: PostgreSQL, hosted on Supabase (shared across the team — not local-only).
- **Schema**: normalized. `questions`, `answers`, and `evaluations` are separate tables with foreign key relationships — not generic chat/message rows. This is a deliberate distinctiveness decision: the system is architected as a structured evaluation pipeline, not a chat log.
- **Rate limiting**: slowapi, with daily usage caps enforced server-side and surfaced in the frontend UI (not just a backend-only limit).
- **Auth**: JWT-based. Password hashing via passlib/bcrypt.

## 5. Resume feature

Explicit **skill extraction** from resume text, matched against extracted JD skill requirements to compute a gap — not cosine similarity on raw embeddings alone. Cosine similarity on whole-document embeddings hides *which* skills are missing; explicit extraction lets the UI show a skill-gap column, which is a stated UI requirement (see below).

## 6. Frontend

Four-screen static mockup (delivered, HTML/CSS/JS):

| Screen | Purpose |
|---|---|
| Dashboard | Overview / entry point |
| Practice | Step-tabs interface for mock interview flow |
| History | Bar charts of past performance |
| Resume Match | Skill-gap columns (JD vs resume) |

Visual language: academic/ledger style. No chat bubbles anywhere — this is a deliberate differentiator from generic chatbot-style capstones.

## 7. Build discipline (do not deviate)

- **Scope discipline**: no general-purpose resources (generic language references, scraped company question lists) — the dataset is narrow and subject-specific by design.
- **Build before expanding**: prove one subject (DBMS) works end-to-end before replicating the pipeline to the other four subjects.
- **Architecture before code**: decisions are made and locked here before implementation starts on that piece.

## 8. Full folder structure

```
PlacementPrepAI/
│
├── README.md
├── ARCHITECTURE.md
├── PROGRESS.md
├── AGENTS.md
├── API_REFERENCE.md
├── PROMPT.md
├── .gitignore
├── docker-compose.yml
│
├── datasets/                             [dbms/ populated now, others later]
│   ├── dbms/
│   ├── dsa/
│   ├── os/
│   ├── cn/
│   └── oop/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py                     # includes DATASET_PATH
│   │   ├── dependencies.py
│   │   │
│   │   ├── auth/                         [BUILDING NOW]
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   └── models.py
│   │   │
│   │   ├── core/                         [BUILDING NOW]
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   ├── rate_limit.py
│   │   │   └── exceptions.py
│   │   │
│   │   ├── db/                           [BUILDING NOW]
│   │   │   ├── base.py
│   │   │   └── migrations/versions/
│   │   │
│   │   ├── practice/                     [NOT YET — Question, Answer models]
│   │   ├── evaluation/                   [NOT YET — rubric scoring, Evaluation model]
│   │   ├── resume/                       [NOT YET — skill extraction, JD matching]
│   │   ├── rag/                          [NOT YET — ingestion, embeddings, vectorstore, retriever, self_rag]
│   │   └── history/                      [NOT YET — dashboard/chart data]
│   │
│   ├── tests/
│   │   └── test_auth.py                  [BUILDING NOW]
│   │
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env
│
└── frontend/                             [NOT YET — mockup exists, wiring happens after core API is stable]
    ├── public/
    ├── src/
    │   ├── pages/{Dashboard,Practice,History,ResumeMatch}/
    │   ├── components/
    │   ├── api/
    │   └── styles/
    ├── package.json
    └── .env
```

Rule: folders marked **[NOT YET]** are not created until their module's turn comes. No empty scaffolding.
