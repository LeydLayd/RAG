from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from .vector_store import VectorStoreService


class IngestionService:
    def __init__(self, vector_store: VectorStoreService,
                 chunk_size: int = 600, chunk_overlap: int = 100):
        self._vector_store = vector_store
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )

    def ingest(self, text: str, metadata: dict | None = None) -> int:
        chunks = self._splitter.split_text(text)
        docs = [Document(page_content=c, metadata=metadata or {}) for c in chunks]
        self._vector_store.add_documents(docs)
        return len(docs)