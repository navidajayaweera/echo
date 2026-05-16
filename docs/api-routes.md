# API Routes

All backend logic runs in **Supabase Edge Functions** (Deno TypeScript runtime).  
Base URL: `https://<your-project>.supabase.co/functions/v1/`

Every endpoint:
- Requires `Authorization: Bearer <supabase-session-jwt>` and `apikey: <anon-key>` headers
- Returns JSON
- Handles `OPTIONS` preflight with CORS headers

---

## `POST /start-ai-session`

**Purpose:** Start or continue an AI memory session. Routes to the user-selected AI provider, injects a persona + memory-grounded system prompt, and returns credentials or a response message.

### Request headers

```
Authorization: Bearer <user JWT>
apikey: <EXPO_PUBLIC_SUPABASE_ANON_KEY>
Content-Type: application/json
```

### Request body

```ts
{
  provider: 'openai' | 'gemini' | 'beyond_presence';

  // LLM providers only — full conversation history
  // On session start: omit or send []
  // On each subsequent turn: send the entire history so far
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;

  // Beyond Presence only — override persona traits for this session
  persona_overrides?: {
    humor?: number;      // 0–100
    warmth?: number;
    wisdom?: number;
    verbosity?: number;
    formality?: number;
  };

  // Optional free-text injected verbatim into the system prompt
  context?: string;
}
```

### Response — OpenAI or Gemini

```ts
{
  provider: 'openai' | 'gemini';
  message: string;        // assistant reply
  model: string;          // e.g. "gpt-4o-mini", "gemini-1.5-flash"
  sessionId: string;      // UUID (new each call; stateless)
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}
```

### Response — Beyond Presence

```ts
{
  provider: 'beyond_presence';
  sessionId: string;
  agentId?: string;       // BP agent reference (store in profiles.bp_agent_id)
  livekit: {
    token: string;        // LiveKit participant JWT (2-hour TTL)
    wsUrl: string;        // e.g. "wss://your-project.livekit.cloud"
    roomName: string;     // Unique room per session
  };
}
```

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{ error: "Unknown provider …" }` | Invalid `provider` value |
| `401` | `{ error: "Unauthorized" }` | Missing or expired JWT |
| `500` | `{ error: "OPENAI_API_KEY is not set" }` | Missing secret in Supabase vault |
| `500` | `{ error: "OpenAI error 429: …" }` | Upstream API error |

### Internal flow

```
1. verifyUser(Authorization header)
2. Load profiles row → persona_traits
3. Embed latest user message (or default recall query) with OpenAI `text-embedding-3-small`
4. `rpc('match_memories')` for semantic recall
5. Fallback to last 10 journals if embedding/RPC fails or no semantic matches
6. buildSystemPrompt(displayName, traits, memories)
7. PROVIDERS[provider].run(request, systemPrompt)
8. [Beyond Presence only] INSERT INTO echo_sessions (best-effort)
9. Return result
```

### System prompt structure

The prompt is built by `_shared/build-system-prompt.ts`:

```
You are an AI echo of {displayName} — a living memory avatar…

Personality traits:
- Humor level {n}/100 — [description]
- Warmth {n}/100 — [description]
- Wisdom {n}/100 — [description]
- Verbosity {n}/100 — [description]
- Formality {n}/100 — [description]

Known memories and experiences:
- [year] Title: first 300 chars of body
- …

Guidelines:
- Speak in first person
- Draw naturally from memories above
- Do not invent facts not present in memories
…
```

### How to add a new AI provider

1. Create `supabase/functions/_shared/providers/my-provider.ts`:
   ```ts
   export class MyProvider implements AIProvider {
     readonly name = 'my_provider' as const;
     async run(req, systemPrompt): Promise<StartSessionResult> { … }
   }
   ```
2. Add `'my_provider'` to `ProviderName` in `_shared/providers/types.ts`
3. Mirror the type in `lib/types/ai-session.ts` (`AIProviderName`)
4. Register in `start-ai-session/index.ts`:
   ```ts
   const PROVIDERS = { …, my_provider: new MyProvider() };
   ```

---

## `POST /embed-journal`

**Purpose:** Chunk a journal entry's body, embed each chunk with OpenAI `text-embedding-3-small`, and store vectors in `journal_embeddings`. Marks `journals.is_embedded = true` on completion. Idempotent — re-running deletes old chunks and re-embeds.

### Auth modes

| Caller | Header |
|--------|--------|
| Authenticated user | `Authorization: Bearer <user JWT>` |
| Service role (background job) | `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` |

### Request body

```ts
{
  journal_id: string;   // UUID of the journals row to embed
}
```

### Response

```ts
{
  journal_id: string;
  chunks_embedded: number;   // How many chunks were stored
}
```

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| `401` | `{ error: "Unauthorized" }` | JWT missing or user doesn't own the journal |
| `500` | `{ error: "Journal not found: …" }` | Invalid `journal_id` |
| `500` | `{ error: "OPENAI_API_KEY is not set" }` | Missing secret |
| `500` | `{ error: "OpenAI embeddings error 429: …" }` | Rate limit / quota |

### Internal flow

```
1. Verify auth (user JWT or service role)
2. Fetch journals row by journal_id
3. Enforce ownership if called by user JWT
4. If existing journal_embeddings rows → DELETE (re-embed)
5. Chunk body into ~400 char overlapping segments
6. POST to OpenAI /v1/embeddings (batch all chunks)
7. UPSERT journal_embeddings rows
8. UPDATE journals SET is_embedded = true
9. Return { journal_id, chunks_embedded }
```

### Chunking algorithm

```
chunk_size    = 400 characters
chunk_overlap = 80 characters
min_chunk_len = 20 characters
split_at      = sentence boundary (". ") when possible
```

### Deploy

```bash
supabase functions deploy embed-journal
supabase functions deploy start-ai-session
```

### Set secrets (one-time per project)

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set BEYOND_PRESENCE_API_KEY=bp_...
supabase secrets set LIVEKIT_API_KEY=API...
supabase secrets set LIVEKIT_API_SECRET=secret...
supabase secrets set LIVEKIT_URL=wss://your-project.livekit.cloud
```

---

## Supabase Database RPC

### `match_memories(query_embedding, match_user_id, match_count, match_threshold)`

Vector similarity search. Called by `start-ai-session` for semantic memory retrieval.

```sql
SELECT * FROM match_memories(
  query_embedding := '[0.1, 0.2, …]'::vector(1536),
  match_user_id   := 'uuid',
  match_count     := 5,
  match_threshold := 0.75
);
```

Returns:
```ts
Array<{
  journal_id:  string;
  chunk_text:  string;
  similarity:  number;   // 0–1, higher is more similar
  memory_year: number | null;
  keywords:    string[];
}>
```

---

## Client-side API layer (`lib/ai-session.ts`)

```ts
import { callAISession } from '@/lib/ai-session';

const result = await callAISession({
  provider: 'openai',
  messages: [{ role: 'user', content: 'Tell me about grandma' }],
});

if (result.provider === 'beyond_presence') {
  const { livekit } = result;  // connect LiveKit room
} else {
  console.log(result.message); // display in chat
}
```

`callAISession` automatically:
- Reads the current Supabase session JWT
- Adds both `Authorization` and `apikey` headers
- Throws a typed error on non-2xx responses
