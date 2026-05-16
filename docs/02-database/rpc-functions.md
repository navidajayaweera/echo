# RPC Functions

## `match_memories(persona_id, query_embedding, limit, filters)`

Purpose: semantic recall of memory fragments for live conversation.

Inputs:
- `persona_id` uuid
- `query_embedding` vector
- `limit` int
- `filters` jsonb (types, date ranges, emotional_tone)

Outputs:
- memory id
- similarity score
- memory metadata
- optional emotional weighting score

Strategy:
- constrain to persona and caller permissions
- apply metadata filters first
- run vector distance match
- rerank with recency + emotional relevance + relationship boosts

Performance notes:
- IVFFlat index on embedding column.
- keep vector dimensions consistent by provider.
- enforce max limit to protect latency.

## `get_persona_context(persona_id)`

Purpose: compile lightweight runtime persona context for session bootstrap.

Includes:
- persona profile
- safety mode
- key speaking patterns
- top relationship graph nodes

## `log_presence_event(session_id, event_type, payload)`

Purpose: persist auditable session events and memory recalls.

Use:
- retrieval traceability
- debugging and quality analysis
- safety monitoring
