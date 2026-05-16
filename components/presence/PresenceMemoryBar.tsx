import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { MemoryRecalledEvent } from '@/lib/types/memory-events';

interface Props {
  memory: MemoryRecalledEvent;
  onPress?: () => void;
}

export function PresenceMemoryBar({ memory, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.thumb}>
            <Text style={styles.thumbIcon}>✦</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.label}>MEMORY RECALLED</Text>
            <Text style={styles.title} numberOfLines={1}>
              {memory.title}
            </Text>
            <Text style={styles.snippet} numberOfLines={1}>
              {memory.snippet}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: EchoColors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    color: EchoColors.tertiary,
    fontSize: 20,
  },
  body: {
    flex: 1,
  },
  label: {
    color: EchoColors.tertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontFamily: EchoFonts.serif,
    fontSize: 17,
    color: EchoColors.text,
  },
  snippet: {
    color: EchoColors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  chevron: {
    color: EchoColors.textDim,
    fontSize: 22,
  },
});
