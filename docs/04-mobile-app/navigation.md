# Navigation

## Route Tree

```txt
AUTH
├── Login
├── Signup
└── Welcome

MAIN
├── Home
├── Personas
│   ├── Persona Detail
│   ├── Memory Feed
│   ├── Relationships
│   ├── Personality
│   └── Sharing
├── Presence
├── Vault
├── Discover
└── Settings
```

## Rules

- Auth screens are isolated from main tabs.
- Persona selection is globally available from Home, Personas, and Presence entry points.
- Presence cannot start without a selected persona.
- Deep links should support direct open into persona detail and active session.

## Protected Routes

- All MAIN routes require authenticated user.
- Shared persona routes require explicit share access.

## Navigation Priorities

1. Persona-first entry and context persistence.
2. Fast handoff from persona detail to Presence.
3. Minimal friction for memory capture into Vault.
