export interface PersonaTraits {
  humor: number;
  warmth: number;
  wisdom: number;
  verbosity: number;
  formality: number;
}

export const DEFAULT_PERSONA_TRAITS: PersonaTraits = {
  humor: 50,
  warmth: 70,
  wisdom: 60,
  verbosity: 40,
  formality: 30,
};

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  persona_traits: PersonaTraits;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface JournalRow {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  mood_tag: string | null;
  keywords: string[];
  memory_year: number | null;
  local_id: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

export interface JournalCacheEntry {
  localId: string;
  title?: string;
  body: string;
  keywords?: string[];
  memoryYear?: number;
  pendingSync: boolean;
  remoteId?: string;
  createdAt: string;
  updatedAt: string;
}
