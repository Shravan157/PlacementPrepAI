"""Thin, persistent Chroma wrapper with no retrieval policy hidden inside it."""

from collections.abc import Iterable

import chromadb

from app.config import get_settings
from app.rag.types import Chunk


COLLECTION_NAME = "placement_prep_chunks"
_CLIENT = chromadb.PersistentClient(path=str(get_settings().chroma_persist_directory))
_COLLECTION = _CLIENT.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"},
)


def existing_chunk_ids(chunk_ids: Iterable[str]) -> set[str]:
    """Return IDs already persisted so batch ingestion can avoid redundant work."""
    ids = list(chunk_ids)
    if not ids:
        return set()
    result = _COLLECTION.get(ids=ids, include=[])
    return set(result["ids"])


def add_chunks(chunks: list[Chunk]) -> int:
    """Upsert pre-embedded chunks into the one shared persistent collection."""
    if not chunks:
        return 0
    if any(chunk.embedding is None for chunk in chunks):
        raise ValueError("Chunks must be embedded before they are added to Chroma.")
    _COLLECTION.upsert(
        ids=[chunk.id for chunk in chunks],
        documents=[chunk.text for chunk in chunks],
        embeddings=[chunk.embedding for chunk in chunks],  # type: ignore[list-item]
        metadatas=[chunk.metadata for chunk in chunks],
    )
    return len(chunks)


def query(embedding: list[float], filters: dict[str, object] | None, top_k: int) -> list[Chunk]:
    """Query Chroma directly and return source chunks with similarity scores."""
    result = _COLLECTION.query(
        query_embeddings=[embedding],
        where=filters or None,
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )
    ids = result["ids"][0]
    documents = result["documents"][0]
    metadatas = result["metadatas"][0]
    distances = result["distances"][0]
    return [
        Chunk(id=chunk_id, text=document, metadata=metadata, score=1 - distance)
        for chunk_id, document, metadata, distance in zip(ids, documents, metadatas, distances, strict=True)
    ]


def get_chunks_by_ids(chunk_ids: list[str]) -> list[Chunk]:
    """Resolve stored chunk metadata for API citations without duplicating it in Postgres."""
    if not chunk_ids:
        return []
    result = _COLLECTION.get(ids=chunk_ids, include=["documents", "metadatas"])
    return [
        Chunk(id=chunk_id, text=document, metadata=metadata)
        for chunk_id, document, metadata in zip(
            result["ids"], result["documents"], result["metadatas"], strict=True
        )
    ]
