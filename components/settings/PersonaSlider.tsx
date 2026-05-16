import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

interface PersonaSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

export function PersonaSlider({ label, value, onChange }: PersonaSliderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.round(value)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={EchoColors.accent}
        maximumTrackTintColor={EchoColors.border}
        thumbTintColor={EchoColors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: EchoColors.text,
    fontSize: 16,
  },
  value: {
    color: EchoColors.textMuted,
    fontSize: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
