# Core Features

## Personas

**Purpose:** Multiple preserved identities per user (self, loved one, future self, recovery persona).  
**Status:** Planned as core architecture upgrade.  
**Dependencies:** `profiles`, `personas`, `persona_memories`, `persona_relationships`, permissions.  
**Future:** Family sharing, consent workflows, richer personality controls.

## Presence

**Purpose:** Real-time emotionally grounded conversation experience (text, voice, avatar).  
**Status:** MVP foundation exists; hero experience expanding.  
**Dependencies:** AI session orchestration, retrieval, LiveKit, voice stack, avatar runtime.  
**Future:** Reflection mode, real-time memory overlays, emotional state transitions.

## Memory Vault

**Purpose:** Semantic memory archive with media + narrative context.  
**Status:** Early capture and timeline behavior exists; being refactored as Vault.  
**Dependencies:** Storage, embeddings, metadata schema, indexing pipeline.  
**Future:** Memory rituals, family curation, richer relationship-tagged memory cards.

## Memory Retrieval

**Purpose:** Pull relevant memories into live conversations.  
**Status:** Semantic recall baseline exists.  
**Dependencies:** Embeddings, pgvector, ranking logic, thresholds, recency fallback.  
**Future:** Emotional weighting, relational context boosts, temporal storyline coherence.

## Emotional Safety System

**Purpose:** Guardrails for grief-sensitive and identity-sensitive interactions.  
**Status:** Required system boundary.  
**Dependencies:** prompt safety layer, policy checks, disclosure UX, moderation rules.  
**Future:** clinical mode controls, usage-risk signals, caregiver override policies.

## Persona Sharing

**Purpose:** Controlled sharing of personas with family/friends.  
**Status:** Planned.  
**Dependencies:** access control, invitation flow, policy and consent checks.  
**Future:** role-based permissions, inheritance, audit logs.
