import * as Network from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { pullRemoteJournals, syncPendingJournals } from '@/lib/journal-sync';
import { useAuth } from '@/providers/AuthProvider';

export function useJournalSync(onSynced?: () => void): {
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncError: string | null;
  runSync: (options?: { pull?: boolean }) => Promise<void>;
} {
  const { user, isConfigured } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasPulledRef = useRef(false);
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  const runSync = useCallback(
    async (options?: { pull?: boolean }) => {
      if (!user || !isConfigured) return;

      setIsSyncing(true);
      setSyncError(null);

      try {
        if (options?.pull || !hasPulledRef.current) {
          await pullRemoteJournals(user.id);
          hasPulledRef.current = true;
        }
        await syncPendingJournals(user.id);
        setLastSyncAt(new Date().toISOString());
        onSyncedRef.current?.();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        setSyncError(message);
        console.warn('[useJournalSync]', message);
      } finally {
        setIsSyncing(false);
      }
    },
    [user, isConfigured]
  );

  useEffect(() => {
    if (!user || !isConfigured) return;
    hasPulledRef.current = false;
    runSync({ pull: true });
  }, [user?.id, isConfigured]);

  useEffect(() => {
    if (!user || !isConfigured) return;

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        runSync();
      }
    });

    const networkSub = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        runSync();
      }
    });

    return () => {
      sub.remove();
      networkSub.remove();
    };
  }, [user?.id, isConfigured, runSync]);

  return {
    isSyncing,
    lastSyncAt,
    syncError,
    runSync,
  };
}
