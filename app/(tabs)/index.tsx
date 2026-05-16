import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BeginSessionButton } from '@/components/home/BeginSessionButton';
import { HomeHeader } from '@/components/home/HomeHeader';
import { InsightGrid } from '@/components/home/InsightGrid';
import { MoodCheckIn } from '@/components/home/MoodCheckIn';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentEntriesPreview } from '@/components/home/RecentEntriesPreview';
import { JournalComposer } from '@/components/journal/JournalComposer';
import { PersonaCard } from '@/components/personas/PersonaCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useHomeInsights } from '@/hooks/useHomeInsights';
import { useJournalCache } from '@/hooks/useJournalCache';
import { usePersona } from '@/hooks/usePersona';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { entries, refresh, addEntry } = useJournalCache();
  const { runSync } = useJournalSyncContext();
  const { personas, selectedPersona, selectPersona } = usePersona();
  const { contentBottom } = useAppInsets({ includeTabBar: true });
  const [composerOpen, setComposerOpen] = useState(false);

  const { journalCount, vaultCount, streakDays, lastSessionLabel } = useHomeInsights(entries);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const name = profile?.display_name?.trim() || 'Friend';

  const handleSave = async (input: {
    title?: string;
    body: string;
    moodTag?: string;
    mediaVaultIds?: string[];
  }) => {
    await addEntry(input);
    await runSync();
    await refresh();
  };

  return (
    <ScreenContainer includeTabBarPadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: contentBottom }]}>
        <HomeHeader displayName={name} />

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

        <View style={styles.divider} />

        <MoodCheckIn />

        <View style={styles.divider} />

        <InsightGrid
          journalCount={journalCount}
          vaultCount={vaultCount}
          streakDays={streakDays}
          lastSessionLabel={lastSessionLabel}
        />

        <QuickActions onNewJournal={() => setComposerOpen(true)} />

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

        <View style={styles.divider} />

        <RecentEntriesPreview entries={entries} />

        <Pressable onPress={() => router.push('/(tabs)/vault')}>
          <GlassCard style={styles.archiveCard}>
            <Text style={styles.archiveTitle}>Your Archive</Text>
            <Text style={styles.archiveSub}>
              {entries.length} journal memories · open The Vault
            </Text>
          </GlassCard>
        </Pressable>
      </ScrollView>

      <JournalComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSave={handleSave}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: EchoColors.border,
    marginBottom: 14,
    marginTop: 4,
  },
  continueCard: {
    padding: 20,
    marginBottom: 16,
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
    marginTop: 8,
  },
  seeAll: {
    color: EchoColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
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
