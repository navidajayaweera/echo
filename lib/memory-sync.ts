import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { feedMemoryToAvatar } from '@/lib/avatar-feed';

/** Embed vault memories that have not been vectorized yet (batch per sync). */
export async function syncUnembeddedMemories(userId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('media_vault')
    .select('id')
    .eq('user_id', userId)
    .eq('is_embedded', false)
    .order('updated_at', { ascending: false })
    .limit(25);

  if (error) {
    const needsMigration =
      error.code === '42703' || error.message.includes('is_embedded');
    console.warn(
      '[memory-sync] list unembedded memories failed:',
      error.message,
      needsMigration
        ? '— run pending Supabase migrations (npx supabase link && npx supabase db push, or apply supabase/migrations/009_memory_embeddings.sql in the SQL editor).'
        : '',
    );
    return 0;
  }

  const rows = data ?? [];
  for (const row of rows) {
    await feedMemoryToAvatar(row.id);
  }

  return rows.length;
}
