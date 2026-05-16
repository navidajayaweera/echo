import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

export interface AttachedMedia {
  localUri: string;
  vaultId?: string;
  uploading?: boolean;
  mimeType: string;
}

interface Props {
  items: AttachedMedia[];
  onRemove: (uri: string) => void;
  onAdd: () => void;
}

export function MediaAttachmentStrip({ items, onRemove, onAdd }: Props) {
  const isVideo = (mime: string) => mime.startsWith('video/');

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Photos & Videos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {items.map((item) => (
          <View key={item.localUri} style={styles.thumbWrap}>
            <Image
              source={{ uri: item.localUri }}
              style={styles.thumb}
              contentFit="cover"
              transition={150}
            />
            {item.uploading ? (
              <View style={styles.overlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : null}
            {isVideo(item.mimeType) ? (
              <View style={styles.videoTag}>
                <Text style={styles.videoTagText}>▶</Text>
              </View>
            ) : null}
            <Pressable
              style={styles.removeBtn}
              onPress={() => onRemove(item.localUri)}
              hitSlop={8}
              accessibilityLabel="Remove photo">
              <Text style={styles.removeBtnText}>✕</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          style={styles.addBtn}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add photo or video">
          <Text style={styles.addIcon}>📷</Text>
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    color: EchoColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  scroll: {
    flexDirection: 'row',
  },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: EchoColors.bg,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  videoTagText: {
    color: '#fff',
    fontSize: 10,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  addBtn: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: EchoColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: EchoColors.bg,
  },
  addIcon: {
    fontSize: 24,
  },
  addLabel: {
    color: EchoColors.textDim,
    fontSize: 12,
    fontWeight: '500',
  },
});
