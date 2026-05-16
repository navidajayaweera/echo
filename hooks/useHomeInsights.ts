import { useCallback, useEffect, useState } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { JournalCacheEntry } from '@/lib/types/database';
import { useAuth } from '@/providers/AuthProvider';
import { useSessionStore } from '@/stores/session.store';

/** Consecutive days the user has made at least one journal entry */
function computeStreak(entries: JournalCacheEntry[]): number {
  if (entries.length === 0) return 0;

  const daySet = new Set(entries.map((e) => e.createdAt.slice(0, 10)));
  let streak = 0;
  const d = new Date();

  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function relativeLabel(isoOrNull: string | null): string {
  if (!isoOrNull) return 'Never';
  const diff = Date.now() - new Date(isoOrNull).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export function useHomeInsights(entries: JournalCacheEntry[]) {
  const { user } = useAuth();
  const sessionId = useSessionStore((s) => s.sessionId);
  const [vaultCount, setVaultCount] = useState(0);
  const [lastSessionAt, setLastSessionAt] = useState<string | null>(null);

  const fetchVaultAndSession = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    const supabase = getSupabase();

    const [vaultRes, sessionRes] = await Promise.all([
      supabase
        .from('media_vault')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('echo_sessions')
        .select('started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (vaultRes.count != null) setVaultCount(vaultRes.count);
    if (sessionRes.data?.started_at) setLastSessionAt(sessionRes.data.started_at);
  }, [user]);

  useEffect(() => {
    fetchVaultAndSession();
  }, [fetchVaultAndSession, sessionId]);

  return {
    journalCount: entries.length,
    vaultCount,
    streakDays: computeStreak(entries),
    lastSessionLabel: relativeLabel(lastSessionAt),
  };
}
