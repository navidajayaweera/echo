import 'react-native-reanimated';
import '@/lib/livekit-setup';

import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/components/RootNavigator';
import { AuthProvider } from '@/providers/AuthProvider';
import { JournalSyncProvider } from '@/providers/JournalSyncProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7c109' },
      body: JSON.stringify({
        sessionId: 'd7c109',
        location: 'app/_layout.tsx',
        message: 'RootLayout mounted',
        data: {},
        timestamp: Date.now(),
        hypothesisId: 'E',
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <JournalSyncProvider>
          <RootNavigator />
        </JournalSyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
