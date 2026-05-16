# Member 2 Plan: Supabase, Memory Pipeline, Demo Data

## Mission

Own the backend truth of the demo: Supabase configuration, migrations, edge functions, RLS, journal sync, embeddings, memory recall, timeline storage, and seeded demo content.

The goal is to make the app answer accurately from real or seeded memories every time. The demo should not depend on lucky retrieval. If embeddings fail, use the documented recency fallback intentionally with clear, recent, highly specific memories.

## Current State

The project already has:

- Supabase client setup in `lib/supabase.ts`.
- Journal local cache and sync in `lib/journal-storage.ts`, `lib/journal-sync.ts`, `hooks/useJournalCache.ts`, and `hooks/useJournalSync.ts`.
- Migrations for profiles, journals, embeddings, media vault, RLS, vector RPC, storage, and extension safety.
- Edge functions:
  - `supabase/functions/start-ai-session/index.ts`
  - `supabase/functions/embed-journal/index.ts`
- Provider implementations for OpenAI, Gemini, and Beyond Presence.
- Memory recall through `match_memories()`, with fallback to recent journals.
- Timeline upload and signed URL generation through `hooks/useTimeline.ts`.

Known risks:

- There are two migration files with `008_*.sql` names. Confirm actual application order before touching production data.
- Secrets must exist in Supabase, not only in local `.env`.
- `README.md` is not the source of truth; use `docs/` and live code.
- Embedding failures should not block the final demo because recency fallback exists.

## Definition Of Done

Minimum demo-ready outcome:

- Supabase env is configured for the app.
- Required migrations are applied and verified.
- Auth works with email/password or guest.
- A journal entry syncs to Supabase.
- `embed-journal` runs or the fallback path is intentionally used.
- `start-ai-session` returns a valid OpenAI or Gemini response grounded in seeded memories.
- Beyond Presence secrets and LiveKit credentials are either working or clearly identified as unavailable.
- Demo account/data is ready and documented for Member 3.

Stretch outcome:

- `match_memories()` returns semantic matches from embedded journal chunks.
- Beyond Presence session creation succeeds.
- `echo_sessions.ended_at` cleanup is implemented or verified.
- Timeline media appears with signed URLs and strong year labels.

## Owned Files

Primary ownership:

- `supabase/`
- `supabase/migrations/`
- `supabase/functions/`
- `lib/supabase.ts`
- `lib/journal-sync.ts`
- `hooks/useJournalSync.ts`
- `hooks/useTimeline.ts`
- `lib/types/database.ts`
- `lib/types/media-vault.ts`

Shared lock files. Announce before editing:

- `.env.example`
- `package.json`
- `app.json`
- Any migration file after another teammate has pulled it.

Do not edit without handoff:

- `app/(tabs)/presence.tsx`
- `components/presence/`
- `README.md`
- Final hackathon docs owned by Member 3.

## Cursor Model Guide

- Use Claude 4.6 Sonnet Max Thinking for RLS, SQL, migrations, edge-function reasoning, and security review.
- Use GPT-5.3 Codex for concrete TypeScript/Deno patches.
- Use GPT-5.5 High for high-pressure integration failures involving auth, embeddings, provider errors, or demo fallback decisions.
- Use Composer 2 Fast only for repetitive seed-data text or checklist cleanup.

Use the Supabase skill/context before any Supabase task. Keep service role secrets out of app code and out of Git.

## Timeline

### T+0:00 to T+0:45: Environment And Secrets Audit

Tasks:

- Confirm local `.env` has:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Confirm Supabase secret vault has:
  - `OPENAI_API_KEY`
  - `GEMINI_API_KEY`
  - `BEYOND_PRESENCE_API_KEY`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
  - `LIVEKIT_URL`
- Confirm edge functions are deployed:
  - `start-ai-session`
  - `embed-journal`
- Tell Member 1 whether Beyond Presence is expected to work.
- Tell Member 3 what account/project is being used for demo.

Exit criteria:

- The team knows which providers are definitely available.
- Any missing secret is written as a blocker with owner and ETA.

### T+0:45 to T+2:00: Migration And Schema Verification

Tasks:

- Verify all migrations have been applied in order.
- Inspect duplicate `008_*.sql` names and ensure production DB has both intended changes:
  - vector extension safety.
  - media vault date/year behavior.
- Confirm RLS policies allow authenticated users and guests to access only their own data.
- Confirm storage bucket `media-vault` exists and is private.
- Confirm `match_memories()` exists and accepts the documented params.

Do not:

- Rewrite old migrations that may already be applied.
- Drop or reset remote data.
- Use service role keys in the client app.

Exit criteria:

- DB state is known and safe for demo.
- Any schema mismatch has a small forward-only migration or a documented workaround.

### T+2:00 to T+4:00: Function And Memory Pipeline Test

Tasks:

- Sign in or continue as guest in the app.
- Create a journal with a specific, easy-to-recall memory.
- Confirm it appears in `journals`.
- Trigger or verify `embed-journal`.
- Confirm `journals.is_embedded = true` if embeddings are working.
- Confirm `journal_embeddings` has rows for that journal.
- Call `start-ai-session` through the app with OpenAI or Gemini.
- Ask a targeted question that should retrieve the new journal.

Suggested test memory:

```text
Title: Grandma's Kitchen In 1974
Body: In 1974, Grandma Asha taught me to make cardamom tea in her yellow kitchen. The blue radio was always on, and she said patience was the secret ingredient.
Memory year: 1974
Keywords: grandma, kitchen, tea, patience
```

Suggested test prompt:

```text
What do you remember about Grandma Asha's kitchen?
```

Exit criteria:

- Either embeddings work, or the recency fallback reliably answers from the latest seeded entries.

### T+4:00 to T+5:30: Build Demo Data

Tasks:

- Create at least 5 journal memories across 2-3 years.
- Create at least 2 timeline media entries.
- Tune persona traits for warm, concise responses.
- Keep seed memories emotionally clear and easy to ask about.
- Avoid vague entries that make retrieval hard.

Recommended seed set:

1. `1974 - Grandma Asha's Kitchen`
   - Anchor: yellow kitchen, cardamom tea, blue radio, patience.
2. `1985 - Monsoon Train Ride`
   - Anchor: Mumbai train, green suitcase, rain on windows, promise to come home.
3. `1992 - First Camera`
   - Anchor: borrowed camera, blurry family photo, learning to preserve moments.
4. `2001 - Letter Before College`
   - Anchor: handwritten note, courage, leaving home, keep calling every Sunday.
5. `2015 - Hospital Garden`
   - Anchor: jasmine flowers, quiet bench, advice about forgiveness.

Timeline media:

- 1974 kitchen photo or placeholder image.
- 2001 letter/document photo.

Persona suggestion:

```json
{
  "humor": 45,
  "warmth": 90,
  "wisdom": 80,
  "verbosity": 45,
  "formality": 25
}
```

Exit criteria:

- Member 3 has exact demo prompts and expected response themes.
- Member 1 has seeded memory questions for Presence testing.

### T+5:30 to T+7:00: Integration With Member 1

Tasks:

- Test OpenAI provider with the seeded memory prompts.
- Test Gemini provider with the same prompts.
- Test Beyond Presence session creation.
- If Beyond Presence fails, capture the exact safe error message for demo fallback.
- Confirm app-side errors are understandable and do not leak secrets.

Exit criteria:

- The team has one primary provider and one backup provider.
- The exact final demo question is locked.

### T+7:00 to T+9:30: Reliability Fixes Only

Allowed fixes:

- Clearer edge-function error messages.
- Missing secret checks.
- Better memory fallback selection.
- Low-risk `echo_sessions.ended_at` cleanup if Member 1 needs it.
- Small RLS/storage policy fixes if the demo is blocked.

Not allowed:

- New backend architecture.
- New provider integrations.
- Large schema redesign.
- Destructive DB resets.

Exit criteria:

- Backend no longer changes except for showstoppers.

### T+9:30 to T+12:00: Rehearsal Support

Tasks:

- Attend full demo rehearsals.
- Watch network/logs for edge-function failures.
- Capture screenshots of Supabase rows if useful for judging.
- Prepare a short explanation of the memory pipeline for Member 3.

Memory pipeline talking point:

```text
Journal entries sync to Supabase, are embedded into pgvector chunks, and `start-ai-session` retrieves the most relevant memories before building the system prompt. If semantic search is unavailable, the app falls back to recent journals so the demo still remains grounded.
```

Exit criteria:

- The memory story is technically accurate and demonstrable.

### T+12:00 to T+15:00: Backend Freeze

Tasks:

- No new migrations.
- No new edge-function features.
- Monitor only.
- Fix only submission-blocking failures.
- Keep one known-good demo account/session untouched.

Exit criteria:

- Backend is stable for final presentation.

## Handoffs

With Member 1:

- By `T+2:00`, provide whether `beyond_presence` can create sessions.
- By `T+5:30`, provide seeded memories and exact prompts.
- By `T+7:00`, confirm primary and backup AI providers.

With Member 3:

- By `T+0:45`, provide env/secrets status.
- By `T+2:00`, provide migration status.
- By `T+5:30`, provide demo data list and expected answers.
- During rehearsals, provide logs or screenshots only if they strengthen the pitch.

## Commands To Run

Use these as appropriate:

```bash
npm run lint
npx tsc --noEmit
npx supabase functions deploy start-ai-session
npx supabase functions deploy embed-journal
npx supabase secrets list
npx supabase db push
```

Do not run destructive database commands without explicit team agreement.

## Manual Verification Checklist

Auth:

- [ ] Email/password signup or guest login works.
- [ ] `profiles` row exists for the active user.
- [ ] RLS blocks cross-user data.

Journal:

- [ ] New journal appears immediately in app.
- [ ] Journal syncs to `journals`.
- [ ] Pending state clears after sync.

Embedding:

- [ ] `embed-journal` accepts the journal ID.
- [ ] `journal_embeddings` rows are created.
- [ ] `journals.is_embedded` becomes true.

Recall:

- [ ] `match_memories()` returns rows for targeted question, or fallback is confirmed.
- [ ] OpenAI or Gemini response references seeded memory accurately.
- [ ] Response does not invent facts outside the seed data.

Timeline:

- [ ] Media uploads to `media-vault`.
- [ ] `media_vault` row is inserted.
- [ ] Signed URL renders in Timeline.

Beyond Presence:

- [ ] `start-ai-session` returns `livekit` creds, or failure is documented.
- [ ] `echo_sessions` row is inserted if BP succeeds.

## Fallback Policy

If embeddings fail by `T+4:00`, stop debugging embeddings for the main demo. Use the recency fallback path and seed the newest journals with the exact memories the demo will ask about.

If OpenAI fails, switch to Gemini. If Gemini fails, switch to OpenAI. If both fail, Member 3 should demonstrate capture, timeline, settings, and a recorded/screenshot backup of a previous successful response.

## Final Checklist

- [ ] Supabase URL and anon key are configured.
- [ ] Edge function secrets are configured or missing ones are documented.
- [ ] Migrations are verified.
- [ ] Demo account exists.
- [ ] At least 5 journal memories exist.
- [ ] At least 2 timeline items exist.
- [ ] At least one AI provider answers from memory.
- [ ] Member 1 has a working Presence prompt.
- [ ] Member 3 has final demo data and fallback notes.
