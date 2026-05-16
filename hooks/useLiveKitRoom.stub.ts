import { useCallback, useEffect, useState } from 'react';

import {
  LIVEKIT_DEV_BUILD_MESSAGE,
  type AvatarVoiceState,
  type RoomConnectionState,
  type UseLiveKitRoomOptions,
  type UseLiveKitRoomResult,
} from '@/lib/livekit-room-types';

export function useLiveKitRoomStub({
  wsUrl,
  token,
}: UseLiveKitRoomOptions): UseLiveKitRoomResult {
  const [roomState, setRoomState] = useState<RoomConnectionState>('idle');
  const [voiceState, setVoiceState] = useState<AvatarVoiceState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!wsUrl || !token) return;
    setRoomState('error');
    setErrorMessage(LIVEKIT_DEV_BUILD_MESSAGE);
  }, [wsUrl, token]);

  const disconnect = useCallback(() => {
    setRoomState('disconnected');
    setVoiceState('IDLE');
    setErrorMessage(null);
  }, []);

  const startListening = useCallback(async () => {}, []);
  const stopListening = useCallback(async () => {}, []);

  return {
    roomState,
    voiceState,
    remoteVideoTrack: null,
    startListening,
    stopListening,
    disconnect,
    errorMessage,
  };
}
