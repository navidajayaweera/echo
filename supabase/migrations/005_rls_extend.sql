-- RLS for new tables

ALTER TABLE public.journal_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_vault        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echo_sessions      ENABLE ROW LEVEL SECURITY;

-- journal_embeddings: users read own; inserts via service role (Edge Function)
CREATE POLICY "embeddings_select_own" ON public.journal_embeddings
  FOR SELECT USING (auth.uid() = user_id);

-- media_vault: full CRUD on own rows
CREATE POLICY "media_all_own" ON public.media_vault
  FOR ALL USING (auth.uid() = user_id);

-- echo_sessions: full CRUD on own rows
CREATE POLICY "sessions_all_own" ON public.echo_sessions
  FOR ALL USING (auth.uid() = user_id);
