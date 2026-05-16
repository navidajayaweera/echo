import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

export function AmbientBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[EchoColors.gradientStart, EchoColors.gradientMid, EchoColors.gradientEnd]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.glowViolet} />
      <View style={styles.glowGold} />
    </View>
  );
}

const styles = StyleSheet.create({
  glowViolet: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: EchoColors.glowViolet,
    opacity: 0.6,
  },
  glowGold: {
    position: 'absolute',
    bottom: '20%',
    right: '5%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: EchoColors.glowGold,
    opacity: 0.4,
  },
});
