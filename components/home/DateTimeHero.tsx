import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

function formatDate(date: Date): { day: string; dateStr: string; time: string } {
  const day = date.toLocaleDateString(undefined, { weekday: 'long' });
  const dateStr = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return { day, dateStr, time };
}

export function DateTimeHero() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { day, dateStr, time } = formatDate(now);

  return (
    <View style={styles.wrap}>
      <Text style={styles.day}>{day}</Text>
      <Text style={styles.date}>{dateStr}</Text>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  day: {
    color: EchoColors.accentWarm,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  date: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  time: {
    color: EchoColors.textMuted,
    fontSize: 20,
    fontWeight: '200',
    letterSpacing: 0.5,
  },
});
