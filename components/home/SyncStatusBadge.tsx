import { StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

interface SyncStatusBadgeProps {
  isSyncing: boolean;
  lastSyncAt: string | null;
  avatarSynced: boolean;
}

export function SyncStatusBadge({
  isSyncing,
  lastSyncAt,
  avatarSynced,
}: SyncStatusBadgeProps) {
  const statusText = isSyncing
    ? 'Synchronizing…'
    : avatarSynced
      ? 'Avatar trained on your memories'
      : 'Avatar learning your memories…';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dot, avatarSynced ? styles.dotOk : styles.dotWarn]} />
        <Text style={styles.title}>Avatar sync</Text>
      </View>
      <Text style={styles.status}>{statusText}</Text>
      {lastSyncAt && !isSyncing && (
        <Text style={styles.time}>Last sync {new Date(lastSyncAt).toLocaleString()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: EchoColors.border,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotOk: {
    backgroundColor: EchoColors.success,
  },
  dotWarn: {
    backgroundColor: EchoColors.accentWarm,
  },
  title: {
    color: EchoColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  status: {
    color: EchoColors.text,
    fontSize: 15,
  },
  time: {
    color: EchoColors.textDim,
    fontSize: 13,
    marginTop: 6,
  },
});
