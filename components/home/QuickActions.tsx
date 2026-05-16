/**
 * QuickActions
 *
 * The primary action strip on the Home screen.
 *
 * Accessibility decisions for dementia users:
 *  - "Go to My Avatar" is the DOMINANT button — visually heavier than any other
 *    element on the card, with a bright accessible green background
 *    (contrast ratio ≈ 7:1 against the dark theme) so it is immediately
 *    findable even when the user is disoriented.
 *  - Icon + text + subtitle: three independent recognition channels so the CTA
 *    is understood without reading the full label.
 *  - Minimum touch target: paddingVertical 20 dp + minHeight 64 dp satisfies
 *    WCAG 2.5.5 AAA for users with reduced motor precision.
 *  - Press feedback: scale transform (not just opacity) provides strong
 *    kinesthetic confirmation of the tap.
 *  - accessibilityHint explains the *destination*, not just the action.
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

/** Bright accessible green — same token used by AvatarPulse LISTENING state */
const AVATAR_GREEN = '#5AC87C';

interface QuickActionsProps {
  onNewJournal: () => void;
}

export function QuickActions({ onNewJournal }: QuickActionsProps) {
  const router = useRouter();
  // Scale animation gives tactile confirmation of the tap
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleAvatarPressIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handleAvatarPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 18,
    }).start(() => {
      router.push('/presence');
    });
  };

  return (
    <View style={styles.wrap}>

      {/* ── Primary: Go to My Avatar (Beyond Presence) ── */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={styles.avatarButton}
          onPressIn={handleAvatarPressIn}
          onPressOut={handleAvatarPressOut}
          accessibilityRole="button"
          accessibilityLabel="Go to My Avatar"
          accessibilityHint="Opens the Beyond Presence live avatar session where you can speak with your personalised avatar"
          android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}>

          {/* Microphone badge */}
          <View style={styles.avatarIconWrap}>
            {/* Simple emoji mic — universally recognisable without reading */}
            <Text style={styles.avatarEmoji}>🎙</Text>
          </View>

          <View style={styles.avatarTextBlock}>
            <Text style={styles.avatarLabel} allowFontScaling={false}>
              Go to My Avatar
            </Text>
            <Text style={styles.avatarHint} allowFontScaling={false}>
              Speak with your personalised presence
            </Text>
          </View>

          {/* Chevron — universal "navigate" affordance */}
          <Text style={styles.avatarChevron} allowFontScaling={false}>›</Text>
        </Pressable>
      </Animated.View>

      {/* ── Secondary row ── */}
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={onNewJournal}
          accessibilityRole="button"
          accessibilityLabel="Write a new journal entry">
          <Text style={styles.secondaryIcon}>📝</Text>
          <Text style={styles.secondaryLabel}>New Journal</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => router.push('/timeline')}
          accessibilityRole="button"
          accessibilityLabel="Add a memory to the vault">
          <Text style={styles.secondaryIcon}>📷</Text>
          <Text style={styles.secondaryLabel}>Add Memory</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    gap: 10,
  },

  // ── Avatar CTA ──────────────────────────────────────────────────────────────
  avatarButton: {
    backgroundColor: AVATAR_GREEN,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    // iOS shadow creates a subtle glow, making this button "float" above others
    shadowColor: AVATAR_GREEN,
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  avatarIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  avatarTextBlock: {
    flex: 1,
    gap: 3,
  },
  avatarLabel: {
    fontFamily: EchoFonts.serif,
    color: '#0A0A0B',
    fontSize: 20,
    lineHeight: 26,
  },
  avatarHint: {
    color: 'rgba(10,10,11,0.58)',
    fontSize: 13,
    lineHeight: 18,
  },
  avatarChevron: {
    color: 'rgba(10,10,11,0.45)',
    fontSize: 26,
    fontWeight: '300',
  },

  // ── Secondary row ───────────────────────────────────────────────────────────
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  secondary: {
    flex: 1,
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: EchoColors.border,
    gap: 6,
    minHeight: 64,
  },
  secondaryIcon: {
    fontSize: 24,
  },
  secondaryLabel: {
    color: EchoColors.text,
    fontSize: 14,
    fontWeight: '500',
  },
});
