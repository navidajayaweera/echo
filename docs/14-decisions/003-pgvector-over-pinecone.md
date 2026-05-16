# Decision 003 - pgvector Over External Vector DB

Date: 2026-05-16  
Owner: Echoes Product + Engineering  
Status: Accepted

## Context

Memory retrieval needs low operational overhead and tight coupling with relational persona data.

## Decision

Use Postgres pgvector within Supabase as primary vector store.

## Consequences

- unified data model and simpler permissions
- fewer moving parts for hackathon speed
- may require scaling strategy adjustments at large volume

## Alternatives Considered

- Pinecone or other external vector store (deferred for future scale needs)
