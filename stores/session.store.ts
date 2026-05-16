import { create } from 'zustand';

import type { AIProviderName, LiveKitCreds } from '@/lib/types/ai-session';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

interface TranscriptLine {
  id: string;
  speaker: 'user' | 'avatar';
  text: string;
  timestamp: number;
}

interface SessionState {
  sessionId: string | null;
  provider: AIProviderName | null;
  connectionStatus: ConnectionStatus;
  livekit: LiveKitCreds | null;
  transcript: TranscriptLine[];
  errorMessage: string | null;

  // Actions
  setConnecting: (provider: AIProviderName) => void;
  setConnected: (sessionId: string, livekit?: LiveKitCreds) => void;
  setError: (message: string) => void;
  setDisconnected: () => void;
  appendTranscript: (line: Omit<TranscriptLine, 'id' | 'timestamp'>) => void;
  clearTranscript: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  provider: null,
  connectionStatus: 'idle',
  livekit: null,
  transcript: [],
  errorMessage: null,

  setConnecting: (provider) =>
    set({ connectionStatus: 'connecting', provider, errorMessage: null }),

  setConnected: (sessionId, livekit) =>
    set({ connectionStatus: 'connected', sessionId, livekit: livekit ?? null }),

  setError: (errorMessage) =>
    set({ connectionStatus: 'error', errorMessage }),

  setDisconnected: () =>
    set({
      connectionStatus: 'disconnected',
      sessionId: null,
      livekit: null,
    }),

  appendTranscript: (line) =>
    set((s) => ({
      transcript: [
        ...s.transcript,
        { ...line, id: Math.random().toString(36).slice(2), timestamp: Date.now() },
      ],
    })),

  clearTranscript: () => set({ transcript: [] }),
}));
