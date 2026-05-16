# Edge Functions

## `start-ai-session`

Purpose: create a presence session for a selected persona.

Flow:
1. Validate auth and persona access.
2. Build persona context and safety profile.
3. Retrieve relevant memories using semantic query.
4. Select provider route based on mode and latency target.
5. Return session token/config for stream setup.

Dependencies:
- `get_persona_context`
- `match_memories`
- provider adapters
- policy checks

## `stream-presence-response`

Purpose: stream chat/voice response events to client.

Responsibilities:
- inject memory snippets into prompt context
- enforce emotional safety boundaries
- emit incremental response + caption events

## `ingest-memory`

Purpose: normalize captured memory assets into queryable records.

Responsibilities:
- extract text/transcript
- classify memory type and tags
- generate embedding job payload

## `share-persona`

Purpose: grant/revoke persona access under policy constraints.

Responsibilities:
- enforce ownership rules
- write `persona_shares`
- log audit event

## Error Handling Standards

- Return machine-readable error codes.
- Never leak internal provider secrets.
- Surface recoverable guidance to client.
- Log correlation ids for support tracing.
