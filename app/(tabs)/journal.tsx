import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JournalComposer } from '@/components/journal/JournalComposer';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { useJournalCache } from '@/hooks/useJournalCache';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [composerOpen, setComposerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { entries, refresh, addEntry } = useJournalCache();
  const { isSyncing, lastSyncAt, syncError, runSync } = useJournalSyncContext();

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>
          {isSyncing
            ? 'Syncing…'
            : lastSyncAt
              ? `Synced ${new Date(lastSyncAt).toLocaleTimeString()}`
              : 'Offline-first memories'}
        </Text>
        {syncError && <Text style={styles.error}>{syncError}</Text>}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search memories…"
        placeholderTextColor="#6B6966"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.localId}
        renderItem={({ item }) => <JournalEntryCard entry={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No memories yet. Tap + to add one.</Text>
        }
      />

      <Pressable style={styles.fab} onPress={() => setComposerOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <JournalComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    color: '#F4F2EF',
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B6966',
    fontSize: 14,
    marginTop: 4,
  },
  error: {
    color: '#E87D7D',
    fontSize: 13,
    marginTop: 4,
  },
  search: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#141416',
    borderRadius: 10,
    padding: 12,
    color: '#F4F2EF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#232326',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  empty: {
    color: '#6B6966',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8E6E3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#0A0A0B',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
});
