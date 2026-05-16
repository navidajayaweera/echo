import { StyleSheet, View, type ViewProps } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

interface GlassCardProps extends ViewProps {
  glow?: boolean;
}

export function GlassCard({ children, style, glow, ...props }: GlassCardProps) {
  return (
    <View style={[styles.card, glow && styles.glow, style]} {...props}>
      <View style={styles.topEdge} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: EchoColors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: EchoColors.glassBorder,
    overflow: 'hidden',
  },
  glow: {
    shadowColor: EchoColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(202, 190, 255, 0.35)',
  },
});
