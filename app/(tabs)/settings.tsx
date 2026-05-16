import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConnectionChecklist } from '@/components/settings/ConnectionChecklist';
import { PersonaSlider } from '@/components/settings/PersonaSlider';
import { EchoTextInput } from '@/components/ui/EchoTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PERSONA_TRAIT_LABELS } from '@/constants/persona';
import { EchoColors } from '@/constants/echo-theme';
import { DEFAULT_PERSONA_TRAITS, type PersonaTraits } from '@/lib/types/database';
import { AI_PROVIDER_LABELS } from '@/lib/types/ai-session';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useSessionStore } from '@/stores/session.store';

export default function SettingsScreen() {
  const {
    profile,
    isConfigured,
    isAnonymous,
    user,
    updateProfile,
    signOut,
  } = useAuth();
  const { isSyncing, lastSyncAt, syncError } = useJournalSyncContext();
  const { connectionStatus, provider: activeProvider } = useSessionStore();
  const { contentBottom } = useAppInsets({ includeTabBar: true });

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [traits, setTraits] = useState<PersonaTraits>(
    profile?.persona_traits ?? DEFAULT_PERSONA_TRAITS
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setTraits({ ...DEFAULT_PERSONA_TRAITS, ...profile.persona_traits });
    }
  }, [profile]);

  const persistTraits = useCallback(
    (next: PersonaTraits) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await updateProfile({ persona_traits: next });
        } catch (err) {
          console.warn('[settings] persona sync failed:', err);
        }
      }, 500);
    },
    [updateProfile]
  );

  const handleTraitChange = (key: keyof PersonaTraits, value: number) => {
    const next = { ...traits, [key]: value };
    setTraits(next);
    persistTraits(next);
  };

  const handleDisplayNameBlur = async () => {
    if (!profile || displayName === (profile.display_name ?? '')) return;
    try {
      await updateProfile({ display_name: displayName.trim() || null });
    } catch (err) {
      console.warn('[settings] display name sync failed:', err);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You will return to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Sign out failed');
          }
        },
      },
    ]);
  };

  const aiStatusMap: Record<string, 'ok' | 'pending' | 'warn'> = {
    idle: 'pending',
    connecting: 'pending',
    connected: 'ok',
    reconnecting: 'pending',
    disconnected: 'warn',
    error: 'warn',
  };

  const checklist = [
    {
      label: 'Supabase',
      status: isConfigured ? ('ok' as const) : ('warn' as const),
      detail: isConfigured ? 'Connected' : 'Missing .env keys',
    },
    {
      label: 'Journal sync',
      status: syncError ? ('warn' as const) : isSyncing ? ('pending' as const) : ('ok' as const),
      detail: syncError ?? (lastSyncAt ? `OK · ${new Date(lastSyncAt).toLocaleTimeString()}` : 'Ready'),
    },
    {
      label: 'AI Session',
      status: (aiStatusMap[connectionStatus] ?? 'pending') as 'ok' | 'pending' | 'warn',
      detail: connectionStatus === 'connected' && activeProvider
        ? `${AI_PROVIDER_LABELS[activeProvider]} · active`
        : connectionStatus === 'idle'
          ? 'Not started'
          : connectionStatus,
    },
  ];

  return (
    <ScreenContainer includeTabBarPadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentBottom }}>
        <SectionHeader title="Settings" subtitle="Persona & account" />

        <Text style={styles.accountEmail}>{user?.email ?? (isAnonymous ? 'Guest session' : '')}</Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Profile</Text>
          <EchoTextInput
            placeholder="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            onEndEditing={handleDisplayNameBlur}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Persona engine</Text>
          {PERSONA_TRAIT_LABELS.map(({ key, label }) => (
            <PersonaSlider
              key={key}
              label={label}
              value={traits[key]}
              onChange={(v) => handleTraitChange(key, v)}
            />
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Connections</Text>
          <ConnectionChecklist items={checklist} />
        </View>

        <PrimaryButton label="Sign out" onPress={handleSignOut} variant="outline" />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  accountEmail: {
    color: EchoColors.textDim,
    fontSize: 14,
    marginBottom: 20,
  },
  block: {
    marginBottom: 28,
  },
  blockTitle: {
    color: EchoColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
});
