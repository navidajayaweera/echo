import { StyleSheet, Text, View } from 'react-native';

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
    backgroundColor: '#141416',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#232326',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: '#F4F2EF',
    fontSize: 17,
    fontWeight: '600',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8B86D',
    marginLeft: 8,
  },
  body: {
    color: '#A8A6A1',
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  date: {
    color: '#6B6966',
    fontSize: 13,
  },
  year: {
    color: '#8B8884',
    fontSize: 13,
    fontWeight: '500',
  },
});
