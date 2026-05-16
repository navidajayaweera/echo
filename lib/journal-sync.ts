import {
  getJournalEntries,
  setJournalEntries,
  upsertJournalEntry,
} from '@/lib/journal-storage';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { JournalCacheEntry, JournalRow } from '@/lib/types/database';

async function triggerJournalEmbedding(journalId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke('embed-journal', {
    body: { journal_id: journalId },
  });

  if (error) {
    // Keep sync resilient: journal content should still sync even if embedding fails.
    console.warn('[journal-sync] embed-journal failed:', journalId, error.message);
  }
}

function rowToCacheEntry(row: JournalRow): JournalCacheEntry {
  return {
    localId: row.local_id ?? row.id,
    title: row.title ?? undefined,
    body: row.body,
    keywords: row.keywords?.length ? row.keywords : undefined,
    memoryYear: row.memory_year ?? undefined,
    moodTag: row.mood_tag ?? undefined,
    pendingSync: false,
    remoteId: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mergeEntries(
  local: JournalCacheEntry[],
  remote: JournalCacheEntry[]
): JournalCacheEntry[] {
  const byLocalId = new Map<string, JournalCacheEntry>();

  for (const entry of local) {
    byLocalId.set(entry.localId, entry);
  }

  for (const remoteEntry of remote) {
    const existing = byLocalId.get(remoteEntry.localId);
    if (!existing) {
      byLocalId.set(remoteEntry.localId, remoteEntry);
      continue;
    }
    const existingTime = new Date(existing.updatedAt).getTime();
    const remoteTime = new Date(remoteEntry.updatedAt).getTime();
    if (remoteTime >= existingTime) {
      byLocalId.set(remoteEntry.localId, {
        ...remoteEntry,
        pendingSync: existing.pendingSync && !remoteEntry.remoteId,
      });
    }
  }

  return Array.from(byLocalId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function pullRemoteJournals(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const remoteEntries = (data ?? []).map((row) =>
    rowToCacheEntry(row as JournalRow)
  );
  const local = await getJournalEntries();
  const merged = mergeEntries(local, remoteEntries);
  await setJournalEntries(merged);
}

export async function syncPendingJournals(userId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const supabase = getSupabase();
  const pending = (await getJournalEntries()).filter((e) => e.pendingSync);
  let syncedCount = 0;

  for (const entry of pending) {
    const { data, error } = await supabase
      .from('journals')
      .upsert(
        {
          local_id: entry.localId,
          user_id: userId,
          title: entry.title ?? null,
          body: entry.body,
          keywords: entry.keywords ?? [],
          memory_year: entry.memoryYear ?? null,
          mood_tag: entry.moodTag ?? null,
          sync_status: 'synced',
          updated_at: entry.updatedAt,
        },
        { onConflict: 'local_id' }
      )
      .select('id, updated_at')
      .single();

    if (error) {
      console.warn('[journal-sync] upsert failed:', entry.localId, error.message);
      continue;
    }

    await upsertJournalEntry({
      ...entry,
      pendingSync: false,
      remoteId: data.id,
      updatedAt: data.updated_at ?? entry.updatedAt,
    });

    // Back-link any media_vault rows that were uploaded before the journal ID was known
    if (entry.mediaVaultIds?.length && data.id) {
      await supabase
        .from('media_vault')
        .update({ journal_id: data.id })
        .in('id', entry.mediaVaultIds);
    }

    syncedCount += 1;
  }

  return syncedCount;
}

export async function syncUnembeddedJournals(userId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('journals')
    .select('id')
    .eq('user_id', userId)
    .eq('is_embedded', false)
    .order('updated_at', { ascending: false })
    .limit(25);

  if (error) {
    console.warn('[journal-sync] list unembedded journals failed:', error.message);
    return 0;
  }

  const unembedded = data ?? [];
  for (const row of unembedded) {
    await triggerJournalEmbedding(row.id);
  }

  return unembedded.length;
}
