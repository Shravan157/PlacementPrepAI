"""Self-RAG inspired reflective layer for relevance filtering and groundedness checking."""

import logging
import re
from app.rag.types import Chunk

LOGGER = logging.getLogger(__name__)


def filter_relevance(
    query: str,
    chunks: list[Chunk],
    min_score: float | None = -5.0,
) -> list[Chunk]:
    """Filter retrieved chunks to discard those that lack query relevance.

    Uses reranker score thresholding and keyword overlap validation.
    """
    if not chunks:
        return []

    query_tokens = set(re.findall(r"\w+", query.lower()))
    # Exclude common stop words
    stop_words = {"what", "is", "a", "an", "the", "in", "on", "of", "and", "or", "for", "to", "how", "why", "explain", "describe"}
    meaningful_query_tokens = query_tokens - stop_words

    relevant_chunks: list[Chunk] = []

    for chunk in chunks:
        # Check reranker score threshold if score exists
        if min_score is not None and chunk.score is not None and chunk.score < min_score:
            LOGGER.debug("Skipping chunk %s due to low score %.2f", chunk.id, chunk.score)
            continue

        # Check basic lexical keyword overlap if meaningful query tokens exist
        if meaningful_query_tokens:
            chunk_tokens = set(re.findall(r"\w+", chunk.text.lower()))
            overlap = meaningful_query_tokens.intersection(chunk_tokens)
            if not overlap and len(meaningful_query_tokens) > 2:
                LOGGER.debug("Skipping chunk %s due to zero keyword overlap", chunk.id)
                continue

        relevant_chunks.append(chunk)

    LOGGER.info("Filtered %d chunks down to %d relevant chunks for query '%s'", len(chunks), len(relevant_chunks), query)
    return relevant_chunks


def check_groundedness(generated_text: str, context_chunks: list[Chunk]) -> bool:
    """Verify that generated text is supported by the retrieved context chunks.

    Returns True if key concepts in generated_text overlap with context_chunks text.
    """
    if not generated_text or not context_chunks:
        return False

    context_corpus = " ".join([chunk.text.lower() for chunk in context_chunks])
    context_tokens = set(re.findall(r"\w+", context_corpus))

    generated_tokens = set(re.findall(r"\w+", generated_text.lower()))
    stop_words = {"the", "a", "an", "is", "are", "was", "were", "to", "of", "and", "in", "that", "this", "it", "with", "as", "for", "by", "on", "at", "be"}
    key_gen_tokens = generated_tokens - stop_words

    if not key_gen_tokens:
        return True

    overlap = key_gen_tokens.intersection(context_tokens)
    overlap_ratio = len(overlap) / len(key_gen_tokens)

    # Require at least 30% overlap of key non-stopword tokens with source context
    is_grounded = overlap_ratio >= 0.30
    LOGGER.info("Groundedness check: ratio %.2f (grounded=%s)", overlap_ratio, is_grounded)
    return is_grounded
