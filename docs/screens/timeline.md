# Timeline Screen

Route: `app/(tabs)/timeline.tsx`  
Tab icon: `clock.fill`

---

## Purpose

A chronological multimedia archive. Users upload photos, letters, videos, and documents linked to a specific memory year. Items are grouped by year and displayed in reverse chronological order.

---

## Layout

```
ScreenContainer (gradient bg)
  └── SectionList
       ├── ListHeader: SectionHeader "Memory vault" + item count
       ├── SectionHeader: Year label (e.g. "1985", serif 32px)
       ├── Items: TimelineItemCard × n
       ├── (repeat per year section)
       └── ListFooter: MediaUploadPicker
```

---

## Data source (`useTimeline`)

File: `hooks/useTimeline.ts`

Queries `media_vault` table, grouped by `memory_year`:

```ts
const { data } = await supabase
  .from('media_vault')
  .select('*')
  .eq('user_id', user.id)
  .order('memory_year', { ascending: false })
  .order('created_at', { ascending: false });
```

After fetching, generates signed URLs (1-hour TTL) for items without a cached `public_url`:
```ts
const { data: signed } = await supabase.storage
  .from('media-vault')
  .createSignedUrl(row.storage_path, 3600);
```

Groups rows into `TimelineSection[]`:
```ts
interface TimelineSection {
  year: number;
  data: MediaVaultRow[];
}
```

---

## Components

### `TimelineItemCard`

File: `components/timeline/TimelineItemCard.tsx`

```
┌──────────────────────────────┐
│ [80×80 thumbnail | icon]    │
│                  PHOTO       │
│                  Summer 1985 │
│                  Italy trip  │
└──────────────────────────────┘
```

- **Photo/video:** renders `expo-image` thumbnail with 200ms fade-in
- **Letter/doc/voice:** renders icon placeholder from `MEDIA_ICON` map
- **Long press** → `Alert.alert` confirm → `deleteMedia(item)`

### `MediaUploadPicker`

File: `components/timeline/MediaUploadPicker.tsx`

A dashed "+ Add memory" trigger that opens a modal bottom sheet:

```
Modal sheet
  ├── Title "Add a memory"
  ├── Year input (numeric, 1900–current year)
  ├── Title input (optional)
  └── Buttons: Cancel | "Choose photo / video"
```

On confirm → `pickAndUpload(year, title)`:
```ts
// 1. launchImageLibraryAsync({ base64: true, mediaTypes: ['images', 'videos'] })
// 2. Decode base64 → Uint8Array
// 3. supabase.storage.from('media-vault').upload('{user_id}/{timestamp}.ext', bytes)
// 4. supabase.from('media_vault').insert({ user_id, media_type, storage_path, memory_year, … })
// 5. refresh() to reload list + generate signed URLs
```

---

## Media types

| Type | Stored as | Upload method |
|------|-----------|---------------|
| `photo` | JPEG/PNG/WEBP/HEIC | `expo-image-picker` |
| `video` | MP4/MOV | `expo-image-picker` |
| `letter` | PDF/TXT | `expo-document-picker` (next sprint) |
| `voice` | MP3/M4A/AAC | Audio recorder (next sprint) |
| `document` | PDF | `expo-document-picker` (next sprint) |

---

## Storage structure

All files are stored in the `media-vault` Supabase Storage bucket under user-scoped paths:

```
media-vault/
└── {user_id}/
     ├── 1716890123456.jpg
     ├── 1716890456789.mp4
     └── 1716891000000.png
```

RLS enforces that users can only access their own `{user_id}/*` folder.

---

## `media_vault` database schema

```sql
CREATE TABLE public.media_vault (
  id            UUID PRIMARY KEY,
  user_id       UUID → profiles
  journal_id    UUID? → journals (optional link)
  media_type    photo | letter | voice | video | document
  storage_path  TEXT        -- Storage object path
  public_url    TEXT        -- Signed URL cache (not persisted long-term)
  title         TEXT
  description   TEXT
  memory_year   INT         -- Timeline grouping key (e.g. 1974, 1985)
  keywords      TEXT[]
  metadata      JSONB       -- { width, height, duration, mime }
  created_at    TIMESTAMPTZ
  updated_at    TIMESTAMPTZ
);
```

---

## Cross-links with other features

- `journal_id` FK allows a media item to be linked to a journal entry (surfaced in memory overlay)
- `memory_year` matches `journals.memory_year` for cross-reference in the Memory Mode pane
- `keywords` enables future full-text / tag-based search alongside journal keyword search

---

## Future improvements

- [ ] `expo-document-picker` for PDFs and text files
- [ ] Audio recorder component for voice memos
- [ ] Full-screen image viewer (push to `/modal` route)
- [ ] Add description field in upload modal
- [ ] Link to journal entry during upload
- [ ] Year scrubber for fast navigation across many years
- [ ] Batch upload (multiple items at once)
