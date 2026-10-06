from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH,
        extra="ignore",
        case_sensitive=True,
        env_file_encoding="utf-8"
    )
    GEMINI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    EMBEDDING_DIM: int = 768
    LLM_MODEL: str = "gemini-3.5-flash-lite"
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100
    RETRIEVER_K: int = 3
    RETRIEVAL_TOP_K: int = 3

@lru_cache
def get_settings() -> Settings:
    return Settings()
    
    
        