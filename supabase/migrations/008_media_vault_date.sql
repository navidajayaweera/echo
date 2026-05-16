-- Add precise memory_date to media_vault (memory_year kept for backwards compatibility)
ALTER TABLE public.media_vault
  ADD COLUMN IF NOT EXISTS memory_date DATE;

CREATE INDEX IF NOT EXISTS idx_media_vault_user_date
  ON public.media_vault(user_id, memory_date DESC NULLS LAST);

-- Backfill memory_date from memory_year for existing rows (Jan 1 of that year)
UPDATE public.media_vault
  SET memory_date = make_date(memory_year, 1, 1)
  WHERE memory_date IS NULL AND memory_year IS NOT NULL;
