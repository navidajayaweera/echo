# User Flows

## Persona Creation Flow

1. User opens Personas tab and taps **Create Persona**.
2. User selects persona type: Self, Loved One, Future Self, Recovery, Custom.
3. User enters profile context: name, relationship, description, voice style.
4. User uploads initial memories (journal, photo, voice, letter, chat).
5. System stores files and metadata in Vault.
6. Embedding + indexing pipeline runs.
7. Persona becomes available for Presence sessions.

## Presence Session Flow

1. User selects persona from Personas or Home.
2. User opens Presence and chooses mode (Text, Voice, Avatar).
3. Session starts with disclosure and safety framing.
4. AI receives persona profile, relationship graph, memory context, policy constraints.
5. During conversation, retrieval system injects memory cards when relevant.
6. User can save highlights back to Vault as new memories.
7. Session ends with optional reflection and mood check-in.

## Memory Capture Flow

1. User opens Vault and chooses capture type.
2. User uploads artifact and tags persona(s), people, date, emotional tone.
3. System stores media + transcript/extracted text.
4. Memory chunking and embedding pipeline executes.
5. Memory becomes queryable and appears in timeline.

## Dementia Support Flow

1. Caregiver/user sets up a Recovery Persona with routines and relationships.
2. Daily updates are captured in simplified journaling prompts.
3. Presence mode uses structured recall with calm style and identity reinforcement.
4. Assistant offers relationship reminders and contextual grounding.
5. Caregiver can review logs and adjust safety settings.

## Family Sharing Flow

1. Owner enables persona sharing and selects access level.
2. Invitees receive secure link and accept terms.
3. Shared users can interact within defined permissions.
4. All shared actions are logged for ownership transparency.
