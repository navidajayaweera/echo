/**
 * AvatarPulse
 *
 * A stacked-ring avatar that animates its concentric glow rings to reflect the
 * current voice state of the Beyond Presence session.
 *
 * Accessibility choices:
 *  - accessibilityRole="image" + descriptive accessibilityLabel: screen-readers
 *    announce state changes without users needing to read visual animation cues.
 *  - Ring colours are semantically distinct (green = listening, amber = speaking)
 *    and differ in brightness by at least 3:1 against the dark background, so
 *    the distinction is perceivable by users with colour-vision deficiencies.
 *  - The avatar letter is serif, 36 % of container size, ensuring it remains
 *    legible on any device width without zooming.
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AvatarVoiceState = 'IDLE' | 'LISTENING' | 'SPEAKING';

interface AvatarPulseProps {
  voiceState: AvatarVoiceState;
  /** Diameter of the inner avatar circle in dp. Default: 120 */
  size?: number;
  /** Single character shown in the avatar. Default: 'E' */
  label?: string;
}

// ── Ring colour per voice state ────────────────────────────────────────────────

const RING_COLOR: Record<AvatarVoiceState, string> = {
  IDLE: EchoColors.border,       // subtle grey — dormant
  LISTENING: '#5AC87C',          // bright accessible green — user is speaking
  SPEAKING: '#E8B86D',           // warm amber — avatar is responding
};

const A11Y_LABEL: Record<AvatarVoiceState, string> = {
  IDLE: 'Avatar ready and waiting',
  LISTENING: 'Microphone active — the avatar is listening to you',
  SPEAKING: 'Avatar is speaking',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AvatarPulse({ voiceState, size = 120, label = 'E' }: AvatarPulseProps) {
  // Each ring pair: scale + opacity, both driven by the native animation thread
  const innerScale   = useRef(new Animated.Value(1)).current;
  const innerOpacity = useRef(new Animated.Value(0.25)).current;
  const midScale     = useRef(new Animated.Value(1)).current;
  const midOpacity   = useRef(new Animated.Value(0)).current;
  const farScale     = useRef(new Animated.Value(1)).current;
  const farOpacity   = useRef(new Animated.Value(0)).current;

  // Track running animations so the cleanup can stop them before the next cycle
  const animsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Stop & clear all previous animations
    animsRef.current.forEach((a) => a.stop());
    animsRef.current = [];

    // Reset values to known starting points
    innerScale.setValue(1);
    innerOpacity.setValue(voiceState === 'IDLE' ? 0.25 : 0.35);
    midScale.setValue(1);
    midOpacity.setValue(0);
    farScale.setValue(1);
    farOpacity.setValue(0);

    const NATIVE = { useNativeDriver: true };

    if (voiceState === 'IDLE') {
      // Slow, subtle breath on inner ring only — calming for the user
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(innerScale, { toValue: 1.07, duration: 1800, ...NATIVE }),
          Animated.timing(innerScale, { toValue: 1, duration: 1800, ...NATIVE }),
        ]),
      );
      animsRef.current.push(anim);
      anim.start();
    }

    if (voiceState === 'LISTENING') {
      // Snappy green pulse — signals active microphone
      const innerAnim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(innerScale, { toValue: 1.14, duration: 480, ...NATIVE }),
            Animated.timing(innerScale, { toValue: 1, duration: 480, ...NATIVE }),
          ]),
          Animated.sequence([
            Animated.timing(innerOpacity, { toValue: 0.8, duration: 480, ...NATIVE }),
            Animated.timing(innerOpacity, { toValue: 0.35, duration: 480, ...NATIVE }),
          ]),
        ]),
      );
      // Staggered mid ring — expands outward to reinforce "capturing voice"
      const midAnim = Animated.loop(
        Animated.sequence([
          Animated.delay(240),
          Animated.parallel([
            Animated.timing(midScale, { toValue: 1.28, duration: 580, ...NATIVE }),
            Animated.timing(midOpacity, { toValue: 0.45, duration: 300, ...NATIVE }),
          ]),
          Animated.parallel([
            Animated.timing(midScale, { toValue: 1, duration: 100, ...NATIVE }),
            Animated.timing(midOpacity, { toValue: 0, duration: 380, ...NATIVE }),
          ]),
        ]),
      );
      animsRef.current.push(innerAnim, midAnim);
      innerAnim.start();
      midAnim.start();
    }

    if (voiceState === 'SPEAKING') {
      // Staggered amber ripple — three rings wash outward like sound waves
      const innerAnim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(innerScale, { toValue: 1.1, duration: 420, ...NATIVE }),
            Animated.timing(innerScale, { toValue: 1, duration: 420, ...NATIVE }),
          ]),
          Animated.sequence([
            Animated.timing(innerOpacity, { toValue: 0.7, duration: 420, ...NATIVE }),
            Animated.timing(innerOpacity, { toValue: 0.35, duration: 420, ...NATIVE }),
          ]),
        ]),
      );
      const midAnim = Animated.loop(
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(midScale, { toValue: 1.32, duration: 520, ...NATIVE }),
            Animated.timing(midOpacity, { toValue: 0.42, duration: 280, ...NATIVE }),
          ]),
          Animated.parallel([
            Animated.timing(midScale, { toValue: 1, duration: 100, ...NATIVE }),
            Animated.timing(midOpacity, { toValue: 0, duration: 340, ...NATIVE }),
          ]),
        ]),
      );
      const farAnim = Animated.loop(
        Animated.sequence([
          Animated.delay(420),
          Animated.parallel([
            Animated.timing(farScale, { toValue: 1.55, duration: 640, ...NATIVE }),
            Animated.timing(farOpacity, { toValue: 0.28, duration: 280, ...NATIVE }),
          ]),
          Animated.parallel([
            Animated.timing(farScale, { toValue: 1, duration: 100, ...NATIVE }),
            Animated.timing(farOpacity, { toValue: 0, duration: 360, ...NATIVE }),
          ]),
        ]),
      );
      animsRef.current.push(innerAnim, midAnim, farAnim);
      innerAnim.start();
      midAnim.start();
      farAnim.start();
    }

    return () => {
      animsRef.current.forEach((a) => a.stop());
    };
  }, [voiceState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-compute sizes and centered absolute positions
  const containerSize = size + 86;
  const innerRingSize = size + 18;
  const midRingSize   = size + 44;
  const farRingSize   = size + 74;

  const center = (ringSize: number) => (containerSize - ringSize) / 2;
  const ringColor = RING_COLOR[voiceState];

  return (
    <View
      style={[styles.container, { width: containerSize, height: containerSize }]}
      accessibilityRole="image"
      accessibilityLabel={A11Y_LABEL[voiceState]}>

      {/* Far ring — visible during SPEAKING */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: farRingSize,
            height: farRingSize,
            borderRadius: farRingSize / 2,
            top: center(farRingSize),
            left: center(farRingSize),
            borderColor: ringColor,
            opacity: farOpacity,
            transform: [{ scale: farScale }],
          },
        ]}
      />

      {/* Mid ring — visible during LISTENING and SPEAKING */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: midRingSize,
            height: midRingSize,
            borderRadius: midRingSize / 2,
            top: center(midRingSize),
            left: center(midRingSize),
            borderColor: ringColor,
            opacity: midOpacity,
            transform: [{ scale: midScale }],
          },
        ]}
      />

      {/* Inner ring — always present, carries the base idle breath */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: innerRingSize,
            height: innerRingSize,
            borderRadius: innerRingSize / 2,
            top: center(innerRingSize),
            left: center(innerRingSize),
            borderColor: ringColor,
            opacity: innerOpacity,
            transform: [{ scale: innerScale }],
          },
        ]}
      />

      {/* Avatar circle — always centred, non-animated */}
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ringColor,
          },
        ]}>
        <Text
          style={[styles.avatarLetter, { fontSize: size * 0.36 }]}
          allowFontScaling={false}>
          {label}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  avatar: {
    backgroundColor: EchoColors.bgCard,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
  },
});
