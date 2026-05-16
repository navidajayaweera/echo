import { StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

interface StatCardProps {
  value: string;
  label: string;
  icon: string;
  accent?: boolean;
}

function StatCard({ value, label, icon, accent }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.value, accent && styles.accentValue]}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

interface InsightGridProps {
  journalCount: number;
  vaultCount: number;
  streakDays: number;
  lastSessionLabel: string;
}

export function InsightGrid({
  journalCount,
  vaultCount,
  streakDays,
  lastSessionLabel,
}: InsightGridProps) {
  return (
    <View style={styles.grid}>
      <StatCard value={String(journalCount)} label="Journal entries" icon="📓" />
      <StatCard value={String(vaultCount)} label="Vault memories" icon="🖼" />
      <StatCard
        value={streakDays > 0 ? `${streakDays}d` : '—'}
        label="Active streak"
        icon="🔥"
        accent={streakDays > 2}
      />
      <StatCard value={lastSessionLabel} label="Last Echo session" icon="🎙" />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  card: {
    width: '48.5%',
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: EchoColors.border,
    gap: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  value: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  accentValue: {
    color: EchoColors.accentWarm,
  },
  label: {
    color: EchoColors.textDim,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
