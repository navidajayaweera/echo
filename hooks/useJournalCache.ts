import { useCallback, useEffect, useState } from 'react';

import {
  getJournalEntries,
  removeJournalEntry,
  upsertJournalEntry,
} from '@/lib/journal-storage';
import type { JournalCacheEntry } from '@/lib/types/database';

function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function useJournalCache() {
  const [entries, setEntries] = useState<JournalCacheEntry[]>([]);

  const refresh = useCallback(async () => {
    const loaded = await getJournalEntries();
    setEntries(loaded);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (input: {
      title?: string;
      body: string;
      keywords?: string[];
      memoryYear?: number;
    }) => {
      const now = new Date().toISOString();
      const entry: JournalCacheEntry = {
        localId: generateLocalId(),
        title: input.title,
        body: input.body,
        keywords: input.keywords,
        memoryYear: input.memoryYear,
        pendingSync: true,
        createdAt: now,
        updatedAt: now,
      };
      await upsertJournalEntry(entry);
      await refresh();
      return entry;
    },
    [refresh]
  );

  const updateEntry = useCallback(
    async (
      localId: string,
      input: Partial<Pick<JournalCacheEntry, 'title' | 'body' | 'keywords' | 'memoryYear'>>
    ) => {
      const all = await getJournalEntries();
      const existing = all.find((e) => e.localId === localId);
      if (!existing) return;

      const updated: JournalCacheEntry = {
        ...existing,
        ...input,
        pendingSync: true,
        updatedAt: new Date().toISOString(),
      };
      await upsertJournalEntry(updated);
      await refresh();
    },
    [refresh]
  );

  const deleteEntry = useCallback(
    async (localId: string) => {
      await removeJournalEntry(localId);
      await refresh();
    },
    [refresh]
  );

  return {
    entries,
    refresh,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
