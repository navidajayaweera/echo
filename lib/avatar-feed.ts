import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

async function invokeEdgeFunction(
  functionName: string,
  body: Record<string, string>,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const supabase = getSupabase();
  // #region agent log
  fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d7c109'},body:JSON.stringify({sessionId:'d7c109',runId:'upload-train-1',hypothesisId:'A',location:'lib/avatar-feed.ts:invokeEdgeFunction:start',message:'Invoking edge function for embedding/refresh',data:{functionName,bodyKeys:Object.keys(body)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const { error } = await supabase.functions.invoke(functionName, { body });
  // #region agent log
  fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d7c109'},body:JSON.stringify({sessionId:'d7c109',runId:'upload-train-1',hypothesisId:'A',location:'lib/avatar-feed.ts:invokeEdgeFunction:result',message:'Edge function invoke completed',data:{functionName,hasError:Boolean(error),errorMessage:error?.message??null,errorName:error?.name??null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

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

/** Rebuild avatar prompt and create/update the Bey managed agent. */
export async function refreshAvatarKnowledge(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('refresh-avatar-knowledge', {
    body: {},
  });

  if (error) {
    console.warn('[avatar-feed] refresh-avatar-knowledge failed:', error.message);
    throw new Error(error.message);
  }

  const payload = data as { agent_id?: string | null; error?: string } | null;
  if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
    throw new Error(String(payload.error));
  }

  return payload?.agent_id ?? null;
}
