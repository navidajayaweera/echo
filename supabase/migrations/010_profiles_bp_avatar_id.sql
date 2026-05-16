-- Bey (Beyond Presence) digital-human avatar bound to this Echo user (not profile photo).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bp_avatar_id TEXT;

COMMENT ON COLUMN public.profiles.bp_avatar_id IS
  'Beyond Presence avatar UUID for this user (from GET /v1/avatars). Required to create a managed agent.';
