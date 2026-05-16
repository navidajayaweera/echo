# Home Screen

Purpose: Emotional dashboard that reconnects users to active personas and meaningful memories.

## Sections

- Continue conversation
- Active personas
- Recent memories
- Mood reflection
- Memory anniversaries
- Today in history
- Emotional insights

## States

- first-time onboarding prompt
- returning user with persona suggestions
- offline mode with cached cards

## Dependencies

- `usePersonaContext`
- `useMemoryFeed`
- session resume endpoint

## Must Not Break

- one-tap path to Presence
- clear disclosure of AI representation
