"""Offline PDF ingestion into the shared, branch-aware Chroma collection."""

import hashlib
import json
import logging
import re
from pathlib import Path

import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings
from app.rag.embeddings import embed_many
from app.rag.types import Chunk, CompanyExample, IngestionSummary
from app.rag.vectorstore import add_chunks, existing_chunk_ids


LOGGER = logging.getLogger(__name__)
CHUNK_SIZE = 700
CHUNK_OVERLAP = 100
TEXT_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
)


def _normalise_text(text: str) -> str:
    """Make whitespace-insensitive content hashes stable across repeated ingestion."""
    return re.sub(r"\s+", " ", text).strip()


def _chunk_id(text: str) -> str:
    """Create the deterministic Chroma ID that prevents duplicate source content."""
    return hashlib.sha256(_normalise_text(text).encode("utf-8")).hexdigest()


def _chroma_metadata(
    *, branch: str,
    subject: str,
    source_filename: str,
    page_number: int,
    company_type: str | None = None,
    known_companies: list[str] | None = None,
) -> dict[str, str | int]:
    """Build Chroma-compatible metadata while retaining all required provenance."""
    metadata: dict[str, str | int] = {
        "branch": branch,
        "subject": subject,
        "source_filename": source_filename,
        "page_number": page_number,
    }
    if company_type is not None:
        metadata["company_type"] = company_type
    if known_companies is not None:
        metadata["known_companies"] = json.dumps(known_companies)
    return metadata


def _store_candidates(candidates: list[Chunk], summary: IngestionSummary) -> None:
    """Embed and persist only new content, recording duplicate skips in the summary."""
    unique_candidates: dict[str, Chunk] = {}
    for candidate in candidates:
        if candidate.id in unique_candidates:
            summary.chunks_skipped_as_duplicates += 1
        else:
            unique_candidates[candidate.id] = candidate

    existing_ids = existing_chunk_ids(unique_candidates)
    summary.chunks_skipped_as_duplicates += len(existing_ids)
    new_chunks = [chunk for chunk_id, chunk in unique_candidates.items() if chunk_id not in existing_ids]
    vectors = embed_many([chunk.text for chunk in new_chunks])
    embedded_chunks = [
        Chunk(id=chunk.id, text=chunk.text, metadata=chunk.metadata, embedding=vector)
        for chunk, vector in zip(new_chunks, vectors, strict=True)
    ]
    summary.chunks_created += add_chunks(embedded_chunks)


def _ingest_pdf(subject: str, branch: str, file_path: Path, summary: IngestionSummary) -> None:
    """Extract every PDF page, split it, and store its new chunks with provenance."""
    candidates: list[Chunk] = []
    with fitz.open(file_path) as document:
        for page_index, page in enumerate(document, start=1):
            page_text = _normalise_text(page.get_text("text"))
            if not page_text:
                continue
            for chunk_text in TEXT_SPLITTER.split_text(page_text):
                normalised_chunk = _normalise_text(chunk_text)
                if normalised_chunk:
                    candidates.append(
                        Chunk(
                            id=_chunk_id(normalised_chunk),
                            text=normalised_chunk,
                            metadata=_chroma_metadata(
                                branch=branch,
                                subject=subject,
                                source_filename=file_path.name,
                                page_number=page_index,
                            ),
                        )
                    )
    _store_candidates(candidates, summary)
    summary.files_processed += 1
    summary.source_paths.append(str(file_path))


def run_ingestion(subject: str, branch: str = "cs") -> IngestionSummary:
    """Ingest every PDF from one configured branch/subject folder for batch use."""
    dataset_root = get_settings().dataset_root
    subject_path = (dataset_root / branch / subject).resolve()
    LOGGER.info("Starting ingestion from resolved path: %s", subject_path)
    if not subject_path.is_dir():
        raise FileNotFoundError(f"Dataset subject folder does not exist: {subject_path}")
    pdf_files = sorted(subject_path.glob("*.pdf"))
    summary = IngestionSummary()
    for pdf_file in pdf_files:
        _ingest_pdf(subject, branch, pdf_file.resolve(), summary)
    LOGGER.info(
        "Ingestion complete: files=%d, chunks_created=%d, chunks_skipped_as_duplicates=%d",
        summary.files_processed,
        summary.chunks_created,
        summary.chunks_skipped_as_duplicates,
    )
    return summary


def run_ingestion_file(subject: str, file_path: str, branch: str = "cs") -> IngestionSummary:
    """Ingest one explicitly named PDF through the same batch chunking and storage path."""
    resolved_path = Path(file_path).expanduser().resolve()
    LOGGER.info("Starting ingestion from resolved path: %s", resolved_path)
    if not resolved_path.is_file():
        raise FileNotFoundError(f"Dataset PDF does not exist: {resolved_path}")
    if resolved_path.suffix.lower() != ".pdf":
        raise ValueError(f"Dataset file is not a PDF: {resolved_path}")
    summary = IngestionSummary()
    _ingest_pdf(subject, branch, resolved_path, summary)
    LOGGER.info(
        "Ingestion complete: files=%d, chunks_created=%d, chunks_skipped_as_duplicates=%d",
        summary.files_processed,
        summary.chunks_created,
        summary.chunks_skipped_as_duplicates,
    )
    return summary


def ingest_company_examples(
    examples: list[CompanyExample],
    company_type: str,
    known_companies: list[str] | None = None,
    branch: str = "cs",
    subject: str = "company_examples",
) -> IngestionSummary:
    """Store short Q&A source pairs in the shared collection without recursive splitting."""
    summary = IngestionSummary(files_processed=1)
    candidates = [
        Chunk(
            id=_chunk_id(f"Question: {example.question}\nAnswer: {example.answer}"),
            text=f"Question: {example.question}\nAnswer: {example.answer}",
            metadata=_chroma_metadata(
                branch=branch,
                subject=subject,
                source_filename=example.source_filename,
                page_number=0,
                company_type=company_type,
                known_companies=known_companies,
            ),
        )
        for example in examples
    ]
    _store_candidates(candidates, summary)
    LOGGER.info(
        "Company-example ingestion complete: pairs=%d, chunks_created=%d, chunks_skipped_as_duplicates=%d",
        len(examples), summary.chunks_created, summary.chunks_skipped_as_duplicates,
    )
    return summary
