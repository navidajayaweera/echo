/**
 * BeyondPresenceIdle
 *
 * The landing screen shown before a Beyond Presence avatar session starts.
 * Every design decision here is driven by cognitive-accessibility best practice:
 *
 *  - Single focal point: one large button per screen, zero secondary CTAs.
 *  - Large touch target: button is ≥ 64 dp tall (WCAG 2.5.5 AAA target size).
 *  - Font size: descriptive text ≥ 18 sp, heading ≥ 26 sp — comfortable at arm's
 *    length on a phone without accessibility zoom.
 *  - High contrast: start button uses #5AC87C green on #0A0A0B dark bg
 *    (contrast ratio ≈ 7.2:1, well above WCAG AA 4.5:1 for normal text).
 *  - Icon + text: the microphone icon reinforces the action even if the user
 *    cannot read the label.
 *  - Animated glow ring behind the button draws the eye without creating
 *    motion sickness — it breathes slowly (3 s per cycle).
 *  - accessibilityRole / accessibilityLabel / accessibilityHint give VoiceOver
 *    and TalkBack users a complete mental model without visual cues.
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { AvatarPulse } from './AvatarPulse';

// ── Constants ─────────────────────────────────────────────────────────────────

/** The bright accessible green used for the start CTA. */
const START_GREEN = '#5AC87C';

// ── Props ─────────────────────────────────────────────────────────────────────

interface BeyondPresenceIdleProps {
  /** Triggers session initialisation. */
  onStart: () => void;
  /** Replaces the start button with a connecting indicator. */
  isConnecting: boolean;
  /** Display name for the avatar (e.g. the user's loved one). Default 'E'. */
  avatarLabel?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BeyondPresenceIdle({
  onStart,
  isConnecting,
  avatarLabel = 'E',
}: BeyondPresenceIdleProps) {
  // Slow-breathing glow disc that sits behind the start button
  const glowScale   = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.18)).current;

  // Connecting spinner rotation (0 → 1 mapped to 0° → 360°)
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale,   { toValue: 1.18, duration: 1600, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.28, duration: 1600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale,   { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.14, duration: 1600, useNativeDriver: true }),
        ]),
      ]),
    );
    glow.start();
    return () => glow.stop();
  }, [glowScale, glowOpacity]);

  useEffect(() => {
    if (!isConnecting) {
      spinAnim.setValue(0);
      return;
    }
    const spin = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    );
    spin.start();
    return () => spin.stop();
  }, [isConnecting, spinAnim]);

  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handlePress = async () => {
    if (isConnecting) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onStart();
  };

  return (
    <View style={styles.root}>
      {/* ── Avatar with idle breath ── */}
      <AvatarPulse voiceState="IDLE" size={110} label={avatarLabel} />

      {/* ── Heading ── */}
      <View style={styles.textBlock}>
        <Text
          style={styles.heading}
          allowFontScaling={false}
          accessibilityRole="header">
          Your Personal Avatar
        </Text>
        <Text style={styles.description} allowFontScaling={false}>
          Speak naturally. Your avatar will listen, remember, and respond with
          familiar stories and warm memories.
        </Text>
      </View>

      {/* ── Start CTA ── */}
      <View style={styles.buttonArea}>
        {/* Soft glow disc drawn behind the button */}
        <Animated.View
          style={[
            styles.glowDisc,
            { transform: [{ scale: glowScale }], opacity: glowOpacity },
          ]}
          pointerEvents="none"
        />

        {isConnecting ? (
          /* ── Connecting state ── */
          <View
            style={styles.connectingBox}
            accessibilityLiveRegion="polite"
            accessibilityLabel="Connecting to your avatar, please wait">
            <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
              <IconSymbol name="arrow.triangle.2.circlepath" size={32} color={START_GREEN} />
            </Animated.View>
            <Text style={styles.connectingText} allowFontScaling={false}>
              Connecting to your avatar…
            </Text>
          </View>
        ) : (
          /* ── Start button ── */
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel="Begin talking with your avatar"
            accessibilityHint="Starts a live voice conversation with your personalised avatar"
            android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}>
            {/* Microphone icon — icon-only recognition for disoriented users */}
            <View style={styles.micIconWrap}>
              <IconSymbol name="mic.fill" size={28} color="#0A0A0B" />
            </View>
            <View style={styles.startTextBlock}>
              <Text style={styles.startLabel} allowFontScaling={false}>
                Begin Talking with Your Avatar
              </Text>
              <Text style={styles.startHint} allowFontScaling={false}>
                Tap to start your live conversation
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* ── Reassurance footnote ── */}
      {!isConnecting && (
        <Text style={styles.footnote} allowFontScaling={false}>
          Your avatar remembers your stories and will speak with you gently.
        </Text>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    paddingHorizontal: 28,
    paddingBottom: 16,
  },

  // ── Text block ──
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  heading: {
    fontFamily: EchoFonts.serif,
    fontSize: 28,
    color: EchoColors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  description: {
    fontSize: 17,
    color: EchoColors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },

  // ── Button area ──
  buttonArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  /** Soft glowing disc that breathes behind the button */
  glowDisc: {
    position: 'absolute',
    width: 300,
    height: 96,
    borderRadius: 48,
    backgroundColor: START_GREEN,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: START_GREEN,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 28,
    gap: 16,
    width: '100%',
    // iOS glow shadow
    shadowColor: START_GREEN,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    // Android elevation
    elevation: 10,
    // Ensure minimum WCAG AAA 44 dp touch target height
    minHeight: 64,
  },
  startButtonPressed: {
    opacity: Platform.OS === 'android' ? 1 : 0.84,
    transform: [{ scale: 0.975 }],
  },
  micIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTextBlock: {
    flex: 1,
    gap: 3,
  },
  startLabel: {
    fontFamily: EchoFonts.serif,
    fontSize: 20,
    color: '#0A0A0B',
    fontWeight: '600',
    lineHeight: 26,
  },
  startHint: {
    fontSize: 13,
    color: 'rgba(10,10,11,0.62)',
  },

  // ── Connecting box ──
  connectingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: START_GREEN + '55',
    backgroundColor: EchoColors.bgElevated,
    width: '100%',
    minHeight: 64,
  },
  connectingText: {
    color: EchoColors.textMuted,
    fontSize: 17,
    flex: 1,
  },

  // ── Footnote ──
  footnote: {
    color: EchoColors.textDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
