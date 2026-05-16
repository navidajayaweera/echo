import { StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

interface StatsRowProps {
  memoryCount: number;
  pendingSync: number;
  mediaCount?: number;
}

export function StatsRow({ memoryCount, pendingSync, mediaCount = 0 }: StatsRowProps) {
  return (
    <View style={styles.card}>
      <View style={styles.stat}>
        <Text style={styles.value}>{memoryCount}</Text>
        <Text style={styles.label}>Memories</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.value}>{mediaCount}</Text>
        <Text style={styles.label}>Media</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={[styles.value, pendingSync > 0 && styles.pending]}>{pendingSync}</Text>
        <Text style={styles.label}>Pending</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: EchoColors.border,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    color: EchoColors.text,
    fontSize: 28,
    fontWeight: '300',
  },
  pending: {
    color: EchoColors.accentWarm,
  },
  label: {
    color: EchoColors.textDim,
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    backgroundColor: EchoColors.border,
    marginHorizontal: 8,
  },
});
