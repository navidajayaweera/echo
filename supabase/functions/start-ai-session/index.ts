import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createAdminClient, verifyUser } from '../_shared/supabase-admin.ts';
import { buildSystemPrompt } from '../_shared/build-system-prompt.ts';
import { BeyondPresenceProvider } from '../_shared/providers/beyond-presence.ts';
import { GeminiProvider } from '../_shared/providers/gemini.ts';
import { OpenAIProvider } from '../_shared/providers/openai.ts';
import type {
  AIProvider,
  ProviderName,
  StartSessionRequest,
} from '../_shared/providers/types.ts';

// ── Provider registry — add new providers here only ──────────────────────────
const PROVIDERS: Record<ProviderName, AIProvider> = {
  beyond_presence: new BeyondPresenceProvider(),
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
};

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

    // 3. Load profile + recent journal memories for system prompt
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, persona_traits')
      .eq('id', user.id)
      .maybeSingle();

    const { data: memories } = await supabase
      .from('journals')
      .select('title, body, memory_year, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const personaTraits = {
      humor: 50, warmth: 70, wisdom: 60, verbosity: 40, formality: 30,
      ...(profile?.persona_traits ?? {}),
      ...(persona_overrides ?? {}),
    };

    const systemPrompt = buildSystemPrompt(
      profile?.display_name ?? null,
      personaTraits,
      memories ?? [],
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
