# AGENTS.md

RAG demo: FastAPI + LangChain + Gemini embeddings/chat, vector store in a **local** Supabase (pgvector).

## Layout & ownership

- Root has **no application code**. `package.json` exists only to install the Supabase CLI (`supabase@^2.119.0`) via pnpm. Its `test` script is the npm placeholder and exits 1 — there are no tests in this repo.
- `backend/` — the whole service (Python 3.13, `uv`).
- `supabase/` — local stack config (`config.toml`, `project_id = "RAG"`) + SQL migrations.
- `fronted/` — empty (yes, the typo is in the directory name). No frontend yet; `backend/src/backend/main.py:41` hardcodes CORS for `http://localhost:3000`, so a frontend is expected there eventually.

## Commands (verified on this machine)

Run backend commands **from `backend/`** (see import quirk below).

- First-time setup: `uv sync`
- Dev server (what is already running): `uv run uvicorn src.backend.main:app --reload --port 8000` → API on `127.0.0.1:8000`, OpenAPI UI at `/docs`
- Supabase: `pnpm exec supabase status` / `start` / `stop` (stack is up; ports: API 54321, DB 54322, Studio 54323)
- Apply SQL: `pnpm exec supabase migration up`
- `pnpm exec supabase migration list` **fails** with "Cannot find project ref" — that command is remote-only and the project is not linked. Not a broken setup.
- No `psql` client installed. Inspect data with `docker exec -i supabase_db_RAG psql -U postgres -d postgres`
- Secrets live in `backend/.env` (gitignored): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`. Never commit or print it.
- No linter, formatter, typechecker, or CI is configured. Don't invent one; match existing style (existing code/docstrings/prompts are in Spanish — keep that).

## Import quirk that breaks the app if you get it wrong

- `pyproject.toml` declares only the `backend` package (uv_build); `src/vector/` is **not** a declared package. `src/backend/main.py:11` imports `from src.vector...`, so startup requires **cwd = `backend/`**. `uvicorn backend.main:app` happens to work only because the editable install adds `backend/src` to `sys.path` via `backend.pth` *and* cwd is on the path. Don't move files or launch from the repo root.
- `src/vector/main.py` builds the Supabase client, Gemini embeddings, and `vector_store` **at import time** and raises `ValueError` if any of the three env vars is missing. A missing/renamed `.env` therefore breaks the whole app (even `GET /`), not just the RAG endpoints.

## `src/backend/config.py` is dead code

The pydantic `Settings` class is imported by nothing. Editing it has **zero** effect. Real values are hardcoded:

| Setting | Real location |
|---|---|
| `models/gemini-embedding-001`, `output_dimensionality=768` | `src/vector/main.py:23` |
| `gemini-3.5-flash-lite` | `src/backend/main.py:31` |
| chunk 600 / overlap 100 | `src/backend/main.py:56` |
| retriever `k=3` | `src/backend/main.py:85` |

Config is read via `os.getenv` + `python-dotenv` in two places (`src/vector/main.py:11`, `src/backend/main.py:24`), each resolving `.env` as `Path(__file__).parents[2]/".env"`. Update both if you change env handling. (The file also carries a `CHUNZ_SIZE` typo — don't propagate it.)

## Vector storage contract (change as one unit)

`supabase/migrations/20261005220555_init_rag.sql` creates `documents(id, content, metadata jsonb, embedding vector(768))`, an HNSW cosine index, and the `match_documents(query_embedding, match_count, filter)` RPC — exactly the contract `SupabaseVectorStore(table_name="documents", query_name="match_documents")` expects in `src/vector/main.py:29`.

- Changing embedding model or dimension requires a **new** migration plus updating `output_dimensionality`, then re-ingesting all existing rows (embeddings are not comparable across models).
- Never edit an already-applied migration; add a new timestamped file under `supabase/migrations/`. `supabase db reset` re-runs the whole folder from scratch and **destroys** the `documents` contents.

## API surface

`GET /` health · `POST /ingest` `{text, metadata}` chunks + embeds + stores · `POST /chat` `{query}` → `{answer, sources}`.
Request models live in `src/vector/ingest.py` and `src/vector/chat.py`; `src/backend/schemas.py` is an empty stub — don't add models there by mistake.

## Git hygiene

- Repositorio unificado (monorepo): un único repositorio Git en la raíz gestiona todo el proyecto (`backend/`, `supabase/`, etc.).
- El archivo `.gitignore` en la raíz y `backend/.gitignore` ignoran `node_modules/`, `.venv/`, `.env`, y directorios temporales de Supabase.

## Language
- All response in Spanish.
