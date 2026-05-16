import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { MediaType, MediaVaultRow } from '@/lib/types/media-vault';

const MEDIA_ICON: Record<MediaType, string> = {
  photo: 'photo.fill',
  video: 'video.fill',
  letter: 'envelope.fill',
  voice: 'mic.fill',
  document: 'doc.fill',
};

const MEDIA_EMOJI: Record<MediaType, string> = {
  photo: '🖼',
  video: '🎬',
  letter: '✉️',
  voice: '🎙',
  document: '📄',
};

function formatMemoryDate(row: MediaVaultRow): string {
  if (row.memory_date) {
    const d = new Date(row.memory_date + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }
  return String(row.memory_year);
}

interface Props {
  item: MediaVaultRow;
  onDelete?: (item: MediaVaultRow) => void;
}

export function TimelineItemCard({ item, onDelete }: Props) {
  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      'Remove memory',
      `Delete "${item.title ?? 'this item'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Text style={styles.mediaEmoji}>{MEDIA_EMOJI[item.media_type]}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.typeRow}>
          <Text style={styles.typeLabel}>{item.media_type}</Text>
          <Text style={styles.dateLabel}>{formatMemoryDate(item)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title ?? 'Untitled'}
        </Text>
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {onDelete ? (
        <Pressable
          style={styles.deleteBtn}
          onPress={handleDelete}
          hitSlop={8}
          accessibilityLabel={`Delete ${item.title ?? 'this memory'}`}>
          <IconSymbol name="trash.fill" size={16} color={EchoColors.error} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EchoColors.border,
    marginBottom: 10,
    padding: 14,
    gap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: EchoColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: EchoColors.borderSubtle,
    flexShrink: 0,
  },
  mediaEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeLabel: {
    color: EchoColors.accentWarm,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  dateLabel: {
    color: EchoColors.textDim,
    fontSize: 12,
  },
  title: {
    color: EchoColors.text,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: EchoFonts.sans,
    lineHeight: 21,
  },
  desc: {
    color: EchoColors.textDim,
    fontSize: 13,
    lineHeight: 18,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(232,125,125,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
