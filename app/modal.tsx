import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

/**
 * Generic modal screen — used for memory detail, full-screen image view, etc.
 * Extended with actual content when a specific route navigates here.
 */
export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Echo Memory</Text>
      <Text style={styles.body}>
        Tap a memory from the Timeline or Presence panel to view details here.
      </Text>
      <Pressable style={styles.dismissBtn} onPress={() => router.back()}>
        <Text style={styles.dismissText}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EchoColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    fontFamily: EchoFonts.serif,
    fontSize: 28,
    color: EchoColors.text,
  },
  body: {
    color: EchoColors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  dismissBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: EchoColors.bgElevated,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  dismissText: {
    color: EchoColors.text,
    fontWeight: '600',
  },
});
