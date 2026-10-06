from functools import lru_cache
from supabase import create_client, Client

from backend.config import get_settings
from backend.services.embeddings import GeminiEmbeddingsProvider
from backend.services.llm import GeminiLLMProvider
from backend.services.vector_store import VectorStoreService
from backend.services.ingestion import IngestionService
from backend.services.rag import RagService


@lru_cache
def get_supabase_client() -> Client:
    s = get_settings()
    return create_client(s.SUPABASE_URL, s.SUPABASE_SERVICE_KEY)


@lru_cache
def get_vector_store() -> VectorStoreService:
    s = get_settings()
    embeddings = GeminiEmbeddingsProvider(
        api_key=s.GEMINI_API_KEY,
        model=s.EMBEDDING_MODEL,
        output_dimensionality=s.EMBEDDING_DIM,
    ).get_client()
    return VectorStoreService(
        supabase_client=get_supabase_client(),
        embedding=embeddings,
    )


@lru_cache
def get_ingestion_service() -> IngestionService:
    s = get_settings()
    return IngestionService(
        vector_store=get_vector_store(),
        chunk_size=s.CHUNK_SIZE,
        chunk_overlap=s.CHUNK_OVERLAP,
    )


@lru_cache
def get_rag_service() -> RagService:
    s = get_settings()
    llm = GeminiLLMProvider(s.GEMINI_API_KEY, s.LLM_MODEL).get_client()
    return RagService(llm=llm, vector_store=get_vector_store(), k=s.RETRIEVER_K)