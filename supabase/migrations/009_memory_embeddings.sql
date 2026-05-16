-- Memory vault vector store (parallel to journal_embeddings)

ALTER TABLE public.media_vault
  ADD COLUMN IF NOT EXISTS is_embedded BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.memory_embeddings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id      UUID NOT NULL REFERENCES public.media_vault(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL DEFAULT 0,
  chunk_text    TEXT NOT NULL,
  embedding     vector(1536) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (media_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_vector
  ON public.memory_embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_user
  ON public.memory_embeddings(user_id);

ALTER TABLE public.memory_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_embeddings_select_own" ON public.memory_embeddings
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_knowledge_updated_at TIMESTAMPTZ;

-- Unified semantic search across journals + media vault memories
CREATE OR REPLACE FUNCTION public.match_memories(
  query_embedding vector(1536),
  match_user_id   UUID,
  match_count     INT     DEFAULT 8,
  match_threshold FLOAT   DEFAULT 0.72
)
RETURNS TABLE (
  source_type   TEXT,
  source_id     UUID,
  chunk_text    TEXT,
  similarity    FLOAT,
  memory_year   INT,
  title         TEXT,
  keywords      TEXT[]
)
LANGUAGE sql STABLE
AS $$
  WITH ranked AS (
    SELECT
      'journal'::TEXT AS source_type,
      je.journal_id AS source_id,
      je.chunk_text,
      1 - (je.embedding <=> query_embedding) AS similarity,
      j.memory_year,
      j.title,
      j.keywords
    FROM public.journal_embeddings je
    JOIN public.journals j ON j.id = je.journal_id
    WHERE je.user_id = match_user_id

    UNION ALL

    SELECT
      'memory'::TEXT AS source_type,
      me.media_id AS source_id,
      me.chunk_text,
      1 - (me.embedding <=> query_embedding) AS similarity,
      mv.memory_year,
      mv.title,
      mv.keywords
    FROM public.memory_embeddings me
    JOIN public.media_vault mv ON mv.id = me.media_id
    WHERE me.user_id = match_user_id
  )
  SELECT
    ranked.source_type,
    ranked.source_id,
    ranked.chunk_text,
    ranked.similarity,
    ranked.memory_year,
    ranked.title,
    ranked.keywords
  FROM ranked
  WHERE ranked.similarity > match_threshold
  ORDER BY ranked.similarity DESC
  LIMIT match_count;
$$;
