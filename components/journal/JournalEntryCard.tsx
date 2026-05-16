import { StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';
import type { JournalCacheEntry } from '@/lib/types/database';

interface JournalEntryCardProps {
  entry: JournalCacheEntry;
}

export function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {entry.title || 'Untitled memory'}
        </Text>
        {entry.pendingSync && <View style={styles.pendingDot} />}
      </View>
      <Text style={styles.body} numberOfLines={3}>
        {entry.body}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{date}</Text>
        {entry.memoryYear != null && (
          <Text style={styles.year}>{entry.memoryYear}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: EchoColors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: EchoColors.accentWarm,
    marginLeft: 8,
  },
  body: {
    color: EchoColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  date: {
    color: EchoColors.textDim,
    fontSize: 13,
  },
  year: {
    color: EchoColors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
