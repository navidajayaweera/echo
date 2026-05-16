import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { JournalComposer } from '@/components/journal/JournalComposer';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { JournalSearchBar } from '@/components/journal/JournalSearchBar';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EchoColors } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useJournalCache } from '@/hooks/useJournalCache';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';

export default function JournalScreen() {
  const [composerOpen, setComposerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { entries, refresh, addEntry } = useJournalCache();
  const { isSyncing, lastSyncAt, syncError, runSync } = useJournalSyncContext();
  const { contentBottom, fabBottom, horizontal, right } = useAppInsets({ includeTabBar: true });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.body.toLowerCase().includes(q) ||
        e.title?.toLowerCase().includes(q) ||
        e.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const handleSave = async (input: {
    title?: string;
    body: string;
    memoryYear?: number;
  }) => {
    await addEntry(input);
    await runSync();
    await refresh();
  };

  const subtitle = isSyncing
    ? 'Syncing…'
    : lastSyncAt
      ? `Synced ${new Date(lastSyncAt).toLocaleTimeString()}`
      : 'Offline-first · syncs to cloud';

  return (
    <ScreenContainer includeTabBarPadding>
      <SectionHeader title="Journal" subtitle={subtitle} />
      {syncError ? <Text style={styles.error}>{syncError}</Text> : null}

      <JournalSearchBar value={search} onChangeText={setSearch} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.localId}
        renderItem={({ item }) => <JournalEntryCard entry={item} />}
        contentContainerStyle={{ paddingBottom: contentBottom }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No memories yet. Tap + to preserve one.</Text>
        }
      />

      <Pressable
        style={[styles.fab, { bottom: fabBottom, right: horizontal + right }]}
        onPress={() => setComposerOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <JournalComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSave={handleSave}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: {
    color: EchoColors.error,
    fontSize: 13,
    marginBottom: 8,
  },
  empty: {
    color: EchoColors.textDim,
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: EchoColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: EchoColors.bg,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
});
