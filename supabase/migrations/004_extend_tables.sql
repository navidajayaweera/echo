-- Extend profiles with Beyond Presence agent reference
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bp_agent_id TEXT;

-- Extend journals with embedding status
ALTER TABLE public.journals
  ADD COLUMN IF NOT EXISTS is_embedded BOOLEAN NOT NULL DEFAULT false;

-- Add GIN index on keywords (missed in 002)
CREATE INDEX IF NOT EXISTS idx_journals_keywords
  ON public.journals USING GIN(keywords);

-- ── Vector store (RAG chunks) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_embeddings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id    UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL DEFAULT 0,
  chunk_text    TEXT NOT NULL,
  embedding     vector(1536) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (journal_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_journal_embeddings_vector
  ON public.journal_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- ── Media vault (timeline) ────────────────────────────────────────────────────
CREATE TYPE IF NOT EXISTS media_type AS ENUM (
  'photo', 'letter', 'voice', 'video', 'document'
);

CREATE TABLE IF NOT EXISTS public.media_vault (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  journal_id    UUID REFERENCES public.journals(id) ON DELETE SET NULL,
  media_type    media_type NOT NULL,
  storage_path  TEXT NOT NULL,
  public_url    TEXT,
  title         TEXT,
  description   TEXT,
  memory_year   INT NOT NULL,
  keywords      TEXT[] DEFAULT '{}',
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_vault_user_year
  ON public.media_vault(user_id, memory_year DESC);

CREATE INDEX IF NOT EXISTS idx_media_vault_keywords
  ON public.media_vault USING GIN(keywords);

-- ── Echo sessions audit log ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.echo_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'beyond_presence',
  livekit_room      TEXT,
  bp_session_id     TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at          TIMESTAMPTZ,
  memories_recalled INT DEFAULT 0
);

-- ── updated_at triggers for new tables ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER media_vault_updated_at
  BEFORE UPDATE ON public.media_vault
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
