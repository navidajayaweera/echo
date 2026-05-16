# System Architecture

---

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native (Expo)                          │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │  Auth    │  │ Journal  │  │ Presence  │  │  Timeline    │   │
│  │ Provider │  │  Cache   │  │  Screen   │  │   Screen     │   │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘   │
│       │             │              │               │            │
│  ┌────▼─────────────▼──────────────▼───────────────▼──────────┐ │
│  │               Supabase JS Client (anon key)                │ │
│  └─────────────────────────────┬───────────────────────────────┘ │
└────────────────────────────────┼────────────────────────────────┘
                                 │ HTTPS
             ┌───────────────────▼──────────────────────┐
             │              Supabase Platform            │
             │                                          │
             │  ┌─────────┐  ┌───────────┐  ┌────────┐ │
             │  │  Auth   │  │PostgreSQL │  │Storage │ │
             │  │  (JWT)  │  │+pgvector  │  │(media) │ │
             │  └────┬────┘  └─────┬─────┘  └────────┘ │
             │       │             │                    │
             │  ┌────▼─────────────▼──────────────────┐ │
             │  │         Edge Functions (Deno)        │ │
             │  │  start-ai-session │ embed-journal    │ │
             │  └────┬──────────────┬──────────────────┘ │
             └───────┼──────────────┼────────────────────┘
                     │              │
          ┌──────────▼──┐   ┌───────▼──────────┐
          │ AI Providers │   │  Beyond Presence  │
          │ OpenAI       │   │  + LiveKit Cloud  │
          │ Gemini       │   └───────────────────┘
          └─────────────┘
```

---

## Data flows

### A. User authentication

```
App launch
  → RootNavigator checks Supabase session
  → No session  → redirect to /login
  → Session OK  → redirect to /(tabs)
  → AuthProvider.loadProfile() fetches profiles row
  → JournalSyncProvider pulls remote journals into AsyncStorage
```

### B. Journal entry lifecycle

```
User writes entry in JournalComposer
  → useJournalCache.addEntry()
      → upsertJournalEntry() writes to AsyncStorage (local_id, pendingSync: true)
      → UI re-renders immediately (zero network latency)
  → JournalSyncProvider (background)
      → syncPendingJournals()
          → supabase.from('journals').upsert({ ..., local_id })
          → On success: flip pendingSync → false, store remote id
          → auto POST /functions/v1/embed-journal { journal_id }
      → embed-journal chunks body → Gemini embeddings → journal_embeddings table
```

### C. Presence session (LLM providers)

```
User selects provider (openai | gemini) in PresenceScreen picker
  → Preference persisted in AsyncStorage via useAISession
User taps "Begin session"
  → useAISession.startSession()
      → callAISession({ provider, messages: [] })
          → POST /functions/v1/start-ai-session
              → verifyUser (JWT)
              → load profile + persona_traits from DB
              → embed latest user message + query `match_memories` (fallback to latest journals)
              → buildSystemPrompt(displayName, traits, memories)
              → OpenAIProvider.run() or GeminiProvider.run()
              → returns { provider, message, model, sessionId }
  → Greeting message shown as first chat bubble
User sends message
  → sendMessage(text) appends to messages[]
  → callAISession({ provider, messages: full_history })
  → response appended as assistant bubble
```

### D. Presence session (Beyond Presence)

```
User selects "Beyond Presence" in picker
  → useAISession.startSession()
      → callAISession({ provider: 'beyond_presence' })
          → POST /functions/v1/start-ai-session
              → verifyUser
              → buildSystemPrompt (same pipeline)
              → BeyondPresenceProvider.run()
                  → POST https://api.beyondpresence.ai/v1/sessions
                  → Mint LiveKit participant JWT (livekit-server-sdk)
                  → Insert echo_sessions row (best-effort)
              → returns { provider, livekit: { token, wsUrl, roomName }, sessionId }
  → PresenceScreen shows BPPlaceholder (full LiveKit wiring = next sprint)
  → MemoryModePane slides in when LiveKit data channel emits memory.recalled events
```

### E. Memory recall overlay

```
LiveKit data channel (Beyond Presence → client)
  → RoomEvent.DataReceived
      → useMemoryOverlay.handleLiveKitData(payload)
          → JSON.parse → isMemoryRecalledEvent type guard
          → useMemoryOverlayStore.open(event)
  → MemoryModePane animates in from right (Animated.spring)
  → Displays MemoryRecallCard (title, year, snippet, optional thumbnail)
  → User taps × → store.close() → pane slides out
```

### F. Timeline upload

```
User taps "+ Add memory" in TimelineScreen
  → MediaUploadPicker modal (enter year + optional title)
  → User confirms → launchImageLibraryAsync({ base64: true })
  → useTimeline.pickAndUpload(year, title)
      → Read asset.base64
      → supabase.storage.from('media-vault').upload('{user_id}/{timestamp}.ext', bytes)
      → supabase.from('media_vault').insert({ user_id, media_type, storage_path, memory_year, … })
      → refresh() re-queries + generates signed URLs
  → SectionList re-renders grouped by year
```

---

## Provider registry pattern

The AI provider system uses an **open-closed registry** — adding a new provider requires zero changes to routing or client code.

```
supabase/functions/_shared/providers/
├── types.ts              AIProvider interface + discriminated union types
├── openai.ts             implements AIProvider
├── gemini.ts             implements AIProvider
└── beyond-presence.ts    implements AIProvider

start-ai-session/index.ts:
  const PROVIDERS: Record<ProviderName, AIProvider> = {
    beyond_presence: new BeyondPresenceProvider(),
    openai:          new OpenAIProvider(),
    gemini:          new GeminiProvider(),
  };
```

To add a new provider (e.g. Anthropic Claude):
1. Create `_shared/providers/anthropic.ts` implementing `AIProvider`
2. Add `'anthropic'` to `ProviderName` in `types.ts` (and mirror in `lib/types/ai-session.ts`)
3. Register in the `PROVIDERS` map

---

## State management layers

| Layer | Technology | Scope |
|-------|-----------|-------|
| Auth + profile | React Context (`AuthProvider`) | App-wide |
| Journal cache | AsyncStorage + `useJournalCache` hook | Local device |
| AI session state | `useAISession` hook (local state machine) | Presence screen |
| Session metadata | Zustand `session.store` | App-wide (for settings checklist) |
| Memory overlay | Zustand `memory-overlay.store` | App-wide (Presence + any future screen) |
| Media vault | `useTimeline` hook (DB + signed URLs) | Timeline screen |

---

## Navigation tree

```
app/_layout.tsx
  SafeAreaProvider
  └── AuthProvider
       └── JournalSyncProvider
            └── RootNavigator
                 ├── Unauthenticated → /login
                 │   app/(auth)/_layout.tsx
                 │   ├── /login     LoginScreen
                 │   └── /signup    SignupScreen
                 └── Authenticated → /(tabs)
                     app/(tabs)/_layout.tsx   (5-tab bar)
                     ├── /          HomeScreen
                     ├── /journal   JournalScreen
                     ├── /presence  PresenceScreen  ← HERO
                     ├── /timeline  TimelineScreen
                     └── /settings  SettingsScreen
```

---

## Database entity-relationship

```
auth.users  ──1:1──  profiles
profiles    ──1:*──  journals
journals    ──1:*──  journal_embeddings
profiles    ──1:*──  media_vault
journals    ──0:1──  media_vault (optional link via journal_id FK)
profiles    ──1:*──  echo_sessions
```

See [migration files](../supabase/migrations/) for full DDL.
