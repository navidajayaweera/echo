import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { usePersona } from '@/hooks/usePersona';

export default function PersonaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { personas, selectPersona } = usePersona();
  const { contentBottom } = useAppInsets();

  const persona = personas.find((p) => p.id === id);

  if (!persona) {
    return (
      <ScreenContainer>
        <Text style={styles.missing}>Persona not found</Text>
      </ScreenContainer>
    );
  }

  const launchPresence = async () => {
    await selectPersona(persona.id);
    router.push('/(tabs)/presence');
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: contentBottom }} showsVerticalScrollIndicator={false}>
        <View style={[styles.avatar, { backgroundColor: persona.avatarColor }]}>
          <Text style={styles.avatarLetter}>{persona.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{persona.name}</Text>
        <Text style={styles.relationship}>{persona.relationship}</Text>
        <Text style={styles.profile}>"{persona.emotionalProfile}"</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardLabel}>Overview</Text>
          <Text style={styles.cardBody}>{persona.description}</Text>
          <Text style={styles.meta}>{persona.memoryCount.toLocaleString()} memories</Text>
          {persona.sharedLabel ? (
            <Text style={styles.shared}>{persona.sharedLabel}</Text>
          ) : null}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardLabel}>AI disclosure</Text>
          <Text style={styles.disclosure}>
            This is an AI representation built from preserved memories. It is not a living person.
          </Text>
        </GlassCard>

        <PrimaryButton label="Start Presence" onPress={launchPresence} />
        <PrimaryButton
          label="Back to Personas"
          onPress={() => router.back()}
          variant="outline"
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  missing: {
    color: EchoColors.error,
    fontSize: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  avatarLetter: {
    fontFamily: EchoFonts.serif,
    fontSize: 36,
    color: EchoColors.onPrimary,
  },
  name: {
    fontFamily: EchoFonts.serif,
    fontSize: 36,
    color: EchoColors.text,
    textAlign: 'center',
  },
  relationship: {
    color: EchoColors.tertiary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  profile: {
    color: EchoColors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    color: EchoColors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardBody: {
    color: EchoColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    color: EchoColors.textDim,
    fontSize: 13,
    marginTop: 12,
  },
  shared: {
    color: EchoColors.secondary,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  disclosure: {
    color: EchoColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
