import { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  DEFAULT_PERSONA_TRAITS,
  type PersonaTraits,
  type Profile,
} from '@/lib/types/database';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  updateProfile: (partial: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'persona_traits'>>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const row = await fetchProfile(user.id);
    if (row) {
      setProfile({
        ...row,
        persona_traits: {
          ...DEFAULT_PERSONA_TRAITS,
          ...(row.persona_traits ?? {}),
        },
      });
    }
  }, [user]);

  const updateProfile = useCallback(
    async (
      partial: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'persona_traits'>>
    ) => {
      if (!user) return;

      const { data, error } = await getSupabase()
        .from('profiles')
        .update({
          ...partial,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    },
    [user]
  );

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const supabase = getSupabase();
        const { data: sessionData } = await supabase.auth.getSession();
        let nextSession = sessionData.session;

        if (!nextSession) {
          const { data: anonData, error: anonError } =
            await supabase.auth.signInAnonymously();
          if (anonError) throw anonError;
          nextSession = anonData.session;
        }

        if (!mounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          const row = await fetchProfile(nextSession.user.id);
          if (mounted && row) {
            setProfile({
              ...row,
              persona_traits: {
                ...DEFAULT_PERSONA_TRAITS,
                ...(row.persona_traits ?? {}),
              },
            });
          }
        }
      } catch (err) {
        console.warn('[AuthProvider] init failed:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    if (!isSupabaseConfigured) {
      return () => {
        mounted = false;
      };
    }

    const { data: listener } = getSupabase().auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          const row = await fetchProfile(nextSession.user.id);
          if (row) {
            setProfile({
              ...row,
              persona_traits: {
                ...DEFAULT_PERSONA_TRAITS,
                ...(row.persona_traits ?? {}),
              },
            });
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isConfigured: isSupabaseConfigured,
      updateProfile,
      refreshProfile,
    }),
    [user, session, profile, isLoading, updateProfile, refreshProfile]
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E8E6E3" />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
