# Database Schema

## profiles

Purpose: Stores account owner identity.

| name | type | purpose |
| --- | --- | --- |
| id | uuid | references auth user |
| display_name | text | user-facing name |
| avatar_url | text | profile image |
| created_at | timestamptz | creation time |

Rules:
- One profile per authenticated account.

## personas

Purpose: Stores preserved identities.

| name | type | purpose |
| --- | --- | --- |
| id | uuid | persona id |
| owner_id | uuid | profile owner |
| name | text | display name |
| relationship | text | mother, self, friend |
| description | text | context and boundaries |
| avatar_url | text | persona image |
| visibility | text | private/shared/public |
| voice_style | text | voice direction |
| speaking_patterns | jsonb | behavioral tuning |
| ethical_mode | text | safety profile |
| created_at | timestamptz | creation time |

Rules:
- `owner_id` required.
- default `visibility = private`.

## persona_memories

Purpose: Memory fragments attached to personas.

| name | type | purpose |
| --- | --- | --- |
| id | uuid | memory id |
| persona_id | uuid | linked persona |
| owner_id | uuid | ownership |
| memory_type | text | journal, photo, voice, etc |
| title | text | short label |
| content | text | normalized text body |
| media_url | text | optional file reference |
| emotional_tone | text | calm, joyful, grief, etc |
| event_date | date | historical date |
| metadata | jsonb | tags, source data |
| embedding | vector | semantic search vector |
| created_at | timestamptz | ingestion time |

Rules:
- memory must belong to owner via persona.
- embedding optional until indexing finishes.

## persona_relationships

Purpose: Relationship graph for conversational realism and identity continuity.

| name | type | purpose |
| --- | --- | --- |
| id | uuid | relationship id |
| persona_id | uuid | context persona |
| related_name | text | person/entity name |
| relation_type | text | daughter, spouse, friend |
| emotional_weight | numeric | relevance weighting |
| notes | text | supporting memory context |
| created_at | timestamptz | creation time |

Rules:
- scoped to persona.
- editable by owner and authorized share roles only.

## persona_shares

Purpose: Access control for shared personas.

| name | type | purpose |
| --- | --- | --- |
| id | uuid | share record |
| persona_id | uuid | target persona |
| owner_id | uuid | sharing owner |
| grantee_id | uuid | invited user |
| role | text | viewer, contributor, manager |
| created_at | timestamptz | creation time |

Rules:
- owner cannot remove last manager role for self.
- all share actions audited.
