"""Typed values exchanged by the RAG pipeline without opaque dictionaries."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Chunk:
    """Represent one source-text unit and its searchable provenance."""

    id: str
    text: str
    metadata: dict[str, Any]
    embedding: list[float] | None = None
    score: float | None = None


@dataclass(frozen=True)
class CompanyExample:
    """Represent one short Q&A source pair for archetype-calibrated material."""

    question: str
    answer: str
    source_filename: str = "company_examples"


@dataclass
class IngestionSummary:
    """Report what an offline ingestion run added or skipped."""

    files_processed: int = 0
    chunks_created: int = 0
    chunks_skipped_as_duplicates: int = 0
    source_paths: list[str] = field(default_factory=list)
