# Echoes — Documentation Index

> AI memory avatar platform powered by Expo, Supabase, Beyond Presence, and LiveKit.

This `docs/` folder is the single source of truth for every human and AI agent working on the project. All files reflect the **live codebase** — not aspirational plans.

---

## Quick links

| Document | What it covers |
|----------|---------------|
| [tech-stack.md](./tech-stack.md) | All packages, versions, runtime environments |
| [architecture.md](./architecture.md) | System diagram, data flows, provider registry |
| [implementation-status.md](./implementation-status.md) | What is built, what is in progress, what is next |
| [api-routes.md](./api-routes.md) | Supabase Edge Functions — endpoints, auth, request/response shapes |
| [memory-lanes.md](./memory-lanes.md) | The full memory pipeline: ingestion → embedding → RAG → overlay |
| [screens/auth.md](./screens/auth.md) | Login + Sign-up flows |
| [screens/home.md](./screens/home.md) | Home tab |
| [screens/journal.md](./screens/journal.md) | Journal tab — offline-first CRUD + sync |
| [screens/presence.md](./screens/presence.md) | Presence (HERO) tab — AI session, PTT, memory overlay |
| [screens/timeline.md](./screens/timeline.md) | Timeline tab — media vault |
| [screens/settings.md](./screens/settings.md) | Settings tab — persona engine, connections |

---

## Project in one paragraph

Echoes lets users capture memories as journal entries and multimedia uploads. A Supabase backend indexes those memories as vector embeddings. When users open the **Presence** tab they can converse with an AI echo of a person via text chat (OpenAI / Gemini) or a hyper-realistic live avatar via Beyond Presence + LiveKit WebRTC. The avatar's responses are grounded in the user's stored memories through a RAG (Retrieval-Augmented Generation) pipeline. A Memory Mode overlay slides in during sessions to surface the specific memory being referenced.

The expected Supabase project for this app is **echo**; configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from that project.

---

## Repository root structure

```
echo/
├── app/                      Expo Router screens
│   ├── _layout.tsx           Root — providers + RootNavigator
│   ├── modal.tsx             Detached modal (memory detail)
│   ├── (auth)/               Login + Signup
│   └── (tabs)/               5-tab main app
├── components/               Shared UI components
│   ├── home/
│   ├── journal/
│   ├── presence/
│   ├── timeline/
│   ├── settings/
│   └── ui/                   Primitives (buttons, inputs, container)
├── constants/
│   ├── echo-theme.ts         Color palette, fonts, spacing, layout tokens
│   └── persona.ts            Persona trait label definitions
├── hooks/                    Custom React hooks
├── lib/                      Non-UI logic + Supabase client
│   └── types/                TypeScript interfaces
├── providers/                React context providers
│   ├── AuthProvider.tsx
│   └── JournalSyncProvider.tsx
├── stores/                   Zustand global stores
│   ├── memory-overlay.store.ts
│   └── session.store.ts
├── supabase/
│   ├── config.toml           Local dev configuration
│   ├── migrations/           Ordered SQL migration files (001–008)
│   └── functions/            Deno Edge Functions
│       ├── start-ai-session/
│       ├── embed-journal/
│       └── _shared/
├── docs/                     ← you are here
├── .env                      Local secrets (git-ignored)
├── .env.example              Template for required environment variables
└── PLAN.md                   Original hackathon architectural blueprint
```
