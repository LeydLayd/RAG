from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.language_models import BaseChatModel
from .vector_store import VectorStoreService

PROMPT = """Eres un asistente conciso y preciso. Responde a la pregunta del usuario utilizando únicamente el siguiente contexto recuperado. Si la información no está en el contexto, indica amablemente que no posees esos datos.

Contexto:
{context}

Pregunta:
{question}

Respuesta:"""


class RagService:
    def __init__(self, llm: BaseChatModel, vector_store: VectorStoreService, k: int = 3):
        self._llm = llm
        self._vector_store = vector_store
        self._k = k
        self._prompt = ChatPromptTemplate.from_template(PROMPT)
        self._chain = self._prompt | self._llm | StrOutputParser()

    def _format_docs(self, docs) -> str:
        return "\n\n".join(doc.page_content for doc in docs)

    def answer(self, query: str) -> dict:
        retriever = self._vector_store.as_retriever(k=self._k)
        docs = retriever.invoke(query)
        context_text = self._format_docs(docs)
        answer = self._chain.invoke({"context": context_text, "question": query})
        return {
            "answer": answer,
            "sources": [d.page_content for d in docs],
        }