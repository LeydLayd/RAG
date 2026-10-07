# RAG Explorer

Demo de **RAG** (Retrieval-Augmented Generation) con un chat que responde preguntas a partir de documentos indexados en una base vectorial. Los documentos se dividen en fragmentos (*chunks*), se convierten en *embeddings* con Gemini y se buscan por similitud de coseno en Supabase (**pgvector**). La respuesta final la genera un modelo de chat de Gemini usando únicamente el contexto recuperado.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | FastAPI · LangChain · Google Gemini (embeddings + chat) |
| Base vectorial | Supabase local (pgvector) |
| Frontend | Next.js 16 · React 19 · Tailwind CSS 4 |

## Estructura del repositorio

```
.
├── backend/       # Servicio FastAPI (Python 3.13, uv)
│   └── src/backend/
│       ├── main.py             # Endpoints y configuración de la app
│       ├── config.py           # Settings vía pydantic-settings (.env)
│       ├── dependencies.py     # Inyección de servicios (singletons)
│       ├── schemas.py          # Modelos de request
│       └── services/           # embeddings, llm, ingestion, rag, vector_store
├── frontend/      # App Next.js (chat + portal de carga de documentos)
├── supabase/      # Configuración del stack local + migraciones SQL
└── package.json   # Solo instala la CLI de Supabase (pnpm)
```

## Requisitos

- [Docker](https://www.docker.com/) (para el stack local de Supabase)
- [pnpm](https://pnpm.io/)
- Python 3.13 y [uv](https://docs.astral.sh/uv/)
- Una API key de [Google Gemini](https://aistudio.google.com/)

## Puesta en marcha

### 1. Supabase local

```bash
pnpm install
pnpm exec supabase start
pnpm exec supabase migration up
```

Esto levanta el stack (API `54321`, DB `54322`, Studio `54323`) y crea la tabla `documents`, el índice HNSW y la función RPC `match_documents`.

### 2. Backend

Crea el archivo `backend/.env` (está gitignoreado) con las siguientes variables:

```bash
GEMINI_API_KEY=...
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=...        # service_role key, visible con `pnpm exec supabase status`
ALLOW_ORIGINS=http://localhost:3000
```

> El resto de opciones tienen valores por defecto y son opcionales (ver [Configuración](#configuración)).

Luego:

```bash
cd backend
uv sync
uv run uvicorn backend.main:app --reload --port 8000
```

La API queda en `http://127.0.0.1:8000` (OpenAPI en `/docs`). Alternativamente `uv run backend` arranca el mismo servidor con reload.

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. El frontend apunta por defecto al backend en `http://localhost:8000`; puede sobrescribirse con `NEXT_PUBLIC_API_URL`.

## API

| Método | Ruta | Body | Respuesta |
|---|---|---|---|
| `GET` | `/` | — | `{ "status": "ok" }` (health check) |
| `POST` | `/ingest` | `{ "text": str, "metadata": dict? }` | `{ "status", "chunks_created" }` |
| `POST` | `/chat` | `{ "query": str }` | `{ "answer", "sources" }` |

Flujo de `/ingest`: divide el texto en *chunks* (600 caracteres, 100 de solape), genera *embeddings* y los guarda en `documents`.
Flujo de `/chat`: recupera los `k=3` fragmentos más similares y responde con el LLM usando solo ese contexto.

## Configuración

Valores leídos por `backend/src/backend/config.py` desde `backend/.env`:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | *(obligatoria)* | API key de Google Gemini |
| `SUPABASE_URL` | *(obligatoria)* | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | *(obligatoria)* | Clave `service_role` |
| `ALLOW_ORIGINS` | *(obligatoria)* | Orígenes CORS separados por coma |
| `EMBEDDING_MODEL` | `models/gemini-embedding-001` | Modelo de embeddings |
| `EMBEDDING_DIM` | `768` | Dimensionalidad de los embeddings |
| `LLM_MODEL` | `gemini-3.5-flash-lite` | Modelo de chat |
| `CHUNK_SIZE` | `600` | Tamaño de fragmento |
| `CHUNK_OVERLAP` | `100` | Solape entre fragmentos |
| `RETRIEVER_K` | `3` | Número de fragmentos recuperados |

## Contrato del vector store

La migración `supabase/migrations/20261005220555_init_rag.sql` define:

- Tabla `documents(id, content, metadata jsonb, embedding vector(768))`
- Índice HNSW con similitud coseno
- RPC `match_documents(query_embedding, match_count, filter)`

Estos nombres son exactamente los que espera `SupabaseVectorStore` en `backend/src/backend/services/vector_store.py`. **Cambiar el modelo de embeddings o la dimensión requiere una nueva migración** (nunca editar una migración ya aplicada) y re-indexar todos los documentos, ya que los embeddings no son comparables entre modelos distintos.
