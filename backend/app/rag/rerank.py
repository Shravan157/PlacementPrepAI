"""Cross-encoder reranking kept separate from the initial vector retrieval step."""

from dataclasses import replace

from sentence_transformers import CrossEncoder

from app.rag.types import Chunk


MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
_RERANKER = CrossEncoder(MODEL_NAME)


def rerank(query: str, chunks: list[Chunk], top_n: int = 5) -> list[Chunk]:
    """Score query/chunk pairs with a cross-encoder for more precise final context."""
    if top_n < 1:
        raise ValueError("top_n must be at least 1")
    if not chunks:
        return []
    scores = _RERANKER.predict([(query, chunk.text) for chunk in chunks])
    scored_chunks = [
        replace(chunk, score=float(score))
        for chunk, score in zip(chunks, scores, strict=True)
    ]
    return sorted(scored_chunks, key=lambda chunk: chunk.score or float("-inf"), reverse=True)[:top_n]
