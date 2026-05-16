import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { refreshAvatarKnowledge } from '@/lib/avatar-feed';
import { callAISession } from '@/lib/ai-session';
import type {
  AIProviderName,
  BeyondPresenceResult,
  ChatMessage,
  LiveKitCreds,
  LLMResult,
  StartSessionResult,
} from '@/lib/types/ai-session';
import type { Persona } from '@/lib/types/persona';
import { useSessionStore } from '@/stores/session.store';

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

function buildPersonaContext(persona: Persona | null): string | undefined {
  if (!persona) return undefined;
  return [
    `You are an AI representation of ${persona.name} (${persona.relationship}).`,
    persona.description,
    `Emotional profile: ${persona.emotionalProfile}.`,
    'Always disclose that you are an AI built from preserved memories, not a living person.',
  ].join(' ');
}

export function useAISession(persona: Persona | null = null) {
  const [state, setState] = useState<SessionState>({ status: 'idle' });
  const [provider, setProviderState] = useState<AIProviderName>(DEFAULT_PROVIDER);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionStore = useSessionStore();

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
    setState({ status: 'idle' });
    setMessages([]);
  }, []);

  // ── Start / init ──────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    if (state.status === 'connecting') return;

    abortRef.current?.abort();
    setState({ status: 'connecting' });
    setMessages([]);
    sessionStore.setConnecting(provider);

    try {
      if (provider === 'beyond_presence') {
        // #region agent log
        fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d7c109'},body:JSON.stringify({sessionId:'d7c109',runId:'upload-train-1',hypothesisId:'D',location:'hooks/useAISession.ts:startSession:refresh:start',message:'Calling refresh-avatar-knowledge before BP session',data:{provider},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        await refreshAvatarKnowledge();
        // #region agent log
        fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d7c109'},body:JSON.stringify({sessionId:'d7c109',runId:'upload-train-1',hypothesisId:'D',location:'hooks/useAISession.ts:startSession:refresh:done',message:'refresh-avatar-knowledge completed before BP session',data:{provider},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }

      const result: StartSessionResult = await callAISession({
        provider,
        messages: [],
        context: buildPersonaContext(persona),
        persona_overrides: persona?.traits,
      });

      if (result.provider === 'beyond_presence') {
        const bp = result as BeyondPresenceResult;
        setState({
          status: 'active',
          provider: 'beyond_presence',
          sessionId: bp.sessionId,
          livekit: bp.livekit,
        });
        sessionStore.setConnected(bp.sessionId, bp.livekit);
      } else {
        const llm = result as LLMResult;
        const greeting: ChatMessage = { role: 'assistant', content: llm.message };
        setMessages([greeting]);
        setState({ status: 'active', provider: llm.provider, sessionId: llm.sessionId });
        sessionStore.setConnected(llm.sessionId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      // #region agent log
      fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d7c109'},body:JSON.stringify({sessionId:'d7c109',runId:'upload-train-1',hypothesisId:'E',location:'hooks/useAISession.ts:startSession:catch',message:'Session start failed',data:{provider,errorMessage:message},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setState({ status: 'error', message });
      sessionStore.setError(message);
    }
  }, [provider, state.status, persona, sessionStore]);

  // ── Send a user message (LLM providers only) ──────────────────────────────

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;
      if (state.status !== 'active') return;
      if (state.provider === 'beyond_presence') return;

      const userMsg: ChatMessage = { role: 'user', content: userText.trim() };
      const nextMessages: ChatMessage[] = [...messages, userMsg];
      setMessages(nextMessages);
      setIsTyping(true);

      try {
        const result = await callAISession({
          provider,
          messages: nextMessages,
          context: buildPersonaContext(persona),
          persona_overrides: persona?.traits,
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
    [state, provider, messages, persona],
  );

  const endSession = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: 'idle' });
    setMessages([]);
    setIsTyping(false);
    sessionStore.setDisconnected();
  }, [sessionStore]);

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
    startSession,
    sendMessage,
    endSession,
  };
}
