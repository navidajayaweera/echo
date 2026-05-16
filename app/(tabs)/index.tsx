import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BeginSessionButton } from '@/components/home/BeginSessionButton';
import { GreetingPanel } from '@/components/home/GreetingPanel';
import { StatsRow } from '@/components/home/StatsRow';
import { SyncStatusBadge } from '@/components/home/SyncStatusBadge';
import { PersonaCard } from '@/components/personas/PersonaCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useJournalCache } from '@/hooks/useJournalCache';
import { usePersona } from '@/hooks/usePersona';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { entries, refresh } = useJournalCache();
  const { isSyncing, lastSyncAt } = useJournalSyncContext();
  const { personas, selectedPersona, selectPersona } = usePersona();
  const { contentBottom } = useAppInsets({ includeTabBar: true });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const name = profile?.display_name?.trim() || 'Friend';
  const pendingCount = entries.filter((e) => e.pendingSync).length;
  const avatarSynced = Boolean(profile?.last_synced_at);

  return (
    <ScreenContainer includeTabBarPadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: contentBottom }]}>
        <GreetingPanel displayName={name} />

        {selectedPersona ? (
          <GlassCard style={styles.continueCard} glow>
            <Text style={styles.continueLabel}>Continue conversation</Text>
            <Text style={styles.continueTitle}>with {selectedPersona.name}</Text>
            <Text style={styles.continueSub}>
              Your memories keep {selectedPersona.relationship === 'Self' ? 'your' : 'their'} presence alive.
            </Text>
            <BeginSessionButton />
          </GlassCard>
        ) : (
          <BeginSessionButton />
        )}

        <Text style={styles.sectionTitle}>Active personas</Text>
        {personas.slice(0, 3).map((p) => (
          <PersonaCard
            key={p.id}
            persona={p}
            selected={p.id === selectedPersona?.id}
            onPress={async () => {
              await selectPersona(p.id);
              router.push(`/persona/${p.id}`);
            }}
          />
        ))}
        <Pressable onPress={() => router.push('/(tabs)/personas')}>
          <Text style={styles.seeAll}>See all personas →</Text>
        </Pressable>

        <StatsRow memoryCount={entries.length} pendingSync={pendingCount} />
        <SyncStatusBadge
          isSyncing={isSyncing}
          lastSyncAt={lastSyncAt}
          avatarSynced={avatarSynced}
        />

        <Pressable onPress={() => router.push('/(tabs)/vault')}>
          <GlassCard style={styles.archiveCard}>
            <Text style={styles.archiveTitle}>Your Archive</Text>
            <Text style={styles.archiveSub}>
              {entries.length} journal memories · open The Vault
            </Text>
          </GlassCard>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  continueCard: {
    padding: 20,
    marginBottom: 24,
    gap: 8,
  },
  continueLabel: {
    color: EchoColors.tertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  continueTitle: {
    fontFamily: EchoFonts.serif,
    fontSize: 26,
    color: EchoColors.text,
  },
  continueSub: {
    color: EchoColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: EchoFonts.serif,
    fontSize: 22,
    color: EchoColors.text,
    marginBottom: 12,
  },
  seeAll: {
    color: EchoColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
    marginTop: -4,
  },
  archiveCard: {
    padding: 16,
    marginTop: 8,
  },
  archiveTitle: {
    fontFamily: EchoFonts.serif,
    fontSize: 20,
    color: EchoColors.text,
  },
  archiveSub: {
    color: EchoColors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
});
