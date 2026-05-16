import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EchoTextInput } from '@/components/ui/EchoTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { DEFAULT_PERSONA_TRAITS } from '@/lib/types/database';
import type { PersonaType } from '@/lib/types/persona';
import { PERSONA_TYPE_LABELS } from '@/lib/types/persona';
import { usePersona } from '@/hooks/usePersona';

const TYPES: PersonaType[] = ['self', 'loved_one', 'future_self', 'recovery', 'historical', 'custom'];
const AVATAR_COLORS = ['#947dff', '#ecc071', '#67d5f0', '#cabeff', '#ffb4ab'];

export default function NewPersonaScreen() {
  const router = useRouter();
  const { addPersona } = usePersona();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [description, setDescription] = useState('');
  const [personaType, setPersonaType] = useState<PersonaType>('loved_one');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await addPersona({
        name: name.trim(),
        relationship: relationship.trim() || PERSONA_TYPE_LABELS[personaType],
        description: description.trim() || 'A memory-grounded AI persona.',
        personaType,
        emotionalProfile: 'Grounded and warm',
        voiceStyle: 'calm',
        visibility: 'private',
        traits: DEFAULT_PERSONA_TRAITS,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      });
      router.replace('/(tabs)/personas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>New Persona</Text>
        <Text style={styles.sub}>Preserve a new identity</Text>

        <EchoTextInput placeholder="Name" value={name} onChangeText={setName} />
        <EchoTextInput
          placeholder="Relationship (e.g. Mother, Self)"
          value={relationship}
          onChangeText={setRelationship}
        />
        <EchoTextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Persona type</Text>
        <View style={styles.typeGrid}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, personaType === t && styles.typeChipActive]}
              onPress={() => setPersonaType(t)}>
              <Text
                style={[
                  styles.typeChipText,
                  personaType === t && styles.typeChipTextActive,
                ]}>
                {PERSONA_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton label="Create Persona" onPress={handleCreate} loading={loading} />
        <PrimaryButton label="Cancel" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: EchoFonts.serif,
    fontSize: 32,
    color: EchoColors.text,
    marginTop: 8,
  },
  sub: {
    color: EchoColors.textMuted,
    marginBottom: 24,
  },
  label: {
    color: EchoColors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginVertical: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  typeChipActive: {
    backgroundColor: EchoColors.primary,
    borderColor: EchoColors.primary,
  },
  typeChipText: {
    color: EchoColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: EchoColors.onPrimary,
  },
});
