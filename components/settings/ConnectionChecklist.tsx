import { StyleSheet, Text, View } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

interface CheckItem {
  label: string;
  status: 'ok' | 'warn' | 'pending';
  detail?: string;
}

export function ConnectionChecklist({ items }: { items: CheckItem[] }) {
  return (
    <View style={styles.card}>
      {items.map((item, i) => (
        <View
          key={item.label}
          style={[styles.row, i < items.length - 1 && styles.rowBorder]}>
          <Text style={styles.label}>{item.label}</Text>
          <Text
            style={[
              styles.status,
              item.status === 'ok' && styles.ok,
              item.status === 'warn' && styles.warn,
              item.status === 'pending' && styles.pending,
            ]}
            numberOfLines={2}>
            {item.detail ?? (item.status === 'ok' ? 'Connected' : 'Pending')}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: EchoColors.border,
  },
  label: {
    color: EchoColors.text,
    fontSize: 16,
    flex: 1,
  },
  status: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  ok: {
    color: EchoColors.success,
  },
  warn: {
    color: EchoColors.accentWarm,
  },
  pending: {
    color: EchoColors.textMuted,
  },
});
