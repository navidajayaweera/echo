import { StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingPanel({ displayName }: { displayName: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.greeting}>{getGreeting()},</Text>
      <Text style={styles.name}>{displayName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 32,
    marginTop: 16,
  },
  greeting: {
    color: EchoColors.textMuted,
    fontSize: 18,
    fontWeight: '300',
  },
  name: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginTop: 4,
  },
});
