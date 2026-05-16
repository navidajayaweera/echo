import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

interface QuickActionsProps {
  onNewJournal: () => void;
}

export function QuickActions({ onNewJournal }: QuickActionsProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {/* Primary: Talk to Echo */}
      <Pressable
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        onPress={() => router.push('/presence')}
        accessibilityRole="button"
        accessibilityLabel="Talk to Echo AI">
        <Text style={styles.primaryIcon}>🎙</Text>
        <View style={styles.primaryText}>
          <Text style={styles.primaryLabel}>Talk to Echo</Text>
          <Text style={styles.primaryHint}>Start an AI session</Text>
        </View>
        <Text style={styles.primaryArrow}>›</Text>
      </Pressable>

      {/* Secondary row */}
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={onNewJournal}
          accessibilityRole="button"
          accessibilityLabel="Write a new journal entry">
          <Text style={styles.secondaryIcon}>📝</Text>
          <Text style={styles.secondaryLabel}>New Journal</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => router.push('/timeline')}
          accessibilityRole="button"
          accessibilityLabel="Add a memory to the vault">
          <Text style={styles.secondaryIcon}>📷</Text>
          <Text style={styles.secondaryLabel}>Add Memory</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
    gap: 8,
  },
  pressed: {
    opacity: 0.75,
  },
  primary: {
    backgroundColor: EchoColors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryIcon: {
    fontSize: 24,
  },
  primaryText: {
    flex: 1,
  },
  primaryLabel: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.bg,
    fontSize: 19,
    fontWeight: '400',
  },
  primaryHint: {
    color: 'rgba(10,10,11,0.5)',
    fontSize: 12,
    marginTop: 1,
  },
  primaryArrow: {
    color: 'rgba(10,10,11,0.4)',
    fontSize: 22,
    fontWeight: '300',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  secondary: {
    flex: 1,
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: EchoColors.border,
    gap: 6,
  },
  secondaryIcon: {
    fontSize: 24,
  },
  secondaryLabel: {
    color: EchoColors.text,
    fontSize: 14,
    fontWeight: '500',
  },
});
