export type RoomConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
export type AvatarVoiceState = 'IDLE' | 'LISTENING' | 'SPEAKING';

export interface UseLiveKitRoomOptions {
  wsUrl: string;
  token: string;
  onData?: (payload: Uint8Array) => void;
}

/** Opaque on web / Expo Go; native dev build uses LiveKit VideoTrack. */
export type RemoteVideoTrackRef = unknown;

export interface UseLiveKitRoomResult {
  roomState: RoomConnectionState;
  voiceState: AvatarVoiceState;
  remoteVideoTrack: RemoteVideoTrackRef | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  disconnect: () => void;
  errorMessage: string | null;
}

export const LIVEKIT_DEV_BUILD_MESSAGE =
  'Live avatar requires a development build (npx expo run:android or run:ios). Expo Go does not include WebRTC.';
