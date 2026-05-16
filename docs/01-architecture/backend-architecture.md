# Backend Architecture

## Responsibilities

- Authenticate requests and resolve account ownership.
- Enforce persona-level access controls and sharing rules.
- Normalize memory ingestion and trigger embedding jobs.
- Orchestrate AI sessions with retrieval and safety checks.
- Route requests across model providers behind one interface.

## Edge Function Domains

- **Session orchestration:** starts/ends conversations.
- **Retrieval service:** semantic + relational memory recall.
- **Safety service:** disclosure compliance and risk policies.
- **Provider adapters:** chat, voice, embeddings, avatar.

## Data Services

- Postgres for durable metadata and relational modeling.
- pgvector for nearest-neighbor memory search.
- Storage buckets for media artifacts (photo, voice, video, letters).
- Optional queue/cron for async embedding and cleanup jobs.

## Security Boundaries

- RLS policy per table keyed by owner and sharing roles.
- Service role only in trusted backend contexts.
- Audit logging for persona access and share events.
- Signed URLs and short-lived tokens for private media.

## Performance Principles

- Keep session startup under strict latency targets.
- Precompute embeddings during ingestion.
- Use metadata filters before vector search when possible.
- Cache warm persona context for active sessions.
