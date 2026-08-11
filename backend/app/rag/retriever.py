"""Visible, branch-aware Chroma retrieval without LangChain retriever abstractions."""

import logging

from app.rag.embeddings import embed
from app.rag.types import Chunk
from app.rag.vectorstore import query


LOGGER = logging.getLogger(__name__)
DEFAULT_BRANCH = "cs"


def retrieve(
    subject: str,
    topic: str,
    company_type: str | None = None,
    top_k: int = 20,
    branch: str = DEFAULT_BRANCH,
) -> list[Chunk]:
    """Retrieve the best syllabus chunks, optionally supplemented by tagged company evidence.

    Syllabus sources always remain available as the factual grounding layer. When
    company evidence exists, a second metadata-filtered query supplements rather
    than replaces those chunks.
    """
    if top_k < 1:
        raise ValueError("top_k must be at least 1")

    query_embedding = embed(f"{subject}: {topic}")
    syllabus_chunks = query(
        embedding=query_embedding,
        filters={"$and": [{"branch": branch}, {"subject": subject}]},
        top_k=top_k,
    )
    combined = {chunk.id: chunk for chunk in syllabus_chunks}

    if company_type is not None:
        company_chunks = query(
            embedding=query_embedding,
            filters={"$and": [{"branch": branch}, {"company_type": company_type}]},
            top_k=top_k,
        )
        for chunk in company_chunks:
            combined.setdefault(chunk.id, chunk)
        LOGGER.info(
            "Retrieved %d syllabus chunks and %d %s company-evidence chunks for '%s'.",
            len(syllabus_chunks), len(company_chunks), company_type, topic,
        )
    else:
        LOGGER.info("Retrieved %d %s/%s chunks for '%s'.", len(syllabus_chunks), branch, subject, topic)

    return sorted(combined.values(), key=lambda chunk: chunk.score or float("-inf"), reverse=True)[:top_k]
