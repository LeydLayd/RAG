create extension if not exists vector;

-- Tabla principal
create table documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768) -- Gemini Embeddings (text-embedding-004)
);

-- Índice HNSW para optimizar búsquedas
create index on documents using hnsw (embedding vector_cosine_ops);

-- Función RPC requerida por LangChain para la búsqueda de vectores
create or replace function match_documents (
  query_embedding vector(768),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;