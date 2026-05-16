import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { MemoryRecalledEvent } from '@/lib/types/memory-events';

interface Props {
  memory: MemoryRecalledEvent;
}

export function MemoryRecallCard({ memory }: Props) {
  return (
    <View style={styles.card}>
      {memory.thumbnailUrl ? (
        <Image
          source={{ uri: memory.thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View style={styles.noThumb} />
      )}

      <View style={styles.body}>
        {memory.memoryYear ? (
          <Text style={styles.year}>{memory.memoryYear}</Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {memory.title}
        </Text>
        <Text style={styles.snippet} numberOfLines={4}>
          {memory.snippet}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  noThumb: {
    width: '100%',
    height: 80,
    backgroundColor: EchoColors.bg,
  },
  body: {
    padding: 16,
    gap: 6,
  },
  year: {
    color: EchoColors.accentWarm,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: EchoFonts.serif,
    fontSize: 18,
    color: EchoColors.text,
    lineHeight: 24,
  },
  snippet: {
    color: EchoColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
