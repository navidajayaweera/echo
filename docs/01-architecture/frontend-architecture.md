# Frontend Architecture

## App Structure

```txt
auth/
main/
  home/
  personas/
  presence/
  vault/
  discover/
  settings/
```

## Navigation Model

- Auth flow gates unauthenticated users.
- Main tabs prioritize Personas and Presence as primary journeys.
- Persona detail is a nested route with tabs (Overview, Memories, Relationships, Voice, Personality, Presence, Sharing).

## State Management Strategy

- Local UI state for transient interaction.
- Server state via query layer for personas, memories, sessions.
- Session-level ephemeral state for active Presence conversations.
- Offline draft queue for journal/memory capture reliability.

## Design System Principles

- Cinematic dark baseline.
- Soft gradients, ambient glow, calm transitions.
- Memory cards treated as emotional artifacts, not utility rows.
- Accessibility and readable typography remain mandatory.

## Hook Strategy

- `usePersonaContext` centralizes selected persona state.
- `useMemoryFeed` handles Vault fetch and pagination.
- `usePresenceSession` abstracts session start/stop and stream events.
- `useSafetyDisclosure` ensures required disclosures are shown.

## Dependency Rules

- Screens depend on shared hooks, not direct provider clients.
- UI components must be persona-aware where relevant.
- Avoid duplicate retrieval logic in client code.
