# Contributing to RAG Explorer

Thank you for your interest in contributing to **RAG Explorer**! This project is a full-stack Retrieval-Augmented Generation (RAG) application utilizing local Supabase (pgvector), a FastAPI backend (LangChain + Gemini), and a Next.js frontend.

Please read through these guidelines to ensure an efficient and consistent contribution workflow.

---

## Table of Contents

- [Code of Conduct & Philosophy](#code-of-conduct--philosophy)
- [Git Workflow (GitFlow)](#git-workflow-gitflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [1. Supabase Local Stack](#1-supabase-local-stack)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Database Migrations & Vector Store](#database-migrations--vector-store)
- [Verification & Quality Assurance](#verification--quality-assurance)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Code of Conduct & Philosophy

- **Unified Monorepo**: All project components (`backend/`, `frontend/`, `supabase/`) live in this single repository.
- **Security First**: Never commit secrets, credentials, or `.env` files. Ensure `.gitignore` rules are respected.
- **Code & Comments**: Existing code, comments, docstrings, and prompts follow Spanish conventions where applicable. Keep documentation clear and maintain consistency.

---

## Git Workflow (GitFlow)

We use a **GitFlow** branching strategy.

### Primary Branches

- **`main`**: Production-ready code. Direct pushes are restricted.
- **`dev`**: The integration branch for new features and active development. All work branches branch from and merge back into `dev`.

### Supporting Branches

| Branch Type | Naming Convention | Branch From | Merge Into | Description |
|---|---|---|---|---|
| **Feature** | `feature/<short-name>` | `dev` | `dev` | New features or non-critical improvements |
| **Bugfix** | `fix/<short-name>` | `dev` | `dev` | Bug fixes for issues found in `dev` |
| **Release** | `release/vX.Y.Z` | `dev` | `main` and `dev` | Preparation for a new release |
| **Hotfix** | `hotfix/<short-name>` | `main` | `main` and `dev` | Urgent fixes for production issues in `main` |

### Workflow Steps

1. Ensure your local `dev` branch is up to date:
   ```bash
   git checkout dev
   git pull origin dev
   ```
2. Create your branch from `dev`:
   ```bash
   git checkout -b feature/my-feature-name
   ```
3. Commit your changes following the [Commit Message Guidelines](#commit-message-guidelines).
4. Push your branch to the remote repository and open a Pull Request targeting `dev`.

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Structure

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **`feat`**: A new feature for the user or system.
- **`fix`**: A bug fix.
- **`docs`**: Documentation changes only (e.g., README, comments).
- **`refactor`**: Code changes that neither fix a bug nor add a feature.
- **`perf`**: Changes that improve performance.
- **`style`**: Formatting, whitespace, missing semi-colons (no code logic change).
- **`chore`**: Build scripts, package manager updates, maintenance tasks.
- **`test`**: Adding or updating tests.

### Scopes

Recommended scopes include:
- `backend`
- `frontend`
- `supabase`
- `deps`
- `config`

### Examples

- `feat(backend): add support for metadata filtering in /chat endpoint`
- `fix(frontend): prevent duplicate submissions in document upload form`
- `docs: update setup steps in CONTRIBUTING.md`
- `chore(deps): update supabase cli in root package.json`

---

## Local Development Setup

### Prerequisites

- [Docker](https://www.docker.com/) (required to run the local Supabase container stack)
- [pnpm](https://pnpm.io/)
- Python 3.13 and [uv](https://docs.astral.sh/uv/)
- A valid [Google Gemini API Key](https://aistudio.google.com/)

---

### 1. Supabase Local Stack

The root project contains the Supabase CLI management via `pnpm`:

```bash
# Install root dependencies (Supabase CLI)
pnpm install

# Start local Supabase containers (API: 54321, DB: 54322, Studio: 54323)
pnpm exec supabase start

# Apply SQL migrations to the local database
pnpm exec supabase migration up
```

To inspect Supabase status and retrieve the `service_role` key:
```bash
pnpm exec supabase status
```

---

### 2. Backend Setup

> **Important**: Always execute backend commands with your working directory in `backend/` (due to Python package path resolution).

```bash
cd backend

# Synchronize virtual environment with uv
uv sync

# Create your local environment file (backend/.env)
cat <<EOF > .env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=your_service_role_key_here
ALLOW_ORIGINS=http://localhost:3000
EOF

# Run the development server with hot-reload
uv run uvicorn backend.main:app --reload --port 8000
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger docs: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install frontend dependencies
pnpm install

# Run the Next.js dev server
pnpm dev
```

- Web UI: `http://localhost:3000`
- By default, the frontend connects to `http://localhost:8000`. This can be customized via `NEXT_PUBLIC_API_URL`.

---

## Database Migrations & Vector Store

The database schema and RPC function are tightly coupled with the backend vector store:
- Table: `documents(id, content, metadata jsonb, embedding vector(768))`
- RPC function: `match_documents(query_embedding, match_count, filter)`
- Index: HNSW with cosine distance

### Migration Rules

1. **Never edit an existing applied migration file** under `supabase/migrations/`.
2. Always create a **new timestamped migration file** for any schema or function modification.
3. Changing embedding models or dimensions requires creating a new migration and re-embedding all existing rows.
4. Avoid running `supabase db reset` unless strictly necessary, as it wipes all stored document vectors.

---

## Verification & Quality Assurance

Currently, automated test suites are not configured in CI. **Manual verification is mandatory** prior to opening any Pull Request:

1. **Startup Check**: Verify that both the backend (`uv run uvicorn ...`) and frontend (`pnpm dev`) start cleanly without unhandled exceptions or missing dependencies.
2. **API Verification**:
   - `GET /`: Ensure health check returns `{"status": "ok"}`.
   - `POST /ingest`: Verify document chunking and vector storage with sample text.
   - `POST /chat`: Verify query retrieval and Gemini response generation.
3. **UI Verification**:
   - Verify that chat interactions and document uploading function correctly in the browser at `http://localhost:3000`.
   - Ensure there are no console errors or build warnings (`pnpm build` in `frontend/` can be used to check for TypeScript/build issues).
4. **Clean Git State**: Verify `git status` to ensure no temporary files, cache directories (`.venv`, `node_modules`, `.next`), or `.env` files are tracked.

---

## Submitting a Pull Request

When your changes are ready and verified:

1. Push your branch to GitHub:
   ```bash
   git push origin feature/my-feature-name
   ```
2. Open a Pull Request targeting the **`dev`** branch (or `main` if it is a hotfix).
3. Complete the PR template/description with:
   - **Summary of changes**: A concise description of what was changed and why.
   - **Type of change**: Feature, fix, refactor, docs, etc.
   - **Manual testing performed**: Detailed steps you took to verify the change locally (include terminal output or screenshots if relevant).
   - **Checklist**: Confirm no secrets were committed, migrations adhere to project rules, and code conventions were followed.
4. Request review from project maintainers. Once approved, your PR will be merged into `dev`.
