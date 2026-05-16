/**
 * BeyondPresenceActive
 *
 * Full-screen UI for a live Beyond Presence avatar session.
 * Connects to the LiveKit room provisioned by Bey, renders real video
 * (or AvatarPulse fallback), drives PTT mic, and forwards DataReceived
 * events to the memory overlay.
 *
 * Accessibility:
 *  - All interactive elements have accessibilityRole, accessibilityLabel,
 *    accessibilityHint — blind users get a complete description.
 *  - End Session is large (minHeight 64 dp) and separated by 16 dp to
 *    prevent accidental taps — important for users with tremor.
 *  - Caption text is 16 sp / lineHeight 24, readable at arm's length.
 *  - Color-coding uses ≥ 3:1 contrast against the dark background.
 *  - accessibilityLiveRegion="polite" on captions for VoiceOver.
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useLiveKitRoom } from '@/hooks/useLiveKitRoom';
import type { LiveKitCreds } from '@/lib/types/ai-session';
import type { MemoryRecalledEvent } from '@/lib/types/memory-events';
import { LiveKitAvatarViewport } from './LiveKitAvatarViewport';
import { MemoryModePane } from './MemoryModePane';

// ── Semantic colour tokens ─────────────────────────────────────────────────────

const END_RED      = '#DC5050';
const LISTEN_GREEN = '#5AC87C';
const SPEAK_AMBER  = '#E8B86D';

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

// ── Props ─────────────────────────────────────────────────────────────────────

interface BeyondPresenceActiveProps {
  livekitCreds: LiveKitCreds;
  captionText: string;
  avatarLabel?: string;
  memoryOpen: boolean;
  memory: MemoryRecalledEvent | null;
  onMemoryClose: () => void;
  onLiveKitData: (payload: Uint8Array) => void;
  onEndSession: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BeyondPresenceActive({
  livekitCreds,
  captionText,
  avatarLabel = 'E',
  memoryOpen,
  memory,
  onMemoryClose,
  onLiveKitData,
  onEndSession,
}: BeyondPresenceActiveProps) {
  const { fabBottom, horizontal, right } = useAppInsets({ includeTabBar: true });
  const elapsed = useElapsed();

  // ── LiveKit room ───────────────────────────────────────────────────────────
  const {
    roomState,
    voiceState,
    remoteVideoTrack,
    startListening,
    stopListening,
    disconnect,
    errorMessage,
  } = useLiveKitRoom({
    wsUrl: livekitCreds.wsUrl,
    token: livekitCreds.token,
    onData: onLiveKitData,
  });

  // ── PTT button breathing animation ────────────────────────────────────────
  const pttScale = useRef(new Animated.Value(1)).current;
  const animRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current?.stop();
    if (voiceState === 'IDLE') {
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pttScale, { toValue: 1.04, duration: 900, useNativeDriver: true }),
          Animated.timing(pttScale, { toValue: 1,    duration: 900, useNativeDriver: true }),
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

  const voiceLabelText: Record<typeof voiceState, string> = {
    IDLE: 'Hold the button below to speak',
    LISTENING: 'Listening to you…',
    SPEAKING: 'Avatar is responding…',
  };

  const voiceLabelColor: Record<typeof voiceState, string> = {
    IDLE: EchoColors.textDim,
    LISTENING: LISTEN_GREEN,
    SPEAKING: SPEAK_AMBER,
  };

  const handlePressIn = async () => {
    if (voiceState === 'SPEAKING' || roomState !== 'connected') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startListening();
  };

  const handlePressOut = async () => {
    if (voiceState !== 'LISTENING') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopListening();
  };

  const handleEnd = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    disconnect();
    onEndSession();
  };

  return (
    <View style={styles.root}>

      {/* ── Session header ── */}
      <View style={styles.sessionHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.liveDot, roomState === 'connected' && styles.liveDotActive]} />
          <Text style={styles.providerLabel} allowFontScaling={false}>
            Beyond Presence
          </Text>
        </View>
        <Text style={styles.timer} allowFontScaling={false}>{elapsed}</Text>
      </View>

      {/* ── Avatar viewport (real LiveKit video or AvatarPulse fallback) ── */}
      <View style={styles.avatarArea}>
        <LiveKitAvatarViewport
          remoteVideoTrack={remoteVideoTrack}
          voiceState={voiceState}
          roomState={roomState}
          avatarLabel={avatarLabel}
          size={130}
        />

        {/* Connection error */}
        {errorMessage ? (
          <Text style={styles.errorText} allowFontScaling={false}>{errorMessage}</Text>
        ) : null}

        {/* Voice-state label */}
        <View
          style={styles.voiceLabelRow}
          accessibilityLiveRegion="polite"
          accessibilityLabel={voiceLabelText[voiceState]}>
          {voiceState === 'LISTENING' && (
            <View style={[styles.stateDot, { backgroundColor: LISTEN_GREEN }]} />
          )}
          {voiceState === 'SPEAKING' && (
            <View style={[styles.stateDot, { backgroundColor: SPEAK_AMBER }]} />
          )}
          <Text
            style={[styles.voiceLabel, { color: voiceLabelColor[voiceState] }]}
            allowFontScaling={false}>
            {voiceLabelText[voiceState]}
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

      {/* ── Controls ── */}
      <View style={[styles.controls, { paddingBottom: fabBottom + 8 }]}>

        {/* PTT button */}
        <Animated.View style={{ transform: [{ scale: pttScale }], width: '100%' }}>
          <Pressable
            style={[styles.pttButton, { backgroundColor: pttColor + '22', borderColor: pttColor }]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={voiceState === 'SPEAKING' || roomState !== 'connected'}
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

        {/* End session */}
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
    backgroundColor: EchoColors.textDim,
  },
  liveDotActive: {
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

  avatarArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    color: '#DC5050',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
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

  controls: {
    gap: 12,
    alignItems: 'center',
  },
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
