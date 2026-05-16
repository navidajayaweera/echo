import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

async function invokeEdgeFunction(
  functionName: string,
  body: Record<string, string>,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    const hint =
      functionName === 'embed-memory' &&
      (error.message.includes('non-2xx') ||
        error.message.includes('memory_embeddings') ||
        error.message.includes('is_embedded'))
        ? ' (often fixed by applying Supabase migration 009 / ensure_media_vault_embedding_schema)'
        : '';
    console.warn(`[avatar-feed] ${functionName} failed:`, error.message + hint);
  }
}

/** Vectorize a journal and push updated knowledge to the user's avatar agent. */
export async function feedJournalToAvatar(journalId: string): Promise<void> {
  await invokeEdgeFunction('embed-journal', { journal_id: journalId });
}

/** Vectorize a media vault memory and push updated knowledge to the avatar agent. */
export async function feedMemoryToAvatar(mediaId: string): Promise<void> {
  await invokeEdgeFunction('embed-memory', { media_id: mediaId });
}

/** Rebuild avatar prompt from all embedded journals + memories (no new embed). */
export async function refreshAvatarKnowledge(): Promise<void> {
  await invokeEdgeFunction('refresh-avatar-knowledge', {});
}
