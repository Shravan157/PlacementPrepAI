"""tests/test_rag.py — Unit tests for Self-RAG relevance and groundedness checks."""

import pytest
from app.rag.self_rag import check_groundedness, filter_relevance
from app.rag.types import Chunk


def test_filter_relevance_keeps_good_chunks():
    chunks = [
        Chunk(id="c1", text="Database normalization reduces data redundancy and improves data integrity.", metadata={}, score=0.85),
        Chunk(id="c2", text="Cooking recipes for chocolate cake.", metadata={}, score=-10.0),
    ]
    filtered = filter_relevance(query="normalization", chunks=chunks, min_score=-5.0)
    assert len(filtered) == 1
    assert filtered[0].id == "c1"


def test_check_groundedness():
    chunks = [
        Chunk(id="c1", text="Transaction ACID properties guarantee Atomicity, Consistency, Isolation, and Durability in DBMS.", metadata={}),
    ]

    # Grounded text sharing terms with chunk
    assert check_groundedness("ACID properties guarantee isolation and durability in DBMS transactions.", chunks) is True

    # Ungrounded text completely unrelated
    assert check_groundedness("Quantum physics string theory astrophysics cosmological constant", chunks) is False
