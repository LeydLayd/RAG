from abc import ABC, abstractmethod
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models import BaseChatModel

class LLMProvider(ABC):
    """Abstracción para proveedores de LLM"""
    
    @abstractmethod
    def get_client(self) -> BaseChatModel: ...

class GeminiLLMProvider(LLMProvider):
    """Proveedor de LLM con Google Gemini"""
    def __init__(self, api_key: str, model: str, temperature: float = 0.2):
        self._client = ChatGoogleGenerativeAI(
            google_api_key=api_key,
            model=model,
            temperature=temperature
        )
    
    def get_client(self) -> BaseChatModel:
        return self._client
        
    
    