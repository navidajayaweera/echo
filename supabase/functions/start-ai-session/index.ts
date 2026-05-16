import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { embedQueryText } from '../_shared/gemini-embeddings.ts';
import { createAdminClient, verifyUser } from '../_shared/supabase-admin.ts';
import { buildSystemPrompt } from '../_shared/build-system-prompt.ts';
import { BeyondPresenceProvider } from '../_shared/providers/beyond-presence.ts';
import { GeminiProvider } from '../_shared/providers/gemini.ts';
import { OpenAIProvider } from '../_shared/providers/openai.ts';
import type {
  AIProvider,
  ChatMessage,
  ProviderName,
  StartSessionRequest,
} from '../_shared/providers/types.ts';

// ── Provider registry — add new providers here only ──────────────────────────
const PROVIDERS: Record<ProviderName, AIProvider> = {
  beyond_presence: new BeyondPresenceProvider(),
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
};

type PromptMemory = {
  title: string | null;
  body: string;
  memory_year: number | null;
  created_at: string;
};

function getMemoryQuery(messages: ChatMessage[] | undefined): string {
  if (!messages || messages.length === 0) {
    return 'important personal memories and life experiences';
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user' && messages[i].content.trim()) {
      return messages[i].content.trim();
    }
  }

  return 'important personal memories and life experiences';
}

async function loadRecentMemories(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<PromptMemory[]> {
  const { data: memories } = await supabase
    .from('journals')
    .select('title, body, memory_year, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return (memories ?? []) as PromptMemory[];
}

async function loadSemanticMemories(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  queryText: string,
): Promise<PromptMemory[]> {
  const embedding = await embedQueryText(queryText);

  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: JSON.stringify(embedding),
    match_user_id: userId,
    match_count: 8,
    match_threshold: 0.72,
  });

  if (error) {
    throw new Error(`match_memories RPC failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  return (data as Array<{ chunk_text: string; memory_year: number | null }>).map((item) => ({
    title: null,
    body: item.chunk_text,
    memory_year: item.memory_year,
    created_at: now,
  }));
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. Auth
    const user = await verifyUser(req.headers.get('Authorization'));

    // 2. Parse body
    const body: StartSessionRequest = await req.json();
    const { provider: providerName, messages, persona_overrides } = body;

    if (!providerName || !(providerName in PROVIDERS)) {
      return json({ error: `Unknown provider "${providerName}". Valid: ${Object.keys(PROVIDERS).join(', ')}` }, 400);
    }

    // 3. Load profile + memory context for system prompt
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, persona_traits')
      .eq('id', user.id)
      .maybeSingle();

    const queryText = getMemoryQuery(messages);
    let memories: PromptMemory[] = [];

    try {
      const semanticMemories = await loadSemanticMemories(supabase, user.id, queryText);
      memories = semanticMemories.length > 0
        ? semanticMemories
        : await loadRecentMemories(supabase, user.id);
    } catch (err) {
      console.warn('[start-ai-session] semantic memory lookup failed, using recency fallback:', err);
      memories = await loadRecentMemories(supabase, user.id);
    }

    const personaTraits = {
      humor: 50, warmth: 70, wisdom: 60, verbosity: 40, formality: 30,
      ...(profile?.persona_traits ?? {}),
      ...(persona_overrides ?? {}),
    };

    const systemPrompt = buildSystemPrompt(
      profile?.display_name ?? null,
      personaTraits,
      memories,
    );

    // 4. Delegate to provider
    const provider = PROVIDERS[providerName];
    const result = await provider.run(body, systemPrompt);

    // 5. Log session (best-effort, non-blocking)
    if (providerName === 'beyond_presence' && 'livekit' in result) {
      supabase
        .from('echo_sessions')
        .insert({
          user_id: user.id,
          livekit_room: result.livekit.roomName,
          bp_session_id: result.sessionId,
        })
        .then(() => {});
    }

    return json(result, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return json({ error: message }, status);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
