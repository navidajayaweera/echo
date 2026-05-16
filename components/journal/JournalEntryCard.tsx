import { StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { JournalCacheEntry } from '@/lib/types/database';

const MOOD_EMOJI: Record<string, string> = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  low: '😔',
  unwell: '😢',
};

interface JournalEntryCardProps {
  entry: JournalCacheEntry;
}

export function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const mediaCount = entry.mediaVaultIds?.length ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {entry.title || 'Untitled memory'}
        </Text>
        <View style={styles.badges}>
          {entry.moodTag ? (
            <Text style={styles.moodEmoji}>{MOOD_EMOJI[entry.moodTag] ?? ''}</Text>
          ) : null}
          {entry.pendingSync && <View style={styles.pendingDot} />}
        </View>
      </View>

      <Text style={styles.body} numberOfLines={3}>
        {entry.body}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>{date}</Text>
        <View style={styles.footerRight}>
          {mediaCount > 0 ? (
            <Text style={styles.mediaTag}>📷 {mediaCount}</Text>
          ) : null}
          {entry.memoryYear != null && (
            <Text style={styles.year}>{entry.memoryYear}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 18,
    fontWeight: '400',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodEmoji: {
    fontSize: 20,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EchoColors.accentWarm,
  },
  body: {
    color: EchoColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  date: {
    color: EchoColors.textDim,
    fontSize: 13,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaTag: {
    color: EchoColors.textMuted,
    fontSize: 13,
  },
  year: {
    color: EchoColors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
