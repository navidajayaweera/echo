# Memory Retrieval

## Purpose

Deliver emotionally and semantically relevant memories during live conversation while preserving safety and factual grounding.

## Embedding Flow

1. Ingest memory artifact.
2. Normalize text/transcript.
3. Chunk by semantic boundaries.
4. Generate embeddings.
5. Store chunk metadata + vector in `persona_memories`.

## Chunking Strategy

- journal/letters: paragraph-aware chunks
- transcripts/chats: turn-window chunks
- timeline events: event-level atomic chunks
- include source references for traceability

## Retrieval Ranking

Final score combines:
- semantic similarity
- emotional alignment
- temporal relevance
- relationship relevance
- recency fallback boost

## Thresholds

- high confidence: direct memory card recall
- medium confidence: soft recall phrasing
- low confidence: do not present as concrete fact

## Relationship Awareness

Relationship graph influences recall priority when users mention known entities (for example daughter, husband, caregiver).

## Safety Constraints

- uncertain recalls must be qualified
- avoid fabricated details to satisfy emotional tone
- avoid repeated grief-trigger loops
