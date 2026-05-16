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

### Current state (placeholder)

`BPPlaceholder` renders a black rectangle with the room name and a note about LiveKit wiring.

The PTT button is visible but inert — it will connect to LiveKit mic track publishing in the next sprint.

### Next sprint wiring

```ts
// Install: npx expo install @livekit/react-native

import { Room, RoomEvent } from '@livekit/react-native';

const room = new Room();
await room.connect(livekitCreds.wsUrl, livekitCreds.token);

// Video
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (track.kind === Track.Kind.Video) {
    setVideoTrack(track); // render in <VideoView track={videoTrack} />
  }
});

// Memory overlay events
room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
  handleLiveKitData(payload);
});

// PTT
onPressIn:  await room.localParticipant.setMicrophoneEnabled(true);
onPressOut: await room.localParticipant.setMicrophoneEnabled(false);
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
| `lib/ai-session.ts` | `callAISession()` fetch helper |
| `lib/types/ai-session.ts` | Request/response TypeScript types |
| `hooks/useMemoryOverlay.ts` | LiveKit data parser + store trigger |
| `stores/memory-overlay.store.ts` | Overlay open/close state |
| `stores/session.store.ts` | Global session metadata (for settings) |
| `components/presence/MemoryModePane.tsx` | Animated side panel |
| `components/presence/MemoryRecallCard.tsx` | Memory display card |
| `supabase/functions/start-ai-session/` | Edge function + provider registry |
