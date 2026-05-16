# Echoes Documentation

Echoes is a digital memory-preservation and emotional continuity platform.  
These docs are the source of truth for product intent, architecture, safety boundaries, and implementation direction.

## Product Vision

Echoes helps people preserve identity, memory, personality, and emotional presence so meaningful conversations can continue across time, distance, and memory loss.

This is not a deceptive resurrection product. It is an AI representation grounded in shared memories and explicit transparency.

## Quick Start

1. Install dependencies and set environment variables.
2. Run the Expo app and Supabase stack for local development.
3. Read docs in this order before implementing features:
   1. `docs/00-product/product-vision.md`
   2. `docs/00-product/core-features.md`
   3. `docs/01-architecture/system-overview.md`
   4. Relevant screen and system docs
   5. `docs/14-decisions/` latest decisions

## Documentation Map

- `00-product/` mission, features, language, user flows
- `01-architecture/` system boundaries and technical shape
- `02-database/` schema and RPC contracts
- `03-backend/` edge functions and API behavior
- `04-mobile-app/` navigation and per-screen behavior
- `05-ai-system/` prompts, providers, retrieval
- `06-ui-ux/` design language and interaction principles
- `07-presence-system/` live conversation architecture and avatar UX
- `08-memory-engine/` memory model and ranking strategy
- `09-security-ethics/` safety, disclosure, consent policies
- `10-roadmap/` phases and implementation tracking
- `11-team/` onboarding and contributor workflow
- `12-demo/` scripted demo narrative
- `13-devops/` environments, deployment, and operations
- `14-decisions/` architectural decision records
- `15-prompts/` reusable AI and Cursor workflows

## Architecture Snapshot

```txt
Expo Mobile App
    -> Supabase Auth + Postgres + Storage
    -> Edge Functions (session orchestration, retrieval, safety)
    -> AI Providers (chat, voice, embeddings, avatar)
    -> Presence Runtime (LiveKit + Beyond Presence)
```

## Rules

- Preserve persona-first architecture. Every core flow starts with persona context.
- Never ship changes that weaken transparency, consent, or emotional safety.
- Keep provider integrations abstracted behind backend interfaces.
- Keep offline-first behavior for capture flows (journals, memory drafts).
- Update relevant docs and decision logs after major product/architecture changes.
