import 'react-native-reanimated';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/components/RootNavigator';
import { AuthProvider } from '@/providers/AuthProvider';
import { JournalSyncProvider } from '@/providers/JournalSyncProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
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
