import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';

export default function PresenceScreen() {
  const { fabBottom, horizontal, left, right } = useAppInsets({
    includeTabBar: true,
  });

  return (
    <ScreenContainer withGradient={false} edges={['top']} includeTabBarPadding>
      <View style={styles.viewport}>
        <View style={styles.placeholder}>
          <IconSymbol name="video.fill" size={48} color={EchoColors.textMuted} />
          <Text style={styles.title}>Presence</Text>
          <Text style={styles.subtitle}>
            LiveKit avatar stream will appear here. Hold to talk, memory overlays, and captions
            ship in the next sprint.
          </Text>
        </View>
      </View>
      <View style={[styles.captionBar, { bottom: fabBottom + 72, left: horizontal + left, right: horizontal + right }]}>
        <Text style={styles.caption}>Waiting for echo session…</Text>
      </View>
      <View style={[styles.ptt, { bottom: fabBottom }]}>
        <IconSymbol name="mic.fill" size={22} color={EchoColors.bg} />
        <Text style={styles.pttLabel}>Hold to talk</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontFamily: EchoFonts.serif,
    fontSize: 28,
    color: EchoColors.text,
    marginTop: 8,
  },
  subtitle: {
    color: EchoColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
    maxWidth: 320,
  },
  captionBar: {
    position: 'absolute',
    backgroundColor: 'rgba(10,10,11,0.85)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  caption: {
    color: EchoColors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  ptt: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 26,
    backgroundColor: EchoColors.accent,
    opacity: 0.55,
  },
  pttLabel: {
    color: EchoColors.bg,
    fontWeight: '600',
    fontSize: 15,
  },
});
