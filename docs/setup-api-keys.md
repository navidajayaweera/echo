# API Keys Setup Guide

Complete step-by-step instructions to connect OpenAI, Google Gemini, and Beyond Presence to your Echoes app.

---

## Overview

All API keys are **secrets held only by the Supabase Edge Functions**. They are never shipped to the mobile app. The mobile app sends your Supabase JWT; the edge function authenticates you and calls the external APIs on your behalf.

```
Mobile App  ──JWT──►  Supabase Edge Function  ──API Key──►  OpenAI / Gemini / Beyond Presence
```

---

## Step 1 — Deploy the Edge Functions

Before setting secrets, deploy the functions so Supabase knows they exist.

```bash
# From the project root
npx supabase login                        # one-time
npx supabase link --project-ref <your-project-ref>   # your project ref from dashboard URL

npx supabase functions deploy start-ai-session
npx supabase functions deploy embed-journal
```

> Your project ref is the part after `supabase.co/dashboard/project/` in the URL, e.g. `abcdefghijklm`.

---

## Step 2 — OpenAI

### 2.1 Get your API key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create a free account
3. Click your profile → **API keys** → **Create new secret key**
4. Name it `echoes-dev`
5. Copy the key — it starts with `sk-proj-...` and is shown **only once**

### 2.2 Add billing (required for API calls)

1. **Settings → Billing → Add payment method**
2. Set a monthly spend limit (e.g. $5) to avoid surprises
3. OpenAI gives ~$5 free credit to new accounts

### 2.3 Set the secret in Supabase

```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-...
```

Verify:
```bash
npx supabase secrets list
# Should show OPENAI_API_KEY  ****
```

### 2.4 Models used

| Feature | Model | Typical cost |
|---------|-------|-------------|
| Chat in Presence (text) | `gpt-4o-mini` | ~$0.15 per 1M input tokens |
| Journal embedding | `text-embedding-3-small` | ~$0.02 per 1M tokens |

### 2.5 Test it

1. Open the app → Presence tab
2. Select **OpenAI** chip
3. Tap **Start chatting**
4. If you see a greeting message → it's working ✅
5. If you see `"OPENAI_API_KEY is not set"` → re-run step 2.3 and redeploy

---

## Step 3 — Google Gemini

### 3.1 Get your API key

1. Go to [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Sign in with a Google account
3. Click **Create API key** → select a Google Cloud project (create one if needed)
4. Copy the key — it starts with `AIzaSy...`

> Gemini 1.5 Flash is free up to 15 requests per minute on the free tier. No billing required to start.

### 3.2 Set the secret

```bash
npx supabase secrets set GEMINI_API_KEY=AIzaSy...
```

### 3.3 Test it

1. Presence tab → select **Gemini** → **Start chatting**
2. Greeting message confirms it's working ✅

---

## Step 4 — Beyond Presence

### 4.1 What Beyond Presence provides

Beyond Presence creates a hyper-realistic AI avatar that speaks in real-time via WebRTC (LiveKit). Your users see and hear the avatar; it responds using the memory-grounded system prompt built from their journals.

### 4.2 Get your API key

1. Go to [beyondpresence.ai](https://beyondpresence.ai)
2. Request beta access / sign up for an account
3. Navigate to **Dashboard → API Keys → New Key**
4. Copy the key — it starts with `bp_...`

### 4.3 Set up LiveKit Cloud

Beyond Presence uses [LiveKit Cloud](https://cloud.livekit.io) for WebRTC infrastructure.

1. Go to [cloud.livekit.io](https://cloud.livekit.io)
2. Sign up for a free account
3. **Create a new project** (e.g. `echoes`)
4. Navigate to **Settings → API Keys**
5. Copy:
   - **API Key** — starts with `API...`
   - **API Secret** — long random string
6. Copy the **WebSocket URL** — looks like `wss://your-project.livekit.cloud`

### 4.4 Set all secrets

```bash
npx supabase secrets set BEYOND_PRESENCE_API_KEY=bp_...
npx supabase secrets set LIVEKIT_API_KEY=APIxxxxx
npx supabase secrets set LIVEKIT_API_SECRET=your-secret-here
npx supabase secrets set LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 4.5 Install the LiveKit React Native SDK

```bash
npx expo install @livekit/react-native
```

> After installing, follow [LiveKit React Native setup](https://docs.livekit.io/client-sdk-react-native/) for iOS/Android native module linking. In Expo managed workflow you will need a **development build** (`npx expo prebuild`), as LiveKit requires native modules not available in Expo Go.

### 4.6 Test the connection (without LiveKit wired)

1. Presence tab → select **Beyond Presence**
2. Tap **Start avatar session**
3. You should see the viewport with `Room · echo-xxxxxx` — this means:
   - The BP session was created ✅
   - A LiveKit JWT was minted ✅
   - Room name is ready for LiveKit connection ✅
4. The video won't appear until `@livekit/react-native` is wired in `presence.tsx`

---

## Step 5 — Supabase (required for everything)

Everything routes through Supabase. If this isn't configured the app won't load.

### 5.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `echoes`), database password, and region closest to you

### 5.2 Copy your keys

Dashboard → **Settings → API**:

| Key | Where to use |
|-----|-------------|
| **Project URL** | `.env` → `EXPO_PUBLIC_SUPABASE_URL` |
| **anon / public** key | `.env` → `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

⚠️ **Never use the `service_role` key** in the app. It bypasses RLS and has full DB access.

### 5.3 Update your `.env` file

```bash
# .env (copy from .env.example)
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 5.4 Run migrations

Apply all 7 migration files from `supabase/migrations/` in order.

**Option A — Supabase Dashboard SQL Editor** (easiest):
1. Go to **SQL Editor** in your Supabase dashboard
2. Paste and run each file in order: `001` → `002` → `003` → `004` → `005` → `006` → `007`

**Option B — Supabase CLI**:
```bash
npx supabase db push
```

### 5.5 Enable pgvector

Migration `004` requires the `vector` extension. Enable it in your project:

1. Dashboard → **Database → Extensions**
2. Search for `vector` → toggle **Enable**
3. Then run migration `004` and onwards

### 5.6 Restart the app

After editing `.env`, always restart Expo with cache cleared:
```bash
npx expo start -c
```

---

## Step 6 — Verify everything

Run the app and go to **Settings → Connections**. You should see:

| Item | Expected |
|------|---------|
| Supabase | ✅ Connected |
| Journal sync | ✅ Ready |
| AI Session | `Not started` (idle) |

Then go to Presence and start a session. After connecting:

| Item | Expected |
|------|---------|
| AI Session | ✅ OpenAI · active |

---

## Quick reference — all secrets

```bash
# Mobile app .env (client-side, safe to embed)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase Edge Function secrets (server-side only, never in .env)
npx supabase secrets set OPENAI_API_KEY=sk-proj-...
npx supabase secrets set GEMINI_API_KEY=AIzaSy...
npx supabase secrets set BEYOND_PRESENCE_API_KEY=bp_...
npx supabase secrets set LIVEKIT_API_KEY=APIxxxxx
npx supabase secrets set LIVEKIT_API_SECRET=xxxxxxxx
npx supabase secrets set LIVEKIT_URL=wss://xxx.livekit.cloud
```

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `supabaseUrl is required` | `.env` not loaded | Run `npx expo start -c` |
| `Not authenticated` | No Supabase session | Sign in or continue as guest first |
| `OPENAI_API_KEY is not set` | Secret not set | `supabase secrets set OPENAI_API_KEY=...` |
| `OpenAI error 429` | Rate limit / no billing | Add payment method at platform.openai.com |
| `OpenAI error 401` | Invalid key | Re-copy from platform.openai.com dashboard |
| `Gemini error 400` | Invalid request | Check Gemini API key is from aistudio.google.com |
| `Beyond Presence error 401` | Invalid BP key | Re-copy from beyondpresence.ai dashboard |
| `Missing LIVEKIT_* secrets` | LiveKit not configured | Set all 3 LiveKit secrets |
| `Supabase function not found` | Not deployed | Run `supabase functions deploy start-ai-session` |
