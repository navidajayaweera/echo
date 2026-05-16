-- Vector similarity search — used by start-ai-session and embed-journal

CREATE OR REPLACE FUNCTION public.match_memories(
  query_embedding vector(1536),
  match_user_id   UUID,
  match_count     INT     DEFAULT 5,
  match_threshold FLOAT   DEFAULT 0.75
)
RETURNS TABLE (
  journal_id    UUID,
  chunk_text    TEXT,
  similarity    FLOAT,
  memory_year   INT,
  keywords      TEXT[]
)
LANGUAGE sql STABLE
AS $$
  SELECT
    je.journal_id,
    je.chunk_text,
    1 - (je.embedding <=> query_embedding) AS similarity,
    j.memory_year,
    j.keywords
  FROM public.journal_embeddings je
  JOIN public.journals j ON j.id = je.journal_id
  WHERE je.user_id = match_user_id
    AND 1 - (je.embedding <=> query_embedding) > match_threshold
  ORDER BY je.embedding <=> query_embedding
  LIMIT match_count;
$$;
