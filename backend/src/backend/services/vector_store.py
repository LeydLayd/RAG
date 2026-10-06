from langchain_community.vectorstores import SupabaseVectorStore
from langchain_core.embeddings import Embeddings
from supabase import Client

class VectorStoreService:
    def __init__(
        self,
        supabase_client: Client,
        embedding: Embeddings,
        table_name: str = "documents",
        query_name: str = "match_documents"
    ):
        self._store = SupabaseVectorStore(
            client=supabase_client,
            embedding=embedding,
            table_name=table_name,
            query_name=query_name
        )

    def add_documents(self,documents):
        return self._store.add_documents(documents)
    
    def as_retriever(self,k: int = 3):
        return self._store.as_retriever(search_kwargs={"k":k})