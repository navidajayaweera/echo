import AsyncStorage from '@react-native-async-storage/async-storage';

import type { JournalCacheEntry } from '@/lib/types/database';

const JOURNAL_ENTRIES_KEY = 'journal_entries';

export async function getJournalEntries(): Promise<JournalCacheEntry[]> {
  const raw = await AsyncStorage.getItem(JOURNAL_ENTRIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as JournalCacheEntry[];
  } catch {
    return [];
  }
}

export async function setJournalEntries(entries: JournalCacheEntry[]): Promise<void> {
  await AsyncStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
}

export async function upsertJournalEntry(entry: JournalCacheEntry): Promise<void> {
  const entries = await getJournalEntries();
  const index = entries.findIndex((e) => e.localId === entry.localId);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.unshift(entry);
  }
  await setJournalEntries(entries);
}

export async function removeJournalEntry(localId: string): Promise<void> {
  const entries = (await getJournalEntries()).filter((e) => e.localId !== localId);
  await setJournalEntries(entries);
}

export async function clearJournalEntries(): Promise<void> {
  await AsyncStorage.removeItem(JOURNAL_ENTRIES_KEY);
}
