import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';
import type { RoomConnectionState } from '@/lib/livekit-room-types';
import { AvatarPulse } from './AvatarPulse';
import type { AvatarVoiceState } from './AvatarPulse';

export interface LiveKitAvatarViewportProps {
  remoteVideoTrack: unknown | null;
  voiceState: AvatarVoiceState;
  roomState: RoomConnectionState;
  avatarLabel?: string;
  size?: number;
  videoSlot?: ReactNode;
}

const STATUS_LABEL: Partial<Record<RoomConnectionState, string>> = {
  connecting: 'Connecting…',
  error: 'Connection error',
  disconnected: 'Disconnected',
};

export function LiveKitAvatarViewportShared({
  remoteVideoTrack,
  voiceState,
  roomState,
  avatarLabel = 'E',
  size = 130,
  videoSlot,
}: LiveKitAvatarViewportProps) {
  const statusLabel = roomState === 'connected' ? 'Live' : (STATUS_LABEL[roomState] ?? '');
  const isLive = roomState === 'connected';

  return (
    <View style={styles.root}>
      {remoteVideoTrack && videoSlot ? (
        videoSlot
      ) : (
        <View style={styles.pulseWrap}>
          <AvatarPulse voiceState={voiceState} size={size} label={avatarLabel} />
        </View>
      )}

      <View style={[styles.badge, isLive ? styles.badgeLive : styles.badgeConnecting]}>
        {isLive && <View style={styles.liveDot} />}
        <Text style={styles.badgeText} allowFontScaling={false}>
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: EchoColors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  pulseWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 5,
  },
  badgeLive: {
    backgroundColor: 'rgba(90, 200, 124, 0.25)',
    borderWidth: 1,
    borderColor: '#5AC87C',
  },
  badgeConnecting: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5AC87C',
  },
  badgeText: {
    color: EchoColors.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
