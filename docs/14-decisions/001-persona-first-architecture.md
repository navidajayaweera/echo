# Decision 001 - Persona-First Architecture

Date: 2026-05-16  
Owner: Echoes Product + Engineering  
Status: Accepted

## Context

The prior architecture was journal-first and treated identity as single-profile context. This limited emotional continuity and made Presence less grounded.

## Decision

Adopt multi-persona architecture as the core system model. All major user flows begin with a selected persona.

## Consequences

- clearer product differentiation
- schema and navigation migration required
- better fit for loved-one, legacy, and dementia scenarios

## Alternatives Considered

- keep single persona per user (rejected: insufficient for core mission)
