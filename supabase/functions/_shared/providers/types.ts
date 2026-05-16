/** All AI providers the platform supports. Adding a new one is just implementing AIProvider. */
export type ProviderName = 'beyond_presence' | 'openai' | 'gemini';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── Request ──────────────────────────────────────────────────────────────────

export interface PersonaTraits {
  humor: number;
  warmth: number;
  wisdom: number;
  verbosity: number;
  formality: number;
}

export interface StartSessionRequest {
  provider: ProviderName;
  /** For LLM providers: full conversation so far */
  messages?: ChatMessage[];
  /** For Beyond Presence: optional persona overrides */
  persona_overrides?: Partial<PersonaTraits>;
  /** Optional free-text context injected into the system prompt */
  context?: string;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface LiveKitCreds {
  token: string;
  wsUrl: string;
  roomName: string;
}

export interface BeyondPresenceSessionResult {
  provider: 'beyond_presence';
  livekit: LiveKitCreds;
  sessionId: string;
  agentId?: string;
}

export interface LLMSessionResult {
  provider: 'openai' | 'gemini';
  message: string;
  model: string;
  sessionId: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export type StartSessionResult = BeyondPresenceSessionResult | LLMSessionResult;

// ── Provider interface ────────────────────────────────────────────────────────

export interface ProviderRunOptions {
  /** Persistent Beyond Presence agent trained on the user's memories */
  bpAgentId?: string | null;
}

export interface AIProvider {
  readonly name: ProviderName;
  run(
    req: StartSessionRequest,
    systemPrompt: string,
    options?: ProviderRunOptions,
  ): Promise<StartSessionResult>;
}
