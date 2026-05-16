import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { HomeHeader } from '@/components/home/HomeHeader';
import { InsightGrid } from '@/components/home/InsightGrid';
import { MoodCheckIn } from '@/components/home/MoodCheckIn';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentEntriesPreview } from '@/components/home/RecentEntriesPreview';
import { JournalComposer } from '@/components/journal/JournalComposer';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useHomeInsights } from '@/hooks/useHomeInsights';
import { useJournalCache } from '@/hooks/useJournalCache';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { entries, refresh, addEntry } = useJournalCache();
  const { runSync } = useJournalSyncContext();
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

        {/* Greeting + live date/time */}
        <HomeHeader displayName={name} />

        <View style={styles.divider} />

        {/* Mood */}
        <MoodCheckIn />

        <View style={styles.divider} />

        {/* Stats */}
        <InsightGrid
          journalCount={journalCount}
          vaultCount={vaultCount}
          streakDays={streakDays}
          lastSessionLabel={lastSessionLabel}
        />

        {/* Actions */}
        <QuickActions onNewJournal={() => setComposerOpen(true)} />

        {/* Recent */}
        <RecentEntriesPreview entries={entries} />
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
  },
});
