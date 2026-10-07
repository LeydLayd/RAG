# Imagen base oficial y ligera de Python 3.13
FROM python:3.13-slim

# Copiar el ejecutable oficial de uv desde la imagen de Astral
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Variables de entorno para optimización de Python y uv
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PORT=8000

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar manifiestos de dependencias primero para aprovechar el caché de capas de Docker
COPY pyproject.toml uv.lock ./

# Instalar dependencias en el entorno virtual (sin incluir dependencias de desarrollo)
RUN uv sync --frozen --no-install-project --no-dev

# Copiar el código fuente del backend
COPY . .

# Instalar el paquete de la aplicación
RUN uv sync --frozen --no-dev

# Asegurar que los binarios del entorno virtual (.venv) tengan prioridad en el PATH
ENV PATH="/app/.venv/bin:$PATH"

# Exponer el puerto del servicio
EXPOSE 8000

# Ejecutar FastAPI con uvicorn respetando la variable de entorno $PORT (requerida por Render, Koyeb, etc.)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
