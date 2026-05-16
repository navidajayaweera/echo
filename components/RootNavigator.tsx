import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { EchoColors } from '@/constants/echo-theme';
import { useAuth } from '@/providers/AuthProvider';

const EchoDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: EchoColors.bg,
    card: EchoColors.bgElevated,
    text: EchoColors.text,
    border: EchoColors.border,
    primary: EchoColors.accent,
  },
};

export function RootNavigator() {
  const { session, isLoading, isConfigured } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, isConfigured, router]);

  return (
    <ThemeProvider value={EchoDarkTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: EchoColors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
