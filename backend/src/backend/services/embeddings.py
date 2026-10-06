from abc import ABC, abstractmethod
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.embeddings import Embeddings

class EmbeddingProvider(ABC):
    """Abstraccion para proveedores de embeddings"""
    @abstractmethod
    def get_client(self) -> Embeddings: ...

class GeminiEmbeddingProvider(EmbeddingProvider):
    """Proveedor de embeddings con Google Gemini"""
    def __init__(self, api_key: str, model: str, output_dimensionality: int = 768):
        self._client = GoogleGenerativeAIEmbeddings(
            google_api_key=api_key,
            model=model,
            output_dimensionality=output_dimensionality,
        )
    
    def get_client(self) -> Embeddings:
        return self._client


# Alias para compatibilidad
GeminiEmbeddingsProvider = GeminiEmbeddingProvider