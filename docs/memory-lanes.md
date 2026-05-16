# Memory Lanes

> The full lifecycle of a memory — from a user writing a journal entry to the AI avatar referencing it live during a session.

---

## Overview

The "memory lanes" system is the core intelligence of Echoes. It transforms raw text journal entries and uploaded media into a living, context-aware AI persona. There are four distinct lanes:

| Lane | Name | Description |
|------|------|-------------|
| 1 | **Capture** | User writes journal entries and uploads media |
| 2 | **Embedding** | Journal bodies are vectorized and stored for semantic search |
| 3 | **Recall** | At session time, relevant memories are retrieved and injected into the AI prompt |
| 4 | **Overlay** | During live sessions, recalled memories surface in the UI as an animated side panel |

---

## Lane 1 — Capture

### Journal entries

```
JournalComposer (UI modal)
  → title, body, mood_tag, keywords[], memory_year
  → useJournalCache.addEntry()
      → AsyncStorage: { localId, body, pendingSync: true, createdAt }
  → UI renders immediately (offline-first)
  → JournalSyncProvider background worker
      → supabase.journals.upsert({ local_id, body, keywords, … })
      → On success: pendingSync → false, remoteId stored
```

**Key files:**
- `components/journal/JournalComposer.tsx` — capture UI
- `hooks/useJournalCache.ts` — optimistic state + AsyncStorage writes
- `lib/journal-storage.ts` — raw AsyncStorage read/write helpers
- `lib/journal-sync.ts` — `syncPendingJournals()` / `pullRemoteJournals()`

### Media vault

```
MediaUploadPicker (UI modal)
  → User picks photo/video from library (expo-image-picker)
  → Reads base64 from ImagePickerAsset
  → supabase.storage.from('media-vault').upload('{user_id}/{timestamp}.ext', bytes)
  → supabase.media_vault.insert({ media_type, storage_path, memory_year, title, … })
  → Signed URL generated on next refresh
```

**Key files:**
- `components/timeline/MediaUploadPicker.tsx` — year/title modal + picker trigger
- `hooks/useTimeline.ts` — `pickAndUpload()` / `deleteMedia()`

---

## Lane 2 — Embedding

### How it works

Each journal entry is transformed into a vector representation using OpenAI's `text-embedding-3-small` model (1536 dimensions). The vectors are stored in the `journal_embeddings` table with an HNSW index for fast approximate nearest-neighbour (ANN) search.

```
POST /functions/v1/embed-journal { journal_id }

  1. Fetch journals row
  2. Build full_text = title + '\n\n' + body
  3. Chunk into ~400 char segments with 80 char overlap:
       Chunk 0: chars 0–400
       Chunk 1: chars 320–720
       Chunk 2: chars 640–1040
       …
  4. Batch POST to OpenAI /v1/embeddings
       model: text-embedding-3-small
       input: [chunk0, chunk1, chunk2, …]
  5. UPSERT journal_embeddings:
       { journal_id, user_id, chunk_index, chunk_text, embedding: vector(1536) }
  6. UPDATE journals SET is_embedded = true
```

### Database table

```sql
CREATE TABLE public.journal_embeddings (
  id            UUID PRIMARY KEY,
  journal_id    UUID REFERENCES journals(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL DEFAULT 0,
  chunk_text    TEXT NOT NULL,
  embedding     vector(1536) NOT NULL,
  created_at    TIMESTAMPTZ,
  UNIQUE (journal_id, chunk_index)
);

CREATE INDEX ON journal_embeddings
  USING hnsw (embedding vector_cosine_ops);
```

### When to trigger

| Trigger | Status |
|---------|--------|
| Manual: `POST /embed-journal { journal_id }` | ✅ Available |
| After `syncPendingJournals` | ✅ Wired (auto invoke per successful upsert) |
| Backfill unembedded rows on sync cycle | ✅ Wired (`syncUnembeddedJournals`) |
| Background queue via Supabase pg_cron | 📋 Backlog |

---

## Lane 3 — Recall

### Current implementation (vector-first with fallback)

`start-ai-session` now follows a vector-first retrieval path:

```ts
const queryEmbedding = await createEmbedding(lastUserMessageOrDefault);
const { data: memories } = await supabase.rpc('match_memories', ...);

// If embeddings are unavailable, RPC errors, or no matches are returned:
const fallback = await supabase
  .from('journals')
  .select('title, body, memory_year, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(10);
```

### `match_memories` RPC

```sql
CREATE FUNCTION match_memories(
  query_embedding vector(1536),
  match_user_id   UUID,
  match_count     INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.75
)
RETURNS TABLE (journal_id UUID, chunk_text TEXT, similarity FLOAT,
               memory_year INT, keywords TEXT[])
AS $$
  SELECT je.journal_id, je.chunk_text,
         1 - (je.embedding <=> query_embedding) AS similarity,
         j.memory_year, j.keywords
  FROM journal_embeddings je
  JOIN journals j ON j.id = je.journal_id
  WHERE je.user_id = match_user_id
    AND 1 - (je.embedding <=> query_embedding) > match_threshold
  ORDER BY je.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### System prompt injection

`buildSystemPrompt` (`_shared/build-system-prompt.ts`) converts memories + persona traits into a coherent instruction prompt:

```
You are an AI echo of {displayName} — a living memory avatar…

Personality traits:
- Humor 65/100 — occasionally witty
- Warmth 90/100 — deeply warm, caring, emotionally present
…

Known memories and experiences:
- [1985] Summer letters: We used to write every week that summer…
- [1974] Kitchen photo: The smell of her kitchen on Sunday mornings…
…

Guidelines:
- Speak in first person
- Do not invent facts not in memories
- Never break character
```

---

## Lane 4 — Overlay

### What it is

During a Beyond Presence session, the avatar's backend can emit a `memory.recalled` JSON event over the LiveKit data channel when it draws on a specific memory. The Echoes app intercepts this event and slides in a `MemoryModePane` from the right edge of the screen, showing the referenced memory.

### Event shape (`lib/types/memory-events.ts`)

```ts
interface MemoryRecalledEvent {
  type: 'memory.recalled';
  journalId?: string;       // link to journals row
  mediaId?: string;         // link to media_vault row
  title: string;            // display title
  snippet: string;          // excerpt to show in card
  memoryYear?: number;      // year badge
  thumbnailUrl?: string;    // optional image
}
```

### Event pipeline

```
LiveKit Room
  → RoomEvent.DataReceived (Uint8Array payload)
  → useMemoryOverlay.handleLiveKitData(payload)
      → TextDecoder.decode(payload)
      → JSON.parse → isMemoryRecalledEvent type guard
      → useMemoryOverlayStore.open(event)
          → { isOpen: true, memory: event }
  → MemoryModePane re-renders
      → Animated.spring({ toValue: 0 })   // slides in from right
  → User taps × → store.close()
      → Animated.spring({ toValue: PANE_WIDTH + 32 })  // slides out
```

### Component tree (Presence screen)

```
PresenceScreen
  └── BPViewport (full-screen)
       ├── BPPlaceholder (video area)
       ├── CaptionBar (absolute, above PTT)
       ├── PTTButton (absolute, bottom center)
       └── MemoryModePane (absolute, right side, animated)
            └── MemoryRecallCard
                 ├── Image (thumbnail, if present)
                 ├── Year badge
                 ├── Title (serif)
                 └── Snippet (4 lines max)
```

### Zustand stores

**`memory-overlay.store.ts`**
```ts
{
  isOpen: boolean;
  memory: MemoryRecalledEvent | null;
  open(memory: MemoryRecalledEvent): void;
  close(): void;
}
```

**`session.store.ts`** (records session metadata)
```ts
{
  sessionId: string | null;
  provider: AIProviderName | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
  livekit: LiveKitCreds | null;
  transcript: TranscriptLine[];
  errorMessage: string | null;
  // Actions: setConnecting, setConnected, setError, setDisconnected, appendTranscript
}
```

---

## Memory data model (complete)

```
journals
  id           UUID PK
  user_id      UUID → profiles
  title        TEXT
  body         TEXT (full journal text)
  mood_tag     TEXT (e.g. "nostalgic", "joyful")
  keywords     TEXT[] (tags for search + overlay matching)
  memory_year  INT (year being written about, e.g. 1985)
  is_embedded  BOOL (true once embed-journal has run)
  sync_status  pending | synced | failed
  local_id     TEXT (client UUID, for idempotent sync)

journal_embeddings
  id           UUID PK
  journal_id   UUID → journals
  user_id      UUID → profiles
  chunk_index  INT
  chunk_text   TEXT (raw text of this chunk)
  embedding    vector(1536)

media_vault
  id           UUID PK
  user_id      UUID → profiles
  journal_id   UUID? → journals (optional link)
  media_type   photo | letter | voice | video | document
  storage_path TEXT (Supabase Storage object path)
  public_url   TEXT (signed URL, cached)
  title        TEXT
  description  TEXT
  memory_year  INT (groups items in Timeline)
  keywords     TEXT[]
  metadata     JSONB (EXIF, duration, mime, dimensions)

echo_sessions
  id              UUID PK
  user_id         UUID → profiles
  provider        TEXT (beyond_presence | openai | gemini)
  livekit_room    TEXT
  bp_session_id   TEXT
  started_at      TIMESTAMPTZ
  ended_at        TIMESTAMPTZ (null if session still active)
  memories_recalled INT
```

---

## Roadmap for memory intelligence upgrades

| Upgrade | Impact | Effort |
|---------|--------|--------|
| Tune `match_memories` threshold + top-K per provider | Better precision/recall balance | Low |
| Embed `media_vault` descriptions | Photos/letters searchable by meaning | Medium |
| Per-turn embedding: embed last user message → query vector → inject top-K | Context-aware per turn, not just session start | High |
| BP memory.recalled event → fetch Supabase signed URL for `mediaId` | Show actual photo in overlay, not just text | Medium |
| Timeline ↔ Presence cross-link: tap journal → load in presence session context | Directed recall on demand | Medium |
