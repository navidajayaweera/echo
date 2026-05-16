# Implementation Status

Last updated: May 16, 2026

---

## ✅ Completed

### Authentication
- `app/(auth)/login.tsx` — Email/password sign-in, continue as guest, link to signup
- `app/(auth)/signup.tsx` — Display name + email + password, auto-redirects to tabs on success
- `providers/AuthProvider.tsx` — Supabase session management, `signInWithEmail`, `signUpWithEmail`, `signOut`, `continueAsGuest`, `updateProfile`, `refreshProfile`
- `components/RootNavigator.tsx` — Segment-based redirect guard (unauthenticated → `/login`, authenticated → `/(tabs)`)

### Supabase Data Sync
- `lib/supabase.ts` — Lazy-initialized client (prevents "supabaseUrl is required" crash before env vars load)
- `lib/journal-storage.ts` — AsyncStorage journal cache (replaced MMKV)
- `lib/journal-sync.ts` — `pullRemoteJournals` + `syncPendingJournals` + automatic `embed-journal` triggers
- `hooks/useJournalCache.ts` — Optimistic CRUD for journal entries
- `hooks/useJournalSync.ts` — Background sync on foreground + network reconnect + backfill for unembedded journals
- `providers/JournalSyncProvider.tsx` — Singleton sync instance; exposes `isSyncing`, `lastSyncAt`, `syncError`

### UI System
- `constants/echo-theme.ts` — Full design system: colors, fonts, spacing, layout tokens
- `components/ui/ScreenContainer.tsx` — Screen wrapper with gradient, safe-area insets, max-width
- `components/ui/PrimaryButton.tsx` — Variants (filled/outline/ghost), loading state, haptics
- `components/ui/EchoTextInput.tsx` — Themed text input
- `components/ui/SectionHeader.tsx` — Title + subtitle component
- `components/ui/icon-symbol.tsx` — SF Symbols → MaterialIcons cross-platform fallback
- `hooks/use-app-insets.ts` — Centralized safe-area + tab-bar height calculations

### Home Screen
- `app/(tabs)/index.tsx` — Greeting, stats, sync status badge, Begin Session CTA
- `components/home/GreetingPanel.tsx` — Time-based greeting + display name
- `components/home/StatsRow.tsx` — Memory count, pending sync count
- `components/home/SyncStatusBadge.tsx` — Live sync + avatar status
- `components/home/BeginSessionButton.tsx` — Navigates to `/presence`

### Journal Screen
- `app/(tabs)/journal.tsx` — Full FlatList, FAB, search filter
- `components/journal/JournalComposer.tsx` — Modal for creating entries
- `components/journal/JournalEntryCard.tsx` — Entry card with pending-sync dot
- `components/journal/JournalSearchBar.tsx` — Client-side title/body filter

### Presence Screen (AI sessions)
- `app/(tabs)/presence.tsx` — Provider picker, idle/connecting/active/error states, chat UI (LLM), BP viewport placeholder + PTT, memory overlay
- `supabase/functions/start-ai-session/` — Deno Edge Function router
- `supabase/functions/_shared/providers/openai.ts` — GPT-4o-mini chat
- `supabase/functions/_shared/providers/gemini.ts` — Gemini 1.5 Flash chat
- `supabase/functions/_shared/providers/beyond-presence.ts` — BP session + LiveKit JWT
- `supabase/functions/_shared/build-system-prompt.ts` — Persona + memory-grounded prompt
- `lib/types/ai-session.ts` — Client-side request/response types
- `lib/ai-session.ts` — Authenticated `fetch` wrapper to edge function
- `hooks/useAISession.ts` — State machine: idle → connecting → active; `sendMessage`, `endSession`
- `components/presence/MemoryModePane.tsx` — Animated slide-in overlay panel
- `components/presence/MemoryRecallCard.tsx` — Memory thumbnail + metadata card
- `hooks/useMemoryOverlay.ts` — LiveKit data-channel parser → store trigger

### Timeline Screen
- `app/(tabs)/timeline.tsx` — SectionList grouped by year, real Supabase data, upload/delete
- `hooks/useTimeline.ts` — `media_vault` queries, signed URL generation, `pickAndUpload`, `deleteMedia`
- `components/timeline/TimelineItemCard.tsx` — Photo thumbnails via expo-image, icon fallback
- `components/timeline/MediaUploadPicker.tsx` — Year + title modal → ImagePicker → Supabase Storage

### Settings Screen
- `app/(tabs)/settings.tsx` — Persona sliders (debounced DB save), display name, connections checklist, sign out
- `components/settings/PersonaSlider.tsx` — Labeled slider for each persona trait
- `components/settings/ConnectionChecklist.tsx` — Live Supabase / journal sync / AI session status

### Global State (Zustand)
- `stores/session.store.ts` — Connection status, active provider, LiveKit creds, transcript
- `stores/memory-overlay.store.ts` — `isOpen`, `memory` payload, `open()`/`close()`

### Database (Supabase)
- `001_extensions.sql` — `uuid-ossp`, `vector`, `sync_status` enum
- `002_core_tables.sql` — `profiles`, `journals`
- `003_rls_and_triggers.sql` — RLS + `handle_new_user` trigger + `updated_at` triggers
- `004_extend_tables.sql` — `bp_agent_id` on profiles, `is_embedded` on journals, `journal_embeddings`, `media_vault`, `echo_sessions`
- `005_rls_extend.sql` — RLS for new tables
- `006_vector_rpc.sql` — `match_memories()` cosine-similarity RPC
- `007_storage_buckets.sql` — `media-vault` private bucket + per-user path policies
- `008_ensure_vector_extension.sql` — Ensures `vector` extension exists on existing databases

### Edge Functions
- `start-ai-session` — AI provider router (OpenAI / Gemini / Beyond Presence) with semantic recall via `match_memories` + recency fallback
- `embed-journal` — Journal chunking + OpenAI text-embedding-3-small + `journal_embeddings` upsert

---

## 🔨 In progress / partial

| Item | Status | Notes |
|------|--------|-------|
| LiveKit RN SDK | Not installed | BP viewport shows placeholder; wire `@livekit/react-native` next |
| `echo_sessions` end cleanup | Missing | No `ended_at` timestamp written on session end |

---

## 📋 Next sprint backlog

### Priority 1 — LiveKit integration
- [ ] Install `@livekit/react-native`
- [ ] Replace `BPPlaceholder` in `presence.tsx` with real `VideoTrack` component
- [ ] Register `RoomEvent.DataReceived` listener → `handleLiveKitData()`
- [ ] Implement PTT: `Pressable.onPressIn` → publish mic track; `onPressOut` → mute
- [ ] Subscribe to avatar video track, display full-screen

### Priority 2 — Auto-embed pipeline
- [ ] Poll `journals.is_embedded` and show embedding progress indicator

### Priority 3 — Transcript + session store
- [ ] Wire `useSessionStore.appendTranscript` from AI message responses
- [ ] Display live transcript in Presence caption bar
- [ ] Write `ended_at` to `echo_sessions` on `endSession()`

### Priority 4 — Timeline enhancements
- [ ] Letter/document upload via `expo-document-picker`
- [ ] Full-screen image viewer (modal route)
- [ ] Link `media_vault.journal_id` when uploading from Journal detail view

### Priority 5 — Persona & profile
- [ ] `profiles.bp_agent_id` — store the BP agent ID returned from `start-ai-session`
- [ ] Profile photo upload to Supabase Storage → `profiles.avatar_url`
- [ ] Persona preview: tap "Test echo" to send a sample message using current trait settings

### Priority 6 — Polish
- [ ] Push notifications (Expo Notifications) for sync failures
- [ ] Offline indicator banner
- [ ] Swipe-to-delete on journal cards
- [ ] Keyboard dismiss on swipe in Presence chat
