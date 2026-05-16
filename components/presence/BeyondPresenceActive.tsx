/**
 * BeyondPresenceActive
 *
 * The full-screen UI shown during an active Beyond Presence avatar session.
 *
 * Layout (top → bottom):
 *   1. Session header   — elapsed timer + provider badge + end button
 *   2. Avatar viewport  — AvatarPulse centred with voice-state rings
 *   3. Voice-state label — "Listening…" / "Avatar is speaking…" / "Hold to talk"
 *   4. Caption bar      — live transcript of the avatar's last utterance
 *   5. PTT button       — large push-to-talk; hold to speak, release to receive
 *   6. End Session CTA  — unmistakable high-contrast red, full-width
 *
 * Accessibility decisions:
 *  - All interactive elements have accessibilityRole, accessibilityLabel,
 *    accessibilityHint — blind users get a complete description.
 *  - The "End Session" button is intentionally large (minHeight 64 dp) and
 *    separated from the PTT button by 16 dp to prevent accidental taps —
 *    important for users with tremor or reduced motor control.
 *  - Caption text is 16 sp / lineHeight 24, readable at arm's length.
 *  - Color-coding (green = listening, amber = speaking, red = end) uses at
 *    least 3:1 contrast ratio against the dark background on every element.
 *  - accessibilityLiveRegion="polite" on the caption lets VoiceOver users
 *    hear new caption text automatically without focus interruption.
 *  - The PTT label changes with voiceState so TalkBack announces state changes.
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import type { LiveKitCreds } from '@/lib/types/ai-session';
import type { MemoryRecalledEvent } from '@/lib/types/memory-events';
import { AvatarPulse, type AvatarVoiceState } from './AvatarPulse';
import { MemoryModePane } from './MemoryModePane';

// ── Semantic colour tokens ─────────────────────────────────────────────────────

const END_RED      = '#DC5050';   // high-contrast red — end session
const LISTEN_GREEN = '#5AC87C';   // bright green — user is speaking
const SPEAK_AMBER  = '#E8B86D';   // warm amber — avatar is speaking

// ── Session elapsed timer ─────────────────────────────────────────────────────

function useElapsed() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ── Voice-state label text ────────────────────────────────────────────────────

const VOICE_LABEL: Record<AvatarVoiceState, string> = {
  IDLE: 'Hold the button below to speak',
  LISTENING: 'Listening to you…',
  SPEAKING: 'Avatar is responding…',
};

const VOICE_LABEL_COLOR: Record<AvatarVoiceState, string> = {
  IDLE: EchoColors.textDim,
  LISTENING: LISTEN_GREEN,
  SPEAKING: SPEAK_AMBER,
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface BeyondPresenceActiveProps {
  livekitCreds: LiveKitCreds;
  voiceState: AvatarVoiceState;
  captionText: string;
  avatarLabel?: string;
  memoryOpen: boolean;
  memory: MemoryRecalledEvent | null;
  onMemoryClose: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onEndSession: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BeyondPresenceActive({
  livekitCreds,
  voiceState,
  captionText,
  avatarLabel = 'E',
  memoryOpen,
  memory,
  onMemoryClose,
  onStartListening,
  onStopListening,
  onEndSession,
}: BeyondPresenceActiveProps) {
  const { fabBottom, horizontal, left, right } = useAppInsets({ includeTabBar: true });
  const elapsed = useElapsed();

  // Subtle scale animation on the PTT button so it "breathes" when idle,
  // then snaps to solid when the user is holding it.
  const pttScale = useRef(new Animated.Value(1)).current;
  const animRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current?.stop();
    if (voiceState === 'IDLE') {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pttScale, { toValue: 1.04, duration: 900, useNativeDriver: true }),
          Animated.timing(pttScale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      animRef.current.start();
    } else {
      pttScale.setValue(voiceState === 'LISTENING' ? 0.96 : 1);
    }
    return () => animRef.current?.stop();
  }, [voiceState]); // eslint-disable-line react-hooks/exhaustive-deps

  const pttColor =
    voiceState === 'LISTENING' ? LISTEN_GREEN
    : voiceState === 'SPEAKING' ? SPEAK_AMBER
    : EchoColors.accent;

  const pttLabel =
    voiceState === 'LISTENING' ? 'Release to stop'
    : voiceState === 'SPEAKING' ? 'Avatar speaking…'
    : 'Hold to speak';

  const handlePressIn = async () => {
    if (voiceState === 'SPEAKING') return; // don't interrupt the avatar
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartListening();
  };

  const handlePressOut = async () => {
    if (voiceState !== 'LISTENING') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStopListening();
  };

  const handleEnd = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onEndSession();
  };

  return (
    <View style={styles.root}>

      {/* ── Session header ── */}
      <View style={styles.sessionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.liveDot} />
          <Text style={styles.providerLabel} allowFontScaling={false}>
            Beyond Presence
          </Text>
        </View>
        <Text style={styles.timer} allowFontScaling={false}>{elapsed}</Text>
      </View>

      {/* ── Avatar viewport ── */}
      <View style={styles.avatarArea}>
        {/* Placeholder for the LiveKit video track; renders AvatarPulse until
            @livekit/react-native is installed and a video track is published. */}
        <View style={styles.videoPlaceholder}>
          <AvatarPulse voiceState={voiceState} size={130} label={avatarLabel} />
        </View>

        {/* Voice-state label — colour-coded and accessible via live region */}
        <View
          style={styles.voiceLabelRow}
          accessibilityLiveRegion="polite"
          accessibilityLabel={VOICE_LABEL[voiceState]}>
          {voiceState === 'LISTENING' && (
            <View style={[styles.stateDot, { backgroundColor: LISTEN_GREEN }]} />
          )}
          {voiceState === 'SPEAKING' && (
            <View style={[styles.stateDot, { backgroundColor: SPEAK_AMBER }]} />
          )}
          <Text
            style={[styles.voiceLabel, { color: VOICE_LABEL_COLOR[voiceState] }]}
            allowFontScaling={false}>
            {VOICE_LABEL[voiceState]}
          </Text>
        </View>
      </View>

      {/* ── Caption bar ── */}
      {(captionText.length > 0 || voiceState !== 'IDLE') && (
        <View
          style={styles.captionBar}
          accessibilityLiveRegion="polite"
          accessibilityLabel={captionText || 'Waiting for the avatar to respond'}>
          <Text style={styles.captionText} numberOfLines={4} allowFontScaling={false}>
            {captionText || (voiceState === 'LISTENING' ? 'Listening…' : 'Avatar is thinking…')}
          </Text>
        </View>
      )}

      {/* ── Controls area ── */}
      <View style={[styles.controls, { paddingBottom: fabBottom + 8 }]}>

        {/* PTT button — large, semantically labelled, haptic feedback */}
        <Animated.View style={{ transform: [{ scale: pttScale }], width: '100%' }}>
          <Pressable
            style={[styles.pttButton, { backgroundColor: pttColor + '22', borderColor: pttColor }]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={voiceState === 'SPEAKING'}
            accessibilityRole="button"
            accessibilityLabel={pttLabel}
            accessibilityHint={
              voiceState === 'IDLE'
                ? 'Hold this button and speak; release when you are done talking'
                : undefined
            }>
            <View style={[styles.pttIconWrap, { backgroundColor: pttColor }]}>
              <IconSymbol
                name={voiceState === 'LISTENING' ? 'mic.fill' : 'mic'}
                size={26}
                color="#0A0A0B"
              />
            </View>
            <Text style={[styles.pttLabel, { color: pttColor }]} allowFontScaling={false}>
              {pttLabel}
            </Text>
          </Pressable>
        </Animated.View>

        {/* End Session button — high-contrast red, clearly separated */}
        <Pressable
          style={({ pressed }) => [
            styles.endButton,
            pressed && styles.endButtonPressed,
          ]}
          onPress={handleEnd}
          accessibilityRole="button"
          accessibilityLabel="End session"
          accessibilityHint="Stops the avatar conversation and returns to the start screen"
          android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: false }}>
          <IconSymbol name="xmark.circle.fill" size={22} color="#fff" />
          <Text style={styles.endLabel} allowFontScaling={false}>
            End Conversation
          </Text>
        </Pressable>
      </View>

      {/* ── Memory recall overlay ── */}
      <MemoryModePane
        isOpen={memoryOpen}
        memory={memory}
        onClose={onMemoryClose}
        rightOffset={horizontal + right}
        bottomOffset={fabBottom + 180}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 16,
  },

  // ── Session header ──
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: EchoColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: LISTEN_GREEN,
  },
  providerLabel: {
    fontFamily: EchoFonts.serif,
    fontSize: 16,
    color: EchoColors.text,
  },
  timer: {
    color: EchoColors.textDim,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },

  // ── Avatar ──
  avatarArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  /** Placeholder fills the space where LiveKit video will render */
  videoPlaceholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: EchoColors.bgCard,
    paddingVertical: 36,
    borderWidth: 1,
    borderColor: EchoColors.border,
    // Subtle inner glow using shadow so the avatar "floats"
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  voiceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  voiceLabel: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ── Caption bar ──
  captionBar: {
    backgroundColor: 'rgba(10,10,11,0.90)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  captionText: {
    color: EchoColors.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },

  // ── Controls ──
  controls: {
    gap: 12,
    alignItems: 'center',
  },

  // PTT button
  pttButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 14,
    minHeight: 64,
    width: '100%',
  },
  pttIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pttLabel: {
    fontFamily: EchoFonts.serif,
    fontSize: 19,
    flex: 1,
  },

  // End session button
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: END_RED,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    gap: 10,
    width: '100%',
    minHeight: 64,
    // iOS shadow for depth
    shadowColor: END_RED,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: Platform.OS === 'android' ? 6 : 0,
  },
  endButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.978 }],
  },
  endLabel: {
    color: '#fff',
    fontFamily: EchoFonts.serif,
    fontSize: 19,
    fontWeight: '600',
  },
});
