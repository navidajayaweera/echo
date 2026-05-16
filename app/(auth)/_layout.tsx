import { Stack } from 'expo-router';

import { EchoColors } from '@/constants/echo-theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: EchoColors.bg },
        animation: 'fade',
      }}
    />
  );
}
