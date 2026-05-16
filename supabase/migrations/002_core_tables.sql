CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  avatar_url      TEXT,
  persona_traits  JSONB NOT NULL DEFAULT '{
    "humor": 50,
    "warmth": 70,
    "wisdom": 60,
    "verbosity": 40,
    "formality": 30
  }'::jsonb,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.journals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT,
  body            TEXT NOT NULL,
  mood_tag        TEXT,
  keywords        TEXT[] DEFAULT '{}',
  memory_year     INT,
  local_id        TEXT UNIQUE,
  sync_status     sync_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journals_user_created ON public.journals(user_id, created_at DESC);
CREATE INDEX idx_journals_local_id ON public.journals(local_id);
