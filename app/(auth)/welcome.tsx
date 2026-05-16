import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <ScreenContainer edges={['top', 'bottom']} withGradient={false}>
        <View style={styles.content}>
          <View style={styles.heroArt}>
            <View style={styles.orb1} />
            <View style={styles.orb2} />
            <Text style={styles.heroGlyph}>✦</Text>
          </View>

          <Text style={styles.headline}>Preserve the people, stories, and moments that shaped you.</Text>
          <Text style={styles.sub}>
            Echoes creates memory-grounded AI personas for emotional continuity across time.
          </Text>

          <Text style={styles.disclosure}>
            AI representations are built from memories. They are not living consciousness.
          </Text>

          <View style={styles.actions}>
            <PrimaryButton label="Begin Your Archive" onPress={() => router.push('/signup')} />
            <PrimaryButton
              label="Sign In"
              onPress={() => router.push('/login')}
              variant="outline"
            />
          </View>
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: EchoColors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
    gap: 16,
  },
  heroArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  orb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: EchoColors.glowViolet,
  },
  orb2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: EchoColors.glowGold,
    top: '30%',
    right: '20%',
  },
  heroGlyph: {
    fontSize: 48,
    color: EchoColors.primary,
  },
  headline: {
    fontFamily: EchoFonts.serif,
    fontSize: 32,
    lineHeight: 40,
    color: EchoColors.text,
    letterSpacing: -0.5,
  },
  sub: {
    color: EchoColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  disclosure: {
    color: EchoColors.textDim,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 8,
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
});
