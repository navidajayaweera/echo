import React, { createContext, useContext } from 'react';

import { useJournalSync } from '@/hooks/useJournalSync';

type JournalSyncContextValue = ReturnType<typeof useJournalSync>;

const JournalSyncContext = createContext<JournalSyncContextValue | null>(null);

export function JournalSyncProvider({ children }: { children: React.ReactNode }) {
  const sync = useJournalSync();
  return (
    <JournalSyncContext.Provider value={sync}>{children}</JournalSyncContext.Provider>
  );
}

export function useJournalSyncContext() {
  const ctx = useContext(JournalSyncContext);
  if (!ctx) {
    throw new Error('useJournalSyncContext must be used within JournalSyncProvider');
  }
  return ctx;
}
