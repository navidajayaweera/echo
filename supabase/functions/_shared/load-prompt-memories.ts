import { embedQueryText } from './gemini-embeddings.ts';
import { createAdminClient } from './supabase-admin.ts';
export type PromptMemory = {
  source_type: 'journal' | 'memory';
  source_id: string;
  title: string | null;
  body: string;
  memory_year: number | null;
};

type AdminClient = ReturnType<typeof createAdminClient>;

export async function loadRecentMemories(
  supabase: AdminClient,
  userId: string,
  limit = 12,
): Promise<PromptMemory[]> {
  const [journalsRes, mediaRes] = await Promise.all([
    supabase
      .from('journals')
      .select('id, title, body, memory_year')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('media_vault')
      .select('id, title, description, memory_year, media_type')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  ]);

  const journalMemories: PromptMemory[] = (journalsRes.data ?? []).map((row) => ({
    source_type: 'journal' as const,
    source_id: row.id,
    title: row.title,
    body: row.body,
    memory_year: row.memory_year,
  }));

  const mediaMemories: PromptMemory[] = (mediaRes.data ?? []).map((row) => ({
    source_type: 'memory' as const,
    source_id: row.id,
    title: row.title,
    body: [
      row.title,
      row.description,
      `[${row.media_type} memory]`,
    ].filter(Boolean).join('\n'),
    memory_year: row.memory_year,
  }));

  return [...journalMemories, ...mediaMemories].slice(0, limit);
}

export async function loadSemanticMemories(
  supabase: AdminClient,
  userId: string,
  queryText: string,
): Promise<PromptMemory[]> {
  const embedding = await embedQueryText(queryText);

  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: JSON.stringify(embedding),
    match_user_id: userId,
    match_count: 10,
    match_threshold: 0.68,
  });

  if (error) {
    throw new Error(`match_memories RPC failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as Array<{
    source_type: string;
    source_id: string;
    chunk_text: string;
    memory_year: number | null;
    title: string | null;
  }>).map((item) => ({
    source_type: item.source_type === 'memory' ? 'memory' : 'journal',
    source_id: item.source_id,
    title: item.title,
    body: item.chunk_text,
    memory_year: item.memory_year,
  }));
}

export async function resolveMemoriesForPrompt(
  supabase: AdminClient,
  userId: string,
  queryText: string,
): Promise<PromptMemory[]> {
  try {
    const semantic = await loadSemanticMemories(supabase, userId, queryText);
    if (semantic.length > 0) return semantic;
  } catch (err) {
    console.warn('[load-prompt-memories] semantic lookup failed:', err);
  }

  return loadRecentMemories(supabase, userId);
}
