# Presence Screen

Route: `app/(tabs)/presence.tsx`  
Tab icon: `video.fill`

This is the **hero screen** — the immersive AI session experience.

---

## Purpose

Connect the user with their memory echo. Supports two modes:

| Mode | Description |
|------|-------------|
| **LLM Chat** (OpenAI / Gemini) | Text-in, text-out conversation grounded in the user's memories |
| **Beyond Presence** | Live avatar session via BP API + LiveKit WebRTC (video placeholder until LiveKit RN SDK is wired) |

---

## Layout

```
ScreenContainer (no gradient, black bg)
  └── KeyboardAvoidingView
       ├── ProviderPicker (horizontal scroll of chips)
       │
       ├── [IDLE]      Centered icon + "Begin session" button
       ├── [CONNECTING] ActivityIndicator + "Connecting to…"
       ├── [ERROR]      Error message + "Retry" button
       │
       ├── [ACTIVE — LLM]
       │    ├── FlatList (chat bubbles, user right / assistant left)
       │    │    └── Typing indicator (•••) when isTyping
       │    └── InputRow
       │         ├── TextInput
       │         └── Send button (paperplane.fill)
       │
       └── [ACTIVE — BP]
            ├── BPPlaceholder (black rect, centered label)
            ├── CaptionBar (absolute, above PTT button)
            ├── PTTButton  (absolute, bottom center — "Hold to talk")
            └── MemoryModePane (absolute, right edge, animated slide-in)

  EndSessionButton (absolute, top-right, shown when active)
```

---

## State machine (`useAISession`)

```
idle
  → startSession() → connecting
connecting
  → callAISession() success → active (LLM or BP)
  → callAISession() error   → error
active
  → sendMessage()  → (same state, messages appended)
  → endSession()   → idle
  → setProvider()  → idle (resets session)
error
  → startSession() → connecting (retry)
```

Full types:
```ts
type SessionState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'active'; provider: 'openai' | 'gemini'; sessionId: string }
  | { status: 'active'; provider: 'beyond_presence'; sessionId: string; livekit: LiveKitCreds }
  | { status: 'error'; message: string };
```

---

## Provider picker

```tsx
<ProviderPicker
  selected={provider}         // 'openai' | 'gemini' | 'beyond_presence'
  onSelect={setProvider}      // persists to AsyncStorage
  disabled={isActive || isConnecting}
/>
```

The selected provider is persisted in AsyncStorage under `echo_ai_provider`. On app restart, the last-used provider is restored.

---

## LLM chat

### Message flow

```
User types in TextInput → hits send or return
  → sendMessage(text)
      → append { role: 'user', content: text } to messages[]
      → setIsTyping(true)
      → callAISession({ provider, messages: full_history })
      → append { role: 'assistant', content: response.message }
      → setIsTyping(false)
```

### Chat bubble styles

| Role | Alignment | Background |
|------|-----------|------------|
| `user` | right | `EchoColors.accent` (#E8E6E3) |
| `assistant` | left | `EchoColors.bgElevated` with border |

### Message history

The full conversation history is sent with every request (stateless API). The edge function does **not** store session state — the client is the source of truth for message history.

---

## Beyond Presence mode

### API (official: api.bey.dev)

Beyond Presence runs the avatar agent and provisions a LiveKit room. The client app uses `@livekit/react-native` to join that room — no LiveKit Cloud account needed in the app itself.

| Step | Where | API |
|------|-------|-----|
| Agent create / update (memory-grounded prompt) | `_shared/beyond-presence-agent.ts` | `POST/PATCH https://api.bey.dev/v1/agents` |
| Create call → get LiveKit creds | `_shared/providers/beyond-presence.ts` | `POST https://api.bey.dev/v1/calls` |
| Join room + video + PTT + data events | `hooks/useLiveKitRoom.ts` | `@livekit/react-native` |

Auth for all Bey API calls: `x-api-key: <BEY_API_KEY>` header.

### Per-user Beyond Presence avatar

Each Echo user stores `profiles.bp_avatar_id` (UUID from Bey). The app loads avatars with **`GET /functions/v1/list-bey-avatars`** (proxies `GET https://api.bey.dev/v1/avatars`). In **Settings → Echo avatar**, the user taps **Load avatars** and selects one that is **ready** (`status: available`). That updates the profile and triggers **`refresh-avatar-knowledge`** so the managed agent is created or patched with the correct `avatar_id`.

Optional server fallback when no profile avatar is set:

```bash
npx supabase secrets set BEY_DEFAULT_AVATAR_ID=<public or shared default avatar UUID>
```

### Supabase secrets

```bash
npx supabase secrets set BEY_API_KEY=<key from bey.dev dashboard>
```

Old secrets no longer needed: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `BEYOND_PRESENCE_API_KEY`, `BEY_AVATAR_ID` (replaced by per-user `bp_avatar_id` + optional `BEY_DEFAULT_AVATAR_ID`).

### Call flow

```
start-ai-session edge function
  → PATCH api.bey.dev/v1/agents/{id}   (update memory prompt)
  → POST  api.bey.dev/v1/calls         { agent_id }
  ← { livekit_url, livekit_token, id }

App receives: { wsUrl, token, roomName }
  → room.connect(wsUrl, token)          (@livekit/react-native)
  ← remote video + audio tracks
  ← DataReceived → memory.recalled event → MemoryModePane
PTT: room.localParticipant.setMicrophoneEnabled(true/false)
```

### Key client files

| File | Role |
|------|------|
| `hooks/useLiveKitRoom.ts` | Room connect/disconnect, video track, PTT mic, voice state, DataReceived |
| `components/presence/LiveKitAvatarViewport.tsx` | VideoView (real) or AvatarPulse (fallback) + status badge |
| `components/presence/BeyondPresenceActive.tsx` | Full session UI; calls `useLiveKitRoom` internally |

### Dev build requirement

`@livekit/react-native` uses native modules — **Expo Go will not work**. This package **does not** ship an Expo config plugin; do **not** add it to `plugins` in `app.json` (that causes `PluginError`). Microphone usage is declared in `app.json` under `ios.infoPlist` and `android.permissions`.

```bash
npx expo prebuild
npx expo run:android    # or run:ios
```

---

## Memory overlay

The `MemoryModePane` is always rendered in the component tree but has `display: none` (via `translateX = PANE_WIDTH + 32`) when closed.

```tsx
<MemoryModePane
  isOpen={memoryOpen}         // from useMemoryOverlay()
  memory={memory}             // MemoryRecalledEvent | null
  onClose={closeMemory}
  rightOffset={horizontal + right}
  bottomOffset={fabBottom + 72}
/>
```

The pane animates using `Animated.spring` with `tension: 80, friction: 12` for a natural slide-in feel.

See [memory-lanes.md](../memory-lanes.md) for the full overlay event pipeline.

---

## Edge function integration

Every message (or session start) calls `POST /functions/v1/start-ai-session`.  
See [api-routes.md](../api-routes.md) for full request/response spec.

The system prompt is rebuilt on **every request** — ensuring it always reflects the latest journal entries and profile state.

---

## Key files

| File | Role |
|------|------|
| `app/(tabs)/presence.tsx` | Screen + layout + state wiring |
| `hooks/useAISession.ts` | Session state machine + message management |
| `hooks/useLiveKitRoom.ts` | LiveKit room, video/audio tracks, PTT, DataReceived |
| `lib/ai-session.ts` | `callAISession()` fetch helper |
| `lib/types/ai-session.ts` | Request/response TypeScript types |
| `hooks/useMemoryOverlay.ts` | LiveKit data parser + store trigger |
| `components/presence/LiveKitAvatarViewport.tsx` | VideoView or AvatarPulse fallback |
| `components/presence/BeyondPresenceActive.tsx` | Full BP session UI (owns `useLiveKitRoom`) |
| `stores/memory-overlay.store.ts` | Overlay open/close state |
| `components/presence/MemoryModePane.tsx` | Animated side panel |
| `components/presence/MemoryRecallCard.tsx` | Memory display card |
| `supabase/functions/start-ai-session/` | Edge function + provider registry |
| `supabase/functions/_shared/providers/beyond-presence.ts` | `POST /v1/calls` → LiveKit creds |
| `supabase/functions/_shared/beyond-presence-agent.ts` | `POST/PATCH /v1/agents` (uses `bp_avatar_id`) |
| `supabase/functions/list-bey-avatars/` | Proxy `GET /v1/avatars` for Settings picker |
| `components/settings/BeyAvatarSection.tsx` | Load + select `bp_avatar_id` |
