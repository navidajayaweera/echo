import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { Persona } from '@/lib/types/persona';

interface PersonaCardProps {
  persona: Persona;
  selected?: boolean;
  onPress: () => void;
}

export function PersonaCard({ persona, selected, onPress }: PersonaCardProps) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard
        glow={selected}
        style={[styles.card, selected && styles.cardSelected]}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: persona.avatarColor }]}>
            <Text style={styles.avatarLetter}>{persona.name.charAt(0)}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>{persona.name}</Text>
            <Text style={styles.relationship}>{persona.relationship}</Text>
            <Text style={styles.profile} numberOfLines={1}>
              "{persona.emotionalProfile}"
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{persona.memoryCount.toLocaleString()} memories</Text>
              {persona.sharedLabel ? (
                <Text style={styles.shared}>{persona.sharedLabel}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
  },
  cardSelected: {
    borderColor: EchoColors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: EchoFonts.serif,
    fontSize: 24,
    color: EchoColors.onPrimary,
    fontWeight: '500',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: EchoFonts.serif,
    fontSize: 22,
    color: EchoColors.text,
  },
  relationship: {
    color: EchoColors.tertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profile: {
    color: EchoColors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  meta: {
    color: EchoColors.textDim,
    fontSize: 12,
  },
  shared: {
    color: EchoColors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
