# Settings Screen

Route: `app/(tabs)/settings.tsx`  
Tab icon: `gearshape.fill`

---

## Purpose

Account management and persona configuration. Users set their display name and tune the five personality traits that shape how the AI echo speaks and behaves.

---

## Layout

```
ScreenContainer (gradient bg)
  └── ScrollView
       ├── SectionHeader "Settings" / "Persona & account"
       ├── Account email / "Guest session"
       │
       ├── Block: Profile
       │    └── EchoTextInput — Display name (blur → DB save)
       │
       ├── Block: Persona engine
       │    ├── PersonaSlider "Humor"      0–100
       │    ├── PersonaSlider "Warmth"     0–100
       │    ├── PersonaSlider "Wisdom"     0–100
       │    ├── PersonaSlider "Verbosity"  0–100
       │    └── PersonaSlider "Formality"  0–100
       │
       ├── Block: Connections
       │    └── ConnectionChecklist (Supabase, Journal sync, AI Session)
       │
       └── PrimaryButton "Sign out" (outline, destructive confirm)
```

---

## Persona engine

### Traits

| Trait | Key | Range | Prompt effect |
|-------|-----|-------|---------------|
| Humor | `humor` | 0–100 | Funny ↔ serious |
| Warmth | `warmth` | 0–100 | Caring ↔ reserved |
| Wisdom | `wisdom` | 0–100 | Deep insights ↔ practical |
| Verbosity | `verbosity` | 0–100 | Long answers ↔ concise |
| Formality | `formality` | 0–100 | Formal ↔ casual |

Defaults: `{ humor: 50, warmth: 70, wisdom: 60, verbosity: 40, formality: 30 }`

### Persistence

Slider changes are debounced 500ms then saved to Supabase:
```ts
debounceRef.current = setTimeout(async () => {
  await updateProfile({ persona_traits: next });
}, 500);
```

`updateProfile` calls:
```ts
supabase.from('profiles').update({ persona_traits }).eq('id', user.id)
```

The updated traits are immediately available in `useAuth().profile.persona_traits` and will be used in the next `start-ai-session` call.

---

## Connections checklist

File: `components/settings/ConnectionChecklist.tsx`

| Row | Status logic | Detail |
|-----|-------------|--------|
| Supabase | `isConfigured ? ok : warn` | "Connected" or "Missing .env keys" |
| Journal sync | `syncError ? warn : isSyncing ? pending : ok` | Last sync time or error message |
| AI Session | From `useSessionStore.connectionStatus` | Provider name if connected |

Status indicators: green checkmark (ok), amber spinner (pending), amber warning (warn).

---

## Display name

- Controlled by local state
- Saved on `onEndEditing` (when input loses focus)
- Only saves if the value has changed from the current profile value
- Trimmed; empty string → saves `null`

---

## Sign out

Guarded with `Alert.alert` confirmation:
```ts
Alert.alert('Sign out', 'You will return to the login screen.', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Sign out', style: 'destructive', onPress: signOut },
]);
```

`signOut` calls `supabase.auth.signOut()` → `RootNavigator` detects `session === null` → `router.replace('/login')`.

---

## Key hooks and providers

| Hook | Data provided |
|------|--------------|
| `useAuth()` | `profile`, `user`, `isConfigured`, `isAnonymous`, `updateProfile`, `signOut` |
| `useJournalSyncContext()` | `isSyncing`, `lastSyncAt`, `syncError` |
| `useSessionStore()` | `connectionStatus`, `provider` (active AI provider) |
| `useAppInsets()` | `contentBottom` for scroll padding |

---

## Future improvements

- [ ] Profile photo upload (camera or library → Supabase Storage → `profiles.avatar_url`)
- [ ] Persona preview: "Test echo" button sends a sample message using current traits
- [ ] "Delete account" with cascade (all journals, media, sessions)
- [ ] Export memories as PDF / Markdown
- [ ] Notification preferences (push for sync failures, session reminders)
