import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { JournalComposer } from '@/components/journal/JournalComposer';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { JournalSearchBar } from '@/components/journal/JournalSearchBar';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useJournalCache } from '@/hooks/useJournalCache';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';

export default function JournalScreen() {
  const [composerOpen, setComposerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { entries, refresh, addEntry } = useJournalCache();
  const { isSyncing, lastSyncAt, syncError, runSync } = useJournalSyncContext();
  const { contentBottom } = useAppInsets({ includeTabBar: true });

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
    moodTag?: string;
    mediaVaultIds?: string[];
  }) => {
    await addEntry(input);
    await runSync();
    await refresh();
  };

  const subtitle = isSyncing
    ? 'Syncing…'
    : lastSyncAt
      ? `Synced ${new Date(lastSyncAt).toLocaleTimeString()}`
      : 'Your memories, saved safely';

  return (
    <ScreenContainer includeTabBarPadding>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {syncError ? <Text style={styles.error}>{syncError}</Text> : null}

      {/* ── Add button ── */}
      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        onPress={() => setComposerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Remember something new">
        <Text style={styles.addBtnIcon}>✏️</Text>
        <Text style={styles.addBtnLabel}>Remember something…</Text>
        <Text style={styles.addBtnArrow}>+</Text>
      </Pressable>

      <JournalSearchBar value={search} onChangeText={setSearch} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.localId}
        renderItem={({ item }) => <JournalEntryCard entry={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: contentBottom }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>No memories yet</Text>
            <Text style={styles.emptyHint}>
              Tap the button above to write something you want to remember.
            </Text>
          </View>
        }
      />

      <JournalComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSave={handleSave}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: EchoColors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
  error: {
    color: EchoColors.error,
    fontSize: 13,
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: EchoColors.border,
    gap: 12,
  },
  addBtnPressed: {
    opacity: 0.75,
    borderColor: EchoColors.accentWarm,
  },
  addBtnIcon: {
    fontSize: 22,
  },
  addBtnLabel: {
    flex: 1,
    color: EchoColors.textMuted,
    fontSize: 17,
    fontWeight: '400',
  },
  addBtnArrow: {
    color: EchoColors.accent,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  list: {
    paddingTop: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 22,
    fontWeight: '300',
  },
  emptyHint: {
    color: EchoColors.textMuted,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});
