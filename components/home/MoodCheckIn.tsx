import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

const MOODS = [
  { key: 'great', emoji: '😊', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'low', emoji: '😔', label: 'Low' },
  { key: 'unwell', emoji: '😢', label: 'Unwell' },
] as const;

type MoodKey = (typeof MOODS)[number]['key'];

function todayKey() {
  return `daily_mood_${new Date().toISOString().slice(0, 10)}`;
}

export function MoodCheckIn() {
  const [selected, setSelected] = useState<MoodKey | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(todayKey()).then((v) => {
      if (v) setSelected(v as MoodKey);
    });
  }, []);

  const pick = async (key: MoodKey) => {
    setSelected(key);
    await AsyncStorage.setItem(todayKey(), key);
  };

  const selectedMood = MOODS.find((m) => m.key === selected);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {selected ? `Feeling ${selectedMood?.label.toLowerCase()} today` : 'How are you feeling?'}
      </Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <Pressable
            key={m.key}
            style={[styles.chip, selected === m.key && styles.chipSelected]}
            onPress={() => pick(m.key)}
            accessibilityLabel={m.label}
            accessibilityRole="button">
            <Text style={styles.emoji}>{m.emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    color: EchoColors.textDim,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1.5,
    borderColor: EchoColors.border,
  },
  chipSelected: {
    borderColor: EchoColors.accentWarm,
    backgroundColor: 'rgba(232,184,109,0.12)',
  },
  emoji: {
    fontSize: 22,
  },
});
