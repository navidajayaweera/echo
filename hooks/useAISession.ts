import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { callAISession } from '@/lib/ai-session';
import type {
  AIProviderName,
  BeyondPresenceResult,
  ChatMessage,
  LiveKitCreds,
  LLMResult,
  StartSessionResult,
} from '@/lib/types/ai-session';
import type { AvatarVoiceState } from '@/components/presence/AvatarPulse';

const PROVIDER_STORAGE_KEY = 'echo_ai_provider';
const DEFAULT_PROVIDER: AIProviderName = 'openai';

// ── Session state machine ─────────────────────────────────────────────────────

type IdleState = { status: 'idle' };
type ConnectingState = { status: 'connecting' };
type LLMActiveState = {
  status: 'active';
  provider: 'openai' | 'gemini';
  sessionId: string;
};
type BPActiveState = {
  status: 'active';
  provider: 'beyond_presence';
  sessionId: string;
  livekit: LiveKitCreds;
};
type ErrorState = { status: 'error'; message: string };

type SessionState = IdleState | ConnectingState | LLMActiveState | BPActiveState | ErrorState;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAISession() {
  const [state, setState] = useState<SessionState>({ status: 'idle' });
  const [provider, setProviderState] = useState<AIProviderName>(DEFAULT_PROVIDER);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Avatar voice state (Beyond Presence only) ─────────────────────────────
  // Drives the AvatarPulse rings and PTT button appearance.
  // IDLE     → session connected, avatar waiting
  // LISTENING → user holding PTT, LiveKit microphone active
  // SPEAKING  → avatar responding (simulated until LiveKit RN data events wire up)
  const [avatarVoiceState, setAvatarVoiceState] = useState<AvatarVoiceState>('IDLE');
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist provider preference
  useEffect(() => {
    AsyncStorage.getItem(PROVIDER_STORAGE_KEY).then((stored) => {
      if (stored && (stored === 'beyond_presence' || stored === 'openai' || stored === 'gemini')) {
        setProviderState(stored as AIProviderName);
      }
    });
  }, []);

  const setProvider = useCallback((next: AIProviderName) => {
    setProviderState(next);
    AsyncStorage.setItem(PROVIDER_STORAGE_KEY, next);
    // Reset session on provider change
    setState({ status: 'idle' });
    setMessages([]);
  }, []);

  // ── Start / init ──────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    if (state.status === 'connecting') return;

    abortRef.current?.abort();
    setState({ status: 'connecting' });
    setMessages([]);

    try {
      const result: StartSessionResult = await callAISession({
        provider,
        messages: [],
      });

      if (result.provider === 'beyond_presence') {
        const bp = result as BeyondPresenceResult;
        setState({
          status: 'active',
          provider: 'beyond_presence',
          sessionId: bp.sessionId,
          livekit: bp.livekit,
        });
      } else {
        const llm = result as LLMResult;
        // Add the initial greeting as the first assistant message
        const greeting: ChatMessage = { role: 'assistant', content: llm.message };
        setMessages([greeting]);
        setState({ status: 'active', provider: llm.provider, sessionId: llm.sessionId });
      }
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  }, [provider, state.status]);

  // ── Send a user message (LLM providers only) ──────────────────────────────

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;
      if (state.status !== 'active') return;
      if (state.provider === 'beyond_presence') return; // handled by LiveKit

      const userMsg: ChatMessage = { role: 'user', content: userText.trim() };
      const nextMessages: ChatMessage[] = [...messages, userMsg];
      setMessages(nextMessages);
      setIsTyping(true);

      try {
        const result = await callAISession({
          provider,
          messages: nextMessages,
        });

        if ('message' in result) {
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: result.message,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (err) {
        const errMsg: ChatMessage = {
          role: 'assistant',
          content: `[Error: ${err instanceof Error ? err.message : 'Unknown error'}]`,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [state, provider, messages],
  );

  // ── Avatar voice state transitions (Beyond Presence) ─────────────────────

  /**
   * Call onPressIn of the PTT button.
   * Marks the microphone as active; the LiveKit SDK should un-mute the track here.
   */
  const startListening = useCallback(() => {
    if (state.status !== 'active' || state.provider !== 'beyond_presence') return;
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    setAvatarVoiceState('LISTENING');
  }, [state]);

  /**
   * Call onPressOut of the PTT button.
   * Simulates avatar processing + speaking for ~3 s, then returns to IDLE.
   * Replace the timeout body with a LiveKit DataReceived handler when wiring
   * real speech events.
   */
  const stopListening = useCallback(() => {
    if (avatarVoiceState !== 'LISTENING') return;
    setAvatarVoiceState('SPEAKING');
    speakTimerRef.current = setTimeout(() => {
      setAvatarVoiceState('IDLE');
    }, 3200);
  }, [avatarVoiceState]);

  // ── End session ───────────────────────────────────────────────────────────

  const endSession = useCallback(() => {
    abortRef.current?.abort();
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    setAvatarVoiceState('IDLE');
    setState({ status: 'idle' });
    setMessages([]);
    setIsTyping(false);
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────

  const livekitCreds =
    state.status === 'active' && state.provider === 'beyond_presence'
      ? (state as BPActiveState).livekit
      : null;

  const latestAssistantMessage =
    messages.length > 0
      ? messages.filter((m) => m.role === 'assistant').at(-1)?.content ?? ''
      : '';

  return {
    state,
    provider,
    setProvider,
    messages,
    isTyping,
    livekitCreds,
    latestAssistantMessage,
    avatarVoiceState,
    startSession,
    sendMessage,
    endSession,
    startListening,
    stopListening,
  };
}
