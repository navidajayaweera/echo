import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useJournalCache } from '@/hooks/useJournalCache';
import { useJournalSyncContext } from '@/providers/JournalSyncProvider';
import { useAuth } from '@/providers/AuthProvider';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, isConfigured } = useAuth();
  const { entries, refresh } = useJournalCache();
  const { isSyncing, lastSyncAt } = useJournalSyncContext();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const name = profile?.display_name?.trim() || 'Friend';
  const pendingCount = entries.filter((e) => e.pendingSync).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.greeting}>{getGreeting()},</Text>
      <Text style={styles.name}>{name}</Text>

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{entries.length}</Text>
          <Text style={styles.statLabel}>Memories saved</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending sync</Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Sync status</Text>
        <Text style={styles.statusText}>
          {!isConfigured
            ? 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env'
            : isSyncing
              ? 'Syncing with Supabase…'
              : lastSyncAt
                ? `Last synced ${new Date(lastSyncAt).toLocaleString()}`
                : 'Ready to sync'}
        </Text>
      </View>

      <View style={styles.ctaPlaceholder}>
        <Text style={styles.ctaText}>Begin Echo Session</Text>
        <Text style={styles.ctaHint}>Presence tab coming in a later sprint</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    paddingHorizontal: 24,
  },
  greeting: {
    color: '#8B8884',
    fontSize: 18,
    fontWeight: '300',
  },
  name: {
    color: '#F4F2EF',
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 32,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#141416',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#232326',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#F4F2EF',
    fontSize: 32,
    fontWeight: '300',
  },
  statLabel: {
    color: '#6B6966',
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#232326',
    marginHorizontal: 16,
  },
  statusCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#232326',
    marginBottom: 24,
  },
  statusTitle: {
    color: '#8B8884',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statusText: {
    color: '#F4F2EF',
    fontSize: 15,
    lineHeight: 22,
  },
  ctaPlaceholder: {
    backgroundColor: '#E8E6E3',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    opacity: 0.7,
  },
  ctaText: {
    color: '#0A0A0B',
    fontSize: 17,
    fontWeight: '600',
  },
  ctaHint: {
    color: '#4A4845',
    fontSize: 12,
    marginTop: 4,
  },
});
