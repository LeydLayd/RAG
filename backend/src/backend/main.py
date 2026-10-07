import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from backend.config import get_settings
from fastapi.middleware.cors import CORSMiddleware

from backend.schemas import IngestRequest, ChatRequest
from backend.dependencies import get_ingestion_service, get_rag_service
from backend.services.ingestion import IngestionService
from backend.services.rag import RagService

app = FastAPI(title="RAG API con Gemini")
s = get_settings()
url = s.ALLOW_ORIGINS
origins = [o.strip() for o in url.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/ingest")
def ingest(payload: IngestRequest,
           service: IngestionService = Depends(get_ingestion_service)):
    try:
        n = service.ingest(payload.text, payload.metadata)
        return {"status": "success", "chunks_created": n}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat(payload: ChatRequest,
         service: RagService = Depends(get_rag_service)):
    try:
        return service.answer(payload.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def run():
    """Entry point para `uv run backend-api`."""
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    run()