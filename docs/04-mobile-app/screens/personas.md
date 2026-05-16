# Personas Screen

Purpose: Primary identity management surface for preserved personas.

## Persona Card

Shows:
- avatar
- name
- relationship
- memory count
- emotional profile
- sharing status

## Persona Detail Tabs

- Overview
- Memories
- Relationships
- Voice
- Personality
- Presence
- Shared Access

## States

- empty state with guided creation
- loading and sync indicators
- shared persona badge states

## Dependencies

- persona CRUD APIs
- share permission APIs
- memory count query

## Known Risks

- permission confusion in shared personas
- inconsistent relationship labels without glossary enforcement
