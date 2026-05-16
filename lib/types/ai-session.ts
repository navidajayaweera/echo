// Mirrors supabase/functions/_shared/providers/types.ts — keep in sync.

import type { PersonaTraits } from '@/lib/types/database';

export type AIProviderName = 'beyond_presence' | 'openai' | 'gemini';

export const AI_PROVIDER_LABELS: Record<AIProviderName, string> = {
  beyond_presence: 'Beyond Presence',
  openai: 'OpenAI',
  gemini: 'Gemini',
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StartSessionRequest {
  provider: AIProviderName;
  messages?: ChatMessage[];
  persona_overrides?: Partial<PersonaTraits>;
  context?: string;
}

// ── Responses ────────────────────────────────────────────────────────────────

export interface LiveKitCreds {
  token: string;
  wsUrl: string;
  roomName: string;
}

export interface BeyondPresenceResult {
  provider: 'beyond_presence';
  livekit: LiveKitCreds;
  sessionId: string;
  agentId?: string;
}

export interface LLMResult {
  provider: 'openai' | 'gemini';
  message: string;
  model: string;
  sessionId: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export type StartSessionResult = BeyondPresenceResult | LLMResult;

export interface SessionError {
  error: string;
}
