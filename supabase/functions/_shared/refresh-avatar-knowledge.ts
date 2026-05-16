import { upsertBeyondPresenceAgent } from './beyond-presence-agent.ts';
import { buildSystemPrompt } from './build-system-prompt.ts';
import { loadRecentMemories, resolveMemoriesForPrompt } from './load-prompt-memories.ts';
import type { PersonaTraits } from './providers/types.ts';
import { createAdminClient } from './supabase-admin.ts';

type AdminClient = ReturnType<typeof createAdminClient>;

const DEFAULT_TRAITS: PersonaTraits = {
  humor: 50,
  warmth: 85,
  wisdom: 70,
  verbosity: 35,
  formality: 25,
};

/**
 * Rebuilds the avatar's system prompt from all indexed memories and pushes it
 * to the user's Beyond Presence agent (create or PATCH).
 */
export async function refreshAvatarKnowledge(
  supabase: AdminClient,
  userId: string,
): Promise<{ agentId: string | null; memoryCount: number }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, persona_traits, bp_agent_id, bp_avatar_id')
    .eq('id', userId)
    .maybeSingle();

  const personaTraits: PersonaTraits = {
    ...DEFAULT_TRAITS,
    ...(profile?.persona_traits ?? {}),
  };

  let memories = await resolveMemoriesForPrompt(
    supabase,
    userId,
    'important life memories names places family stories photos journals',
  );

  if (memories.length < 4) {
    const recent = await loadRecentMemories(supabase, userId, 16);
    const seen = new Set(memories.map((m) => `${m.source_type}:${m.source_id}`));
    for (const item of recent) {
      const key = `${item.source_type}:${item.source_id}`;
      if (!seen.has(key)) {
        memories.push(item);
        seen.add(key);
      }
    }
  }

  const systemPrompt = buildSystemPrompt(
    profile?.display_name ?? null,
    personaTraits,
    memories,
  );

  const bpApiKey = Deno.env.get('BEY_API_KEY') ?? Deno.env.get('BEYOND_PRESENCE_API_KEY');
  let agentId: string | null = profile?.bp_agent_id ?? null;

  if (bpApiKey) {
    try {
      agentId = await upsertBeyondPresenceAgent(
        bpApiKey,
        systemPrompt,
        profile?.bp_agent_id,
        { profileAvatarId: profile?.bp_avatar_id ?? null },
      );

      await supabase
        .from('profiles')
        .update({
          bp_agent_id: agentId,
          avatar_knowledge_updated_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('[refresh-avatar-knowledge] BP agent update failed:', err);
      if (!profile?.bp_agent_id) {
        throw err instanceof Error ? err : new Error(String(err));
      }
      agentId = profile.bp_agent_id;
      await supabase
        .from('profiles')
        .update({ avatar_knowledge_updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  } else if (!agentId) {
    throw new Error(
      'BEY_API_KEY is not configured on the server. Run: npx supabase secrets set BEY_API_KEY=<your_key>',
    );
  } else {
    await supabase
      .from('profiles')
      .update({ avatar_knowledge_updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  return { agentId, memoryCount: memories.length };
}
