import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createAdminClient, verifyUser } from '../_shared/supabase-admin.ts';
import { buildSystemPrompt } from '../_shared/build-system-prompt.ts';
import { resolveMemoriesForPrompt } from '../_shared/load-prompt-memories.ts';
import { refreshAvatarKnowledge } from '../_shared/refresh-avatar-knowledge.ts';
import { BeyondPresenceProvider } from '../_shared/providers/beyond-presence.ts';
import { GeminiProvider } from '../_shared/providers/gemini.ts';
import { OpenAIProvider } from '../_shared/providers/openai.ts';
import type {
  AIProvider,
  ChatMessage,
  ProviderName,
  StartSessionRequest,
} from '../_shared/providers/types.ts';

const PROVIDERS: Record<ProviderName, AIProvider> = {
  beyond_presence: new BeyondPresenceProvider(),
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
};

function getMemoryQuery(messages: ChatMessage[] | undefined): string {
  if (!messages || messages.length === 0) {
    return 'important personal memories family names places stories to help remember';
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user' && messages[i].content.trim()) {
      return messages[i].content.trim();
    }
  }

  return 'important personal memories family names places stories to help remember';
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const user = await verifyUser(req.headers.get('Authorization'));

    const body: StartSessionRequest = await req.json();
    const { provider: providerName, messages, persona_overrides, context } = body;

    if (!providerName || !(providerName in PROVIDERS)) {
      return json({
        error: `Unknown provider "${providerName}". Valid: ${Object.keys(PROVIDERS).join(', ')}`,
      }, 400);
    }

    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, persona_traits, bp_agent_id, bp_avatar_id')
      .eq('id', user.id)
      .maybeSingle();

    const queryText = getMemoryQuery(messages);
    const memories = await resolveMemoriesForPrompt(supabase, user.id, queryText);

    const personaTraits = {
      humor: 50,
      warmth: 85,
      wisdom: 70,
      verbosity: 35,
      formality: 25,
      ...(profile?.persona_traits ?? {}),
      ...(persona_overrides ?? {}),
    };

    const systemPrompt = buildSystemPrompt(
      profile?.display_name ?? null,
      personaTraits,
      memories,
      context,
    );

    // Ensure a managed Bey agent exists before starting a live call (embed may have failed earlier).
    let bpAgentId = profile?.bp_agent_id ?? null;
    if (providerName === 'beyond_presence') {
      const hasAvatar =
        Boolean(profile?.bp_avatar_id?.trim()) ||
        Boolean(Deno.env.get('BEY_DEFAULT_AVATAR_ID')?.trim());
      if (!hasAvatar) {
        throw new Error(
          'Link an Echo avatar in Settings → Beyond Presence → Load avatars, then pick one with status Ready.',
        );
      }

      const refresh = await refreshAvatarKnowledge(supabase, user.id);
      bpAgentId = refresh.agentId ?? bpAgentId;

      if (!bpAgentId) {
        const { data: refreshed } = await supabase
          .from('profiles')
          .select('bp_agent_id')
          .eq('id', user.id)
          .maybeSingle();
        bpAgentId = refreshed?.bp_agent_id ?? null;
      }

      if (!bpAgentId) {
        throw new Error(
          'Could not create your Beyond Presence agent. Confirm BEY_API_KEY is set on Supabase (npx supabase secrets set BEY_API_KEY=...) and redeploy edge functions.',
        );
      }
    }

    const provider = PROVIDERS[providerName];
    const result = await provider.run(body, systemPrompt, {
      bpAgentId,
    });

    if (providerName === 'beyond_presence' && 'agentId' in result && result.agentId) {
      supabase
        .from('profiles')
        .update({ bp_agent_id: result.agentId })
        .eq('id', user.id)
        .then(() => {});
    }

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
