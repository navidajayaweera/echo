# Tech Stack

---

## Frontend — React Native (Expo Managed)

| Package | Version | Role |
|---------|---------|------|
| `expo` | 54.0.x | Managed workflow runtime |
| `expo-router` | v4 (bundled) | File-based tab + stack navigation |
| `react-native` | 0.76.x | Core framework |
| `react` | 18.x | UI library |
| `react-native-reanimated` | 3.x | Gesture animations |
| `react-native-gesture-handler` | 2.x | Native gesture recogniser |
| `react-native-safe-area-context` | 4.x | Safe area insets (notch, home bar) |
| `react-native-screens` | 3.x | Native screen containers |
| `@react-navigation/bottom-tabs` | 6.x | Bottom tab bar + `useBottomTabBarHeight` |
| `expo-linear-gradient` | 14.x | Cinematic gradient backgrounds |
| `expo-haptics` | 14.x | Haptic feedback on buttons |
| `expo-image` | 2.x | Optimised image rendering (`<Image>`) |
| `expo-image-picker` | 17.x | Photo/video library access |
| `expo-symbols` | 0.x | SF Symbols (iOS only) |
| `@expo/vector-icons` (MaterialIcons) | 14.x | Cross-platform icon fallback |
| `expo-constants` | 17.x | `app.json` extra values at runtime |
| `expo-network` | 7.x | Network state for sync triggers |
| `expo-auth-session` | 6.x | OAuth helpers |
| `expo-web-browser` | 14.x | In-app browser for OAuth |

---

## State & Storage

| Package | Role |
|---------|------|
| `zustand` | 5.x — lightweight global state (session store, memory overlay store) |
| `@react-native-async-storage/async-storage` | Persistent local journal cache + auth sessions |

> **Note:** MMKV was evaluated but removed because it requires TurboModules (unavailable in Expo Go). AsyncStorage is the current production choice.

---

## Backend — Supabase

| Service | Usage |
|---------|-------|
| **Auth** | Email/password + anonymous sign-in; JWT sessions persisted via AsyncStorage |
| **PostgreSQL 15** | All relational data — profiles, journals, media_vault, echo_sessions |
| **pgvector** | `vector(1536)` column on `journal_embeddings`; HNSW index for ANN search |
| **Row Level Security** | Every user table enforced with `auth.uid()` policies |
| **Storage** | `media-vault` private bucket; per-user path enforcement `{user_id}/*` |
| **Edge Functions** | Deno runtime; `start-ai-session` + `embed-journal` |

Supabase JS client package: `@supabase/supabase-js` ^2.x

---

## AI Providers

| Provider | SDK / API | Used for |
|----------|-----------|----------|
| **OpenAI** | REST (`/v1/chat/completions`, `/v1/embeddings`) | LLM chat in Presence + journal embeddings |
| **Google Gemini** | REST (`generativelanguage.googleapis.com`) | Alternative LLM chat in Presence |
| **Beyond Presence** | REST (`api.beyondpresence.ai/v1/sessions`) | Hyper-realistic avatar sessions (LiveKit-backed) |

---

## Real-time / Media

| Package | Role |
|---------|------|
| `livekit-server-sdk` (Deno, edge only) | Mint participant JWTs for LiveKit rooms |
| `@livekit/react-native` | **Not yet installed** — next sprint; will replace the BP video viewport placeholder |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| `TypeScript` | Strict mode throughout |
| `dotenv` | Load `.env` into `app.config.js` at build time |
| `npx expo start -c` | Expo Go development server (clear cache flag required after `.env` changes) |
| `supabase CLI` | `supabase start` for local DB, `supabase functions deploy` |
| `npx tsc --noEmit` | Type-check the entire client codebase (supabase/functions excluded via tsconfig) |

---

## Design System (`constants/echo-theme.ts`)

### Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#0A0A0B` | Screen backgrounds |
| `bgElevated` | `#141416` | Cards, input fields |
| `bgCard` | `#1A1A1E` | Modals, sheets |
| `border` | `#232326` | All border lines |
| `text` | `#F4F2EF` | Primary text |
| `textMuted` | `#8B8884` | Labels, subtitles |
| `textDim` | `#6B6966` | Placeholders |
| `accent` | `#E8E6E3` | Primary buttons, active chips |
| `accentWarm` | `#E8B86D` | Type badges, year labels |
| `success` | `#7DCEA0` | Status OK |
| `error` | `#E87D7D` | Errors, destructive actions |
| gradient | `#0A0A0B → #12101A → #1A1520` | Home screen gradient |

### Typography

| Token | Value |
|-------|-------|
| `EchoFonts.serif` | `Georgia` |
| `EchoFonts.sans` | `System` (platform default) |

### Layout tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `screenHorizontal` | `20` | Horizontal screen padding |
| `screenTopExtra` | `8` | Extra top padding after safe area |
| `contentBottomGap` | `24` | Gap above tab bar |
| `fabOffset` | `16` | FAB / PTT button bottom offset |
| `maxContentWidth` | `560` | Max readable width on tablets/web |
| `tabBarBaseHeight` | `56` | Tab bar height before safe area |

---

## Environment Variables

All client-side vars must be prefixed `EXPO_PUBLIC_` to be embedded in the Expo bundle.

```bash
# .env (git-ignored) — copy from .env.example

# Required — Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key   # NOT service_role

# Edge Function secrets — set via: supabase secrets set KEY=value
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
BEYOND_PRESENCE_API_KEY=bp_...
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=secret...
LIVEKIT_URL=wss://your-project.livekit.cloud
```

> Edge Function secrets are **never** shipped to the client. They live only in Supabase's secret vault.
