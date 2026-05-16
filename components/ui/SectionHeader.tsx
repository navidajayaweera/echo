import { StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  title: {
    color: EchoColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  subtitle: {
    color: EchoColors.textDim,
    fontSize: 14,
    marginTop: 4,
  },
});
