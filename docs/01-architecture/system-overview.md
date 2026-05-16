# System Overview

## Stack

- **Mobile App:** Expo React Native
- **Backend Platform:** Supabase (Auth, Postgres, Storage, Edge Functions)
- **Realtime Voice:** LiveKit
- **AI Providers:** Gemini, OpenAI, voice and avatar providers
- **Vector Search:** pgvector in Postgres

## Major Systems

1. **Identity Layer** - profiles, authentication, account ownership.
2. **Persona Layer** - persona metadata, traits, sharing, relationships.
3. **Memory Layer** - Vault storage, chunking, embeddings, retrieval index.
4. **Presence Layer** - session orchestration, live chat/voice/avatar runtime.
5. **Safety Layer** - transparency, consent, emotional guardrails.

## High-Level Data Flow

```txt
Mobile App
  -> Supabase Auth
  -> Persona + Vault APIs
  -> Edge Function: start-ai-session
      -> Retrieval Engine (pgvector + metadata)
      -> Safety + policy layer
      -> Model router
      -> Live response stream
```

## Service Boundaries

- Client handles UX, local drafts, and display state only.
- Edge Functions own policy checks, retrieval orchestration, and provider routing.
- Database owns durable memory, relationships, and audit history.
- Providers are replaceable adapters; no provider-specific logic in UI.

## Non-Negotiables

- Persona context is mandatory in session initialization.
- All preserved-identity experiences require clear AI disclosure.
- Memory retrieval must cite source memories internally for traceability.
- Sharing must enforce ownership and permission boundaries.
