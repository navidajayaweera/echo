import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

const MOODS = [
  { key: 'great', emoji: '😊', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'low', emoji: '😔', label: 'Low' },
  { key: 'unwell', emoji: '😢', label: 'Unwell' },
] as const;

export type MoodKey = (typeof MOODS)[number]['key'];

interface MoodPickerProps {
  value: MoodKey | null;
  onChange: (key: MoodKey) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>How are you feeling?</Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <Pressable
            key={m.key}
            style={[styles.chip, value === m.key && styles.chipSelected]}
            onPress={() => onChange(m.key)}
            accessibilityLabel={m.label}
            accessibilityRole="button">
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={[styles.chipLabel, value === m.key && styles.chipLabelSelected]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: EchoColors.border,
    backgroundColor: EchoColors.bg,
    gap: 4,
  },
  chipSelected: {
    borderColor: EchoColors.accentWarm,
    backgroundColor: 'rgba(232,184,109,0.1)',
  },
  emoji: {
    fontSize: 22,
  },
  chipLabel: {
    color: EchoColors.textDim,
    fontSize: 10,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: EchoColors.accentWarm,
  },
});
