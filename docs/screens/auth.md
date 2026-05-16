# Auth Screens

Routes: `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`  
Layout: `app/(auth)/_layout.tsx` (fade animation, dark bg)  
Redirect: `app/(auth)/index.tsx` → `/login`

---

## Login screen

### Layout

```
ScreenContainer (gradient bg, top safe area)
  └── ScrollView
       ├── Logo / serif title "echo"
       ├── Subtitle "your memory, your voice"
       ├── EchoTextInput — Email
       ├── EchoTextInput — Password (secureTextEntry)
       ├── PrimaryButton "Sign in" (filled)  [loading state]
       ├── PrimaryButton "Continue as guest" (ghost)
       ├── Separator line
       └── Link to /signup "Create an account"
```

### State

| Variable | Type | Purpose |
|----------|------|---------|
| `email` | `string` | Controlled input |
| `password` | `string` | Controlled input |
| `loading` | `boolean` | Disables buttons + shows spinner |
| `error` | `string \| null` | Inline error message below inputs |

### Flows

**Sign in:**
```
onPress "Sign in"
  → validate email/password non-empty
  → setLoading(true)
  → AuthProvider.signInWithEmail(email, password)
  → On success: RootNavigator detects session → router.replace('/(tabs)')
  → On error: setError(message)
  → setLoading(false)
```

**Continue as guest:**
```
onPress "Continue as guest"
  → AuthProvider.continueAsGuest()
      → supabase.auth.signInAnonymously()
  → RootNavigator → /(tabs) (anonymous session)
```

### Notes
- Anonymous sessions have full DB access via RLS (`auth.uid()` is still set)
- Guest users can convert to full accounts via Supabase `linkIdentity` (not yet in UI)

---

## Signup screen

### Layout

```
ScreenContainer (gradient bg)
  └── ScrollView
       ├── Back button → /login
       ├── Serif title "Create account"
       ├── EchoTextInput — Display name (optional)
       ├── EchoTextInput — Email
       ├── EchoTextInput — Password
       ├── PrimaryButton "Create account" [loading state]
       └── Success message + "Go to login" link (shown after creation)
```

### Flow

```
onPress "Create account"
  → AuthProvider.signUpWithEmail(email, password, displayName?)
      → supabase.auth.signUp({ email, password })
      → On success: INSERT into profiles triggered by handle_new_user()
      → If displayName provided: updateProfile({ display_name })
  → Show success message
  → User taps "Go to login" → router.replace('/login')
```

---

## AuthProvider contract

`providers/AuthProvider.tsx` exposes via `useAuth()`:

```ts
{
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;   // false if .env is missing
  isAuthenticated: boolean;
  isAnonymous: boolean;
  signInWithEmail(email, password): Promise<void>;
  signUpWithEmail(email, password, displayName?): Promise<void>;
  signOut(): Promise<void>;
  continueAsGuest(): Promise<void>;
  updateProfile(partial): Promise<void>;
  refreshProfile(): Promise<void>;
}
```

## RootNavigator redirect logic

```ts
// components/RootNavigator.tsx
useEffect(() => {
  if (isLoading) return;
  const inAuthGroup = segments[0] === '(auth)';
  if (!session && !inAuthGroup) router.replace('/login');
  if (session && inAuthGroup)  router.replace('/(tabs)');
}, [session, isLoading, segments]);
```

## Profile auto-creation trigger

When a new `auth.users` row is inserted, the `handle_new_user` trigger fires:
```sql
INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
```
This ensures every authenticated user always has a `profiles` row with default `persona_traits`.
