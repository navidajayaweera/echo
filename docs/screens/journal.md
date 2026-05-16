# Journal Screen

Route: `app/(tabs)/journal.tsx`  
Tab icon: `book.fill`

---

## Purpose

Offline-first legacy text capture. Users write journal entries here — recording memories, stories, and moments. Entries sync to Supabase in the background and are later vectorized for the AI recall system.

---

## Layout

```
ScreenContainer (gradient bg)
  ├── SectionHeader "Memories" / subtitle with count
  ├── JournalSearchBar
  ├── FlatList
  │    └── JournalEntryCard × n
  └── FAB (+ button, bottom right, above tab bar)

  JournalComposer (Modal, rendered when composerVisible = true)
```

---

## State

| Variable | Source | Purpose |
|----------|--------|---------|
| `entries` | `useJournalCache()` | Full local list |
| `query` | local `useState` | Search filter string |
| `composerVisible` | local `useState` | Toggle composer modal |
| `isSyncing`, `lastSyncAt` | `useJournalSyncContext()` | Sync status for subtitle |

### Filtered list

```ts
const filtered = query.trim()
  ? entries.filter(e =>
      (e.title ?? '').toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q)
    )
  : entries;
```

---

## Components

### `JournalSearchBar`

File: `components/journal/JournalSearchBar.tsx`

- Controlled input, no debounce (client-side filter is instant)
- Clear button appears when `query.length > 0`

### `JournalEntryCard`

File: `components/journal/JournalEntryCard.tsx`

Displays:
- Title (if set) in serif font
- Body preview (2 lines)
- Relative date ("3 days ago")
- Mood tag badge (if set)
- Amber dot if `pendingSync: true`

### `JournalComposer`

File: `components/journal/JournalComposer.tsx`

Modal bottom sheet with:
- Title input (optional)
- Body input (multi-line, required)
- Mood tag picker (emoji quick-select)
- Memory year input (optional, numeric)
- Keywords input (comma-separated)
- Submit button

On submit:
```ts
await useJournalCache().addEntry({
  title, body, moodTag, memoryYear, keywords
});
// Entry appears immediately in list (pendingSync: true)
// JournalSyncProvider syncs in background
```

---

## Offline-first data model

```ts
interface JournalCacheEntry {
  localId: string;        // client UUID (nanoid)
  title?: string;
  body: string;
  keywords?: string[];
  memoryYear?: number;
  pendingSync: boolean;   // true until Supabase upsert succeeds
  remoteId?: string;      // set after first successful sync
  createdAt: string;      // ISO timestamp
  updatedAt: string;
}
```

Stored in AsyncStorage under key `@echo/journals`.

---

## Sync pipeline

```
useJournalCache.addEntry(entry)
  → lib/journal-storage.upsertJournalEntry(entry with pendingSync: true)

JournalSyncProvider (background)
  → lib/journal-sync.syncPendingJournals(userId)
      → filter entries where pendingSync === true
      → for each: supabase.from('journals').upsert({ local_id, body, … })
      → on success: upsertJournalEntry({ ...entry, pendingSync: false, remoteId })

Network reconnect / app foreground
  → useJournalSync triggers syncPendingJournals again
```

---

## Future improvements

- [ ] Swipe-to-delete on cards
- [ ] Full-text server search (PostgreSQL `tsquery`)
- [ ] Auto-trigger `embed-journal` after successful sync
- [ ] Voice memo recording linked to journal entry
- [ ] Attach a `media_vault` item to a journal entry
