# Presence Screen

Purpose: Hero face-to-face conversation experience with memory-preserved personas.

## Modes

- Text Chat
- Voice Chat
- Avatar Presence
- Memory Recall Mode
- Reflection Mode

## UI Structure

- avatar stage
- recalled memory card strip
- live captions
- mic and mode controls

## States

- idle
- connecting
- active
- reconnecting
- error

## Dependencies

- `usePresenceSession`
- LiveKit runtime
- avatar provider
- memory retrieval stream events

## Must Not Break

- session starts only with selected persona
- transparency statement at session entry
- graceful fallback from avatar to voice/text
