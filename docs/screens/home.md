# Home Screen

Route: `app/(tabs)/index.tsx`  
Tab icon: `house.fill`

---

## Purpose

Emotional entry point and session launcher. Shows a personalised greeting, memory statistics, sync health, and the primary CTA to begin an Echo session.

---

## Layout

```
ScreenContainer (gradient bg, safe area, scroll)
  └── ScrollView
       ├── GreetingPanel        "Good evening, Sarah"
       ├── StatsRow             "14 memories · 2 syncing"
       ├── SyncStatusBadge      Supabase ✓  Avatar ○
       └── BeginSessionButton   "Begin Echo Session"
```

---

## Components

### `GreetingPanel`

File: `components/home/GreetingPanel.tsx`

- Derives greeting from current hour:
  - 5–11 → "Good morning"
  - 12–17 → "Good afternoon"
  - 18–21 → "Good evening"
  - else → "Good night"
- Displays `profile.display_name` if available, otherwise "Friend"
- Uses `EchoFonts.serif` at 32px for the name

### `StatsRow`

File: `components/home/StatsRow.tsx`

Props: `{ memoryCount: number, pendingSync: number }`

Displays two stat pills:
- Memories: total journal entry count from local cache
- Pending: count of `pendingSync: true` entries (not yet synced to Supabase)

### `SyncStatusBadge`

File: `components/home/SyncStatusBadge.tsx`

Props: `{ isSyncing: boolean, lastSyncAt: string | null, avatarSynced: boolean }`

Two inline badges:
- **Supabase** — green check (synced), spinner (syncing), amber (not yet synced)
- **Avatar link** — green check if `profile.last_synced_at` is set, amber "○ not linked" otherwise

### `BeginSessionButton`

File: `components/home/BeginSessionButton.tsx`

- Renders a `PrimaryButton` labeled "Begin Echo Session"
- On press: `router.push('/presence')`
- The Presence screen handles provider selection and session initialization

---

## Data sources

| Data | Source |
|------|--------|
| `displayName` | `useAuth().profile.display_name` |
| `entries` | `useJournalCache().entries` (AsyncStorage) |
| `pendingCount` | `entries.filter(e => e.pendingSync).length` |
| `isSyncing`, `lastSyncAt` | `useJournalSyncContext()` |
| `avatarSynced` | `Boolean(profile?.last_synced_at)` |

---

## Focus refresh

The screen calls `useJournalCache().refresh()` on every tab focus via `useFocusEffect`. This ensures the stats row reflects the latest local cache without a full re-mount.
