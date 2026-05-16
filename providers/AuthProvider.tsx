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

import { EchoColors } from '@/constants/echo-theme';
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
  isAuthenticated: boolean;
  isAnonymous: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  updateProfile: (
    partial: Partial<
      Pick<Profile, 'display_name' | 'avatar_url' | 'persona_traits' | 'bp_avatar_id'>
    >
  ) => Promise<void>;
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

function normalizeProfile(row: Profile): Profile {
  return {
    ...row,
    bp_avatar_id: row.bp_avatar_id ?? null,
    persona_traits: {
      ...DEFAULT_PERSONA_TRAITS,
      ...(row.persona_traits ?? {}),
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const row = await fetchProfile(userId);
    if (row) setProfile(normalizeProfile(row));
    else setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    await loadProfile(user.id);
  }, [user, loadProfile]);

  const updateProfile = useCallback(
    async (
      partial: Partial<
        Pick<Profile, 'display_name' | 'avatar_url' | 'persona_traits' | 'bp_avatar_id'>
      >
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
      setProfile(normalizeProfile(data as Profile));
    },
    [user]
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { data, error } = await getSupabase().auth.signUp({ email, password });
      if (error) throw error;

      if (data.user && displayName?.trim()) {
        await getSupabase()
          .from('profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', data.user.id);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const continueAsGuest = useCallback(async () => {
    const { error } = await getSupabase().auth.signInAnonymously();
    if (error) throw error;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data } = await getSupabase().auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          await loadProfile(data.session.user.id);
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
          await loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isConfigured: isSupabaseConfigured,
      isAuthenticated: !!session,
      isAnonymous: user?.is_anonymous ?? false,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      continueAsGuest,
      updateProfile,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      continueAsGuest,
      updateProfile,
      refreshProfile,
    ]
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={EchoColors.accent} />
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
    backgroundColor: EchoColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
