import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { JournalComposer } from '@/components/journal/JournalComposer';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { JournalSearchBar } from '@/components/journal/JournalSearchBar';
import { TimelineItemCard } from '@/components/timeline/TimelineItemCard';
import { MediaUploadWizard } from '@/components/timeline/MediaUploadWizard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useJournalCache } from '@/hooks/useJournalCache';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';
import { useTimeline } from '@/hooks/useTimeline';
import type { MediaVaultRow } from '@/lib/types/media-vault';

type VaultTab = 'memories' | 'journal';

const CATEGORIES = [
  { id: 'photos', label: 'Photos', icon: '📷' },
  { id: 'videos', label: 'Videos', icon: '🎬' },
  { id: 'voice', label: 'Voice', icon: '🎙' },
  { id: 'journals', label: 'Journals', icon: '📓' },
  { id: 'letters', label: 'Letters', icon: '✉️' },
  { id: 'milestones', label: 'Milestones', icon: '⭐' },
];

export default function VaultScreen() {
  const [tab, setTab] = useState<VaultTab>('memories');
  const [composerOpen, setComposerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { entries, refresh, addEntry } = useJournalCache();
  const { isSyncing, lastSyncAt, syncError, runSync } = useJournalSyncContext();
  const { sections, isLoading, isUploading, error, uploadMedia, deleteMedia } = useTimeline();
  const { contentBottom, fabBottom, horizontal, right } = useAppInsets({ includeTabBar: true });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredJournal = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.body.toLowerCase().includes(q) ||
        e.title?.toLowerCase().includes(q) ||
        e.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const handleSaveJournal = async (input: {
    title?: string;
    body: string;
    memoryYear?: number;
  }) => {
    await addEntry(input);
    await runSync();
    await refresh();
  };

  return (
    <ScreenContainer includeTabBarPadding>
      <Text style={styles.title}>The Vault</Text>
      <Text style={styles.subtitle}>Your living archive of memory</Text>

      <View style={styles.tabRow}>
        {(['memories', 'journal'] as VaultTab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'memories' ? 'Media' : 'Journal'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'memories' ? (
        <>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(c) => c.id}
            showsHorizontalScrollIndicator={false}
            style={styles.categories}
            renderItem={({ item }) => (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text style={styles.categoryLabel}>{item.label}</Text>
              </View>
            )}
          />
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: contentBottom }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              error ? <Text style={styles.error}>{error}</Text> : null
            }
            renderSectionHeader={({ section: { year } }) => (
              <Text style={styles.yearLabel}>{year}</Text>
            )}
            renderItem={({ item }: { item: MediaVaultRow }) => (
              <TimelineItemCard item={item} onDelete={deleteMedia} />
            )}
            ListFooterComponent={
              <MediaUploadWizard isUploading={isUploading} onUpload={uploadMedia} />
            }
            ListEmptyComponent={
              !isLoading ? (
                <Text style={styles.empty}>No media yet — upload photos or videos below.</Text>
              ) : null
            }
          />
        </>
      ) : (
        <>
          <JournalSearchBar value={search} onChangeText={setSearch} />
          {syncError ? <Text style={styles.error}>{syncError}</Text> : null}
          <Text style={styles.syncHint}>
            {isSyncing
              ? 'Syncing…'
              : lastSyncAt
                ? `Synced ${new Date(lastSyncAt).toLocaleTimeString()}`
                : 'Offline-first · syncs to cloud'}
          </Text>
          <FlatList
            data={filteredJournal}
            keyExtractor={(item) => item.localId}
            renderItem={({ item }) => <JournalEntryCard entry={item} />}
            contentContainerStyle={{ paddingBottom: contentBottom }}
            ListEmptyComponent={
              <Text style={styles.empty}>No journal memories yet. Tap + to add one.</Text>
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
            onSave={handleSaveJournal}
          />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: EchoFonts.serif,
    fontSize: 32,
    color: EchoColors.text,
    marginTop: 8,
  },
  subtitle: {
    color: EchoColors.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  tabActive: {
    backgroundColor: EchoColors.primary,
    borderColor: EchoColors.primary,
  },
  tabText: {
    color: EchoColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: EchoColors.onPrimary,
  },
  categories: {
    marginBottom: 12,
    maxHeight: 72,
  },
  categoryChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 16,
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.glassBorder,
    minWidth: 72,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryLabel: {
    color: EchoColors.textDim,
    fontSize: 11,
    marginTop: 4,
  },
  yearLabel: {
    fontFamily: EchoFonts.serif,
    fontSize: 28,
    color: EchoColors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  syncHint: {
    color: EchoColors.textDim,
    fontSize: 12,
    marginBottom: 8,
  },
  error: {
    color: EchoColors.error,
    fontSize: 13,
    marginBottom: 8,
  },
  empty: {
    color: EchoColors.textDim,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: EchoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: EchoColors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: EchoColors.onSecondary,
    fontSize: 28,
    fontWeight: '300',
  },
});
