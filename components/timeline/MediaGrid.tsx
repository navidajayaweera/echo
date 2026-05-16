import { Image } from 'expo-image';
import { Alert, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';
import type { MediaVaultRow } from '@/lib/types/media-vault';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 24;
const GAP = 8;
const CELL = (SCREEN_WIDTH - PADDING * 2 - GAP) / 2;

interface Props {
  items: MediaVaultRow[];
  onDelete: (item: MediaVaultRow) => void;
}

export function MediaGrid({ items, onDelete }: Props) {
  const handleDelete = (item: MediaVaultRow) => {
    Alert.alert(
      'Remove memory',
      `Delete "${item.title ?? 'this photo'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
      ],
    );
  };

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.id} style={styles.cell}>
          {item.public_url ? (
            <Image
              source={{ uri: item.public_url }}
              style={styles.image}
              contentFit="cover"
              transition={250}
              // Neutral blurhash while the signed URL loads
              placeholder={{ blurhash: 'L4HDa[00_2oz00xu_2M{00sl-;-;' }}
            />
          ) : (
            /* Skeleton shimmer while signed URL is being generated */
            <View style={styles.skeleton}>
              <Text style={styles.skeletonIcon}>
                {item.media_type === 'video' ? '🎬' : '🖼'}
              </Text>
            </View>
          )}

          {item.media_type === 'video' && item.public_url ? (
            <View style={styles.playBadge}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          ) : null}

          {/* Visible delete button */}
          <Pressable
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            hitSlop={6}
            accessibilityLabel={`Delete ${item.title ?? 'this photo'}`}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </Pressable>

          {/* Title overlay */}
          {item.title ? (
            <View style={styles.titleBar}>
              <Text style={styles.titleText} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    marginBottom: 4,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeleton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EchoColors.bgCard,
  },
  skeletonIcon: {
    fontSize: 36,
    opacity: 0.5,
  },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 2,
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  titleBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  titleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
});
