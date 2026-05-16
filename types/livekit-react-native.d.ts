declare module '@livekit/react-native' {
  export function registerGlobals(): void;

  export const ConnectionState: Record<string, string>;
  export const RoomEvent: Record<string, string>;
  export const Track: {
    Source: Record<string, string>;
    Kind: Record<string, string>;
  };

  export class Room {
    constructor();
    on(event: string, listener: (...args: unknown[]) => void): void;
    connect(url: string, token: string, options?: unknown): Promise<void>;
    disconnect(): void;
    localParticipant: {
      setMicrophoneEnabled(enabled: boolean): Promise<void>;
    };
  }

  export function VideoView(props: {
    style?: unknown;
    videoTrack: unknown;
    objectFit?: string;
  }): unknown;
}
