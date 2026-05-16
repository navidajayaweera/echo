import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { MediaVaultRow, MediaType } from '@/lib/types/media-vault';

const MEDIA_ICON: Record<MediaType, string> = {
  photo: 'photo.fill',
  video: 'video.fill',
  letter: 'envelope.fill',
  voice: 'mic.fill',
  document: 'doc.fill',
};

interface Props {
  item: MediaVaultRow;
  onDelete?: (item: MediaVaultRow) => void;
}

export function TimelineItemCard({ item, onDelete }: Props) {
  const isPhoto = item.media_type === 'photo';
  const isVideo = item.media_type === 'video';
  const hasPreview = (isPhoto || isVideo) && item.public_url;

  const handleLongPress = () => {
    if (!onDelete) return;
    Alert.alert(
      'Remove media',
      `Delete "${item.title ?? 'this item'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
      ],
    );
  };

  return (
    <Pressable style={styles.card} onLongPress={handleLongPress}>
      {hasPreview ? (
        <Image
          source={{ uri: item.public_url! }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.iconPlaceholder}>
          <IconSymbol
            name={MEDIA_ICON[item.media_type] as any}
            size={28}
            color={EchoColors.textMuted}
          />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.typeLabel}>{item.media_type}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title ?? 'Untitled'}
        </Text>
        {item.description ? (
          <Text style={styles.desc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  iconPlaceholder: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EchoColors.bg,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 4,
  },
  typeLabel: {
    color: EchoColors.accentWarm,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  title: {
    color: EchoColors.text,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: EchoFonts.sans,
  },
  desc: {
    color: EchoColors.textDim,
    fontSize: 13,
  },
});
