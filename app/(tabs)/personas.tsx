import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PersonaCard } from '@/components/personas/PersonaCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { usePersona } from '@/hooks/usePersona';

export default function PersonasScreen() {
  const router = useRouter();
  const { personas, selectedPersonaId, selectPersona } = usePersona();
  const { contentBottom } = useAppInsets({ includeTabBar: true });

  const handleSelect = useCallback(
    async (id: string) => {
      await selectPersona(id);
      router.push(`/persona/${id}`);
    },
    [selectPersona, router]
  );

  return (
    <ScreenContainer includeTabBarPadding>
      <View style={styles.header}>
        <Text style={styles.title}>Personas</Text>
        <Text style={styles.subtitle}>Who are you talking to?</Text>
      </View>

      <FlatList
        data={personas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: contentBottom }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PersonaCard
            persona={item}
            selected={item.id === selectedPersonaId}
            onPress={() => handleSelect(item.id)}
          />
        )}
        ListFooterComponent={
          <Pressable onPress={() => router.push('/persona/new')}>
            <GlassCard style={styles.createCard}>
              <Text style={styles.createPlus}>+</Text>
              <Text style={styles.createLabel}>Create Persona</Text>
              <Text style={styles.createSub}>Preserve a new identity</Text>
            </GlassCard>
          </Pressable>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontFamily: EchoFonts.serif,
    fontSize: 36,
    color: EchoColors.text,
  },
  subtitle: {
    color: EchoColors.textMuted,
    fontSize: 15,
    marginTop: 4,
  },
  createCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    borderStyle: 'dashed',
  },
  createPlus: {
    fontSize: 32,
    color: EchoColors.primary,
    fontWeight: '300',
  },
  createLabel: {
    fontFamily: EchoFonts.serif,
    fontSize: 20,
    color: EchoColors.text,
    marginTop: 8,
  },
  createSub: {
    color: EchoColors.textDim,
    fontSize: 14,
    marginTop: 4,
  },
});
