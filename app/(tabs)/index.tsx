import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { BeginSessionButton } from '@/components/home/BeginSessionButton';
import { GreetingPanel } from '@/components/home/GreetingPanel';
import { StatsRow } from '@/components/home/StatsRow';
import { SyncStatusBadge } from '@/components/home/SyncStatusBadge';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useJournalCache } from '@/hooks/useJournalCache';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';
import { useAuth } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { entries, refresh } = useJournalCache();
  const { isSyncing, lastSyncAt } = useJournalSyncContext();
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
        <StatsRow memoryCount={entries.length} pendingSync={pendingCount} />
        <SyncStatusBadge
          isSyncing={isSyncing}
          lastSyncAt={lastSyncAt}
          avatarSynced={avatarSynced}
        />
        <BeginSessionButton />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
});
