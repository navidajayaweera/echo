import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { JournalCacheEntry } from '@/lib/types/database';

const MOOD_EMOJI: Record<string, string> = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  low: '😔',
  unwell: '😢',
};

function relativeDay(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

interface Props {
  entries: JournalCacheEntry[];
}

export function RecentEntriesPreview({ entries }: Props) {
  const router = useRouter();
  const recent = entries.slice(0, 2);

  if (recent.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Recent Memories</Text>
      {recent.map((entry) => (
        <Pressable
          key={entry.localId}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push('/journal')}
          accessibilityRole="button">
          <View style={styles.header}>
            <Text style={styles.when}>{relativeDay(entry.createdAt)}</Text>
            <View style={styles.headerRight}>
              {entry.mediaVaultIds?.length ? (
                <Text style={styles.mediaBadge}>📷 {entry.mediaVaultIds.length}</Text>
              ) : null}
              {entry.moodTag ? (
                <Text style={styles.mood}>{MOOD_EMOJI[entry.moodTag] ?? ''}</Text>
              ) : null}
            </View>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {entry.title || entry.body.slice(0, 40)}
          </Text>
          {entry.title ? (
            <Text style={styles.body} numberOfLines={1}>
              {entry.body}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
  },
  heading: {
    color: EchoColors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  cardPressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  when: {
    color: EchoColors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mediaBadge: {
    color: EchoColors.textDim,
    fontSize: 12,
  },
  mood: {
    fontSize: 16,
  },
  title: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 15,
    fontWeight: '400',
  },
  body: {
    color: EchoColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
