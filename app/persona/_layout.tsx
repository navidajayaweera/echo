import { Stack } from 'expo-router';

import { EchoColors } from '@/constants/echo-theme';

export default function PersonaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: EchoColors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
