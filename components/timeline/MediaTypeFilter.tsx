import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';
import type { MediaType } from '@/lib/types/media-vault';

export type FilterType = 'all' | MediaType;

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '⊞' },
  { key: 'photo', label: 'Photos', icon: '🖼' },
  { key: 'video', label: 'Videos', icon: '🎬' },
  { key: 'voice', label: 'Voice', icon: '🎙' },
  { key: 'letter', label: 'Letters', icon: '✉️' },
  { key: 'document', label: 'Docs', icon: '📄' },
];

interface MediaTypeFilterProps {
  value: FilterType;
  onChange: (f: FilterType) => void;
}

export function MediaTypeFilter({ value, onChange }: MediaTypeFilterProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.chip, value === f.key && styles.chipActive]}
            onPress={() => onChange(f.key)}
            accessibilityRole="button"
            accessibilityLabel={f.label}>
            <Text style={styles.icon}>{f.icon}</Text>
            <Text style={[styles.label, value === f.key && styles.labelActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  row: {
    paddingVertical: 4,
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: EchoColors.border,
    backgroundColor: EchoColors.bgElevated,
  },
  chipActive: {
    borderColor: EchoColors.accentWarm,
    backgroundColor: 'rgba(232,184,109,0.1)',
  },
  icon: {
    fontSize: 14,
  },
  label: {
    color: EchoColors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  labelActive: {
    color: EchoColors.accentWarm,
  },
});
