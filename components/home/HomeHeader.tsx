import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

function getGreeting(hour: number): { text: string; emoji: string } {
  if (hour < 5) return { text: 'Good night', emoji: '🌙' };
  if (hour < 12) return { text: 'Good morning', emoji: '🌤' };
  if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
  return { text: 'Good evening', emoji: '🌆' };
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface HomeHeaderProps {
  displayName: string;
}

export function HomeHeader({ displayName }: HomeHeaderProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { text: greetText, emoji } = getGreeting(now.getHours());

  return (
    <View style={styles.wrap}>
      {/* Top row: greeting label + clock */}
      <View style={styles.topRow}>
        <Text style={styles.greeting}>
          {emoji}  {greetText}
        </Text>
        <Text style={styles.clock}>{formatClock(now)}</Text>
      </View>

      {/* Name — large and personal */}
      <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
        {displayName}
      </Text>

      {/* Date sub-label */}
      <Text style={styles.date}>{formatDate(now)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    color: EchoColors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  clock: {
    color: EchoColors.accentWarm,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 38,
    fontWeight: '300',
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  date: {
    color: EchoColors.textDim,
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
