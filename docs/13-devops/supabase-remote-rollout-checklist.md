# Supabase Remote Rollout Checklist (Low Risk)

This runbook applies the minimum remote changes needed to unblock memory embedding and avatar session flows.

## Scope

- Apply pending DB migrations to the linked Supabase project.
- Deploy required Edge Functions:
  - `embed-memory`
  - `embed-journal`
  - `refresh-avatar-knowledge`
  - `list-bey-avatars`
  - `start-ai-session`
- Set required function secrets:
  - `GEMINI_API_KEY`
  - `BEY_API_KEY`
- Verify deploy and secret state.

## Safety Rules

- Use existing migration SQL files only (no ad-hoc schema edits).
- Use idempotent migration SQL when possible.
- Change one surface at a time: DB, then functions, then secrets.
- Verify after each stage before continuing.

## Execution Plan

1. Confirm project ref from env and link:
   - `npx supabase link --project-ref <ref>`
2. Apply migrations:
   - `npx supabase db push`
3. Deploy required functions:
   - `npx supabase functions deploy embed-memory`
   - `npx supabase functions deploy embed-journal`
   - `npx supabase functions deploy refresh-avatar-knowledge`
   - `npx supabase functions deploy list-bey-avatars`
   - `npx supabase functions deploy start-ai-session`
4. Set required secrets:
   - `npx supabase secrets set GEMINI_API_KEY=...`
   - `npx supabase secrets set BEY_API_KEY=...`
5. Verify:
   - `npx supabase secrets list`
   - `npx supabase functions list`

## Rollback Notes

- Function deploy rollback: redeploy previous known-good function source.
- Schema rollback: add a new forward migration that reverses behavior (avoid manual destructive rollback unless required).

## Execution Log

- Completed: migration `ensure_vector_extension`.
- Completed: migration `media_vault_memory_date`.
- Completed: migration `ensure_media_vault_embedding_schema_v2` (includes `memory_embeddings`, `media_vault.is_embedded`, and updated `match_memories`).
- Completed: migration `profiles_bp_avatar_id`.
- Completed deploys:
  - `embed-memory` (v1)
  - `embed-journal` (v3)
  - `refresh-avatar-knowledge` (v1)
  - `list-bey-avatars` (v1)
  - `start-ai-session` (v3)
- Verified schema objects:
  - `public.memory_embeddings` exists.
  - `public.media_vault` has `is_embedded` and `memory_date`.
  - `public.profiles` has `avatar_knowledge_updated_at` and `bp_avatar_id`.
  - `public.match_memories` returns journal + memory sources.
- Completed: secrets `GEMINI_API_KEY` and `BEY_API_KEY` set on project `howeuqlomjpuwfdtceyb` (verified via `supabase secrets list`).
