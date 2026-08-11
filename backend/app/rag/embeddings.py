"""Load the single embedding model used by all offline and online RAG work."""

from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"
_EMBEDDING_MODEL = SentenceTransformer(MODEL_NAME)


def embed(text: str) -> list[float]:
    """Embed one text string into the model's 384-dimensional vector space."""
    return _EMBEDDING_MODEL.encode(text, normalize_embeddings=True).tolist()


def embed_many(texts: list[str]) -> list[list[float]]:
    """Embed a batch while reusing the process-wide model singleton."""
    if not texts:
        return []
    return _EMBEDDING_MODEL.encode(texts, normalize_embeddings=True).tolist()
