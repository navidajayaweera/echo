import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  LIVEKIT_DEV_BUILD_MESSAGE,
  type AvatarVoiceState,
  type RemoteVideoTrackRef,
  type RoomConnectionState,
  type UseLiveKitRoomOptions,
  type UseLiveKitRoomResult,
} from '@/lib/livekit-room-types';

export type { AvatarVoiceState, RoomConnectionState } from '@/lib/livekit-room-types';

const isExpoGo = Constants.appOwnership === 'expo';

export function useLiveKitRoom({
  wsUrl,
  token,
  onData,
}: UseLiveKitRoomOptions): UseLiveKitRoomResult {
  // #region agent log
  fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7c109' },
    body: JSON.stringify({
      sessionId: 'd7c109',
      location: 'hooks/useLiveKitRoom.native.ts',
      message: 'useLiveKitRoom entry',
      data: { isExpoGo, hasCreds: Boolean(wsUrl && token) },
      timestamp: Date.now(),
      hypothesisId: 'B',
    }),
  }).catch(() => {});
  // #endregion

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomRef = useRef<any>(null);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const [roomState, setRoomState] = useState<RoomConnectionState>('idle');
  const [voiceState, setVoiceState] = useState<AvatarVoiceState>('IDLE');
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteVideoTrackRef | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setRoomState('disconnected');
    setVoiceState('IDLE');
    setRemoteVideoTrack(null);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (!wsUrl || !token) return;

    if (isExpoGo) {
      setRoomState('error');
      setErrorMessage(LIVEKIT_DEV_BUILD_MESSAGE);
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const lk = require('@livekit/react-native') as typeof import('@livekit/react-native');
    const { ConnectionState, Room, RoomEvent, Track } = lk;

    const room = new Room();
    roomRef.current = room;

    setRoomState('connecting');
    setErrorMessage(null);

    room.on(RoomEvent.Connected, () => {
      if (!cancelled) setRoomState('connected');
    });

    room.on(RoomEvent.Disconnected, () => {
      if (!cancelled) {
        setRoomState('disconnected');
        setVoiceState('IDLE');
        setRemoteVideoTrack(null);
      }
    });

    room.on(RoomEvent.ConnectionStateChanged, (state: typeof ConnectionState) => {
      if (!cancelled && state === ConnectionState.Reconnecting) {
        setRoomState('connecting');
      }
    });

    room.on(RoomEvent.TrackSubscribed, (track: typeof Track) => {
      if (!cancelled && track.kind === Track.Kind.Video) {
        setRemoteVideoTrack(track);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: typeof Track) => {
      if (!cancelled && track.kind === Track.Kind.Video) {
        setRemoteVideoTrack(null);
      }
    });

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers: { isLocal: boolean }[]) => {
      if (cancelled) return;
      const remoteIsSpeaking = speakers.some((s) => !s.isLocal);
      if (remoteIsSpeaking) {
        setVoiceState((prev) => (prev !== 'LISTENING' ? 'SPEAKING' : prev));
      } else {
        setVoiceState((prev) => (prev === 'SPEAKING' ? 'IDLE' : prev));
      }
    });

    room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      onDataRef.current?.(payload);
    });

    room.on(RoomEvent.MediaDevicesError, (err: Error) => {
      if (!cancelled) setErrorMessage(`Microphone error: ${err.message}`);
    });

    room
      .connect(wsUrl, token, { autoSubscribe: true })
      .catch((err: Error) => {
        if (!cancelled) {
          setRoomState('error');
          setErrorMessage(err.message ?? 'Could not connect to avatar session');
        }
      });

    return () => {
      cancelled = true;
      room.removeAllListeners();
      room.disconnect();
    };
  }, [wsUrl, token]);

  const startListening = useCallback(async () => {
    if (isExpoGo) return;
    const room = roomRef.current;
    if (!room || roomState !== 'connected') return;
    try {
      await room.localParticipant.setMicrophoneEnabled(true);
      setVoiceState('LISTENING');
    } catch (err) {
      setErrorMessage(
        `Could not enable microphone: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [roomState]);

  const stopListening = useCallback(async () => {
    if (isExpoGo) return;
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(false);
      setVoiceState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
    } catch (err) {
      setErrorMessage(
        `Could not disable microphone: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, []);

  return {
    roomState,
    voiceState,
    remoteVideoTrack,
    startListening,
    stopListening,
    disconnect,
    errorMessage,
  };
}
