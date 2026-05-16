import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useJournalSyncContext } from '@/providers/JournalSyncProvider';
import { DEFAULT_PERSONA_TRAITS, type PersonaTraits } from '@/lib/types/database';
import { useAuth } from '@/providers/AuthProvider';

function PersonaSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{Math.round(value)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%` }]} />
        <View style={styles.touchRow}>
          {[0, 25, 50, 75, 100].map((step) => (
            <Text
              key={step}
              style={styles.stepTouch}
              onPress={() => onChange(step)}>
              {' '}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.stepButtons}>
        <Text style={styles.stepBtn} onPress={() => onChange(Math.max(0, value - 10))}>
          −
        </Text>
        <Text style={styles.stepBtn} onPress={() => onChange(Math.min(100, value + 10))}>
          +
        </Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, isConfigured, updateProfile } = useAuth();
  const { isSyncing, lastSyncAt, syncError } = useJournalSyncContext();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [traits, setTraits] = useState<PersonaTraits>(
    profile?.persona_traits ?? DEFAULT_PERSONA_TRAITS
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setTraits({ ...DEFAULT_PERSONA_TRAITS, ...profile.persona_traits });
    }
  }, [profile]);

  const persistTraits = useCallback(
    (next: PersonaTraits) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await updateProfile({ persona_traits: next });
        } catch (err) {
          console.warn('[settings] persona sync failed:', err);
        }
      }, 500);
    },
    [updateProfile]
  );

  const handleTraitChange = (key: keyof PersonaTraits, value: number) => {
    const next = { ...traits, [key]: value };
    setTraits(next);
    persistTraits(next);
  };

  const handleDisplayNameBlur = async () => {
    if (!profile || displayName === (profile.display_name ?? '')) return;
    try {
      await updateProfile({ display_name: displayName.trim() || null });
    } catch (err) {
      console.warn('[settings] display name sync failed:', err);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor="#6B6966"
          value={displayName}
          onChangeText={setDisplayName}
          onEndEditing={handleDisplayNameBlur}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Persona</Text>
        <PersonaSlider
          label="Humor"
          value={traits.humor}
          onChange={(v) => handleTraitChange('humor', v)}
        />
        <PersonaSlider
          label="Warmth"
          value={traits.warmth}
          onChange={(v) => handleTraitChange('warmth', v)}
        />
        <PersonaSlider
          label="Wisdom"
          value={traits.wisdom}
          onChange={(v) => handleTraitChange('wisdom', v)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection</Text>
        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>Supabase</Text>
          <Text style={isConfigured ? styles.checkOk : styles.checkWarn}>
            {isConfigured ? 'Configured' : 'Add .env keys'}
          </Text>
        </View>
        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>Journal sync</Text>
          <Text style={syncError ? styles.checkWarn : styles.checkOk}>
            {isSyncing
              ? 'Syncing…'
              : syncError
                ? syncError
                : lastSyncAt
                  ? `OK · ${new Date(lastSyncAt).toLocaleTimeString()}`
                  : 'Waiting'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#F4F2EF',
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#8B8884',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#141416',
    borderRadius: 10,
    padding: 14,
    color: '#F4F2EF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#232326',
  },
  sliderRow: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    color: '#F4F2EF',
    fontSize: 16,
  },
  sliderValue: {
    color: '#8B8884',
    fontSize: 16,
  },
  track: {
    height: 6,
    backgroundColor: '#232326',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#E8E6E3',
    borderRadius: 3,
  },
  touchRow: {
    position: 'absolute',
    opacity: 0,
  },
  stepTouch: {
    flex: 1,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  },
  stepBtn: {
    color: '#E8E6E3',
    fontSize: 22,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232326',
  },
  checkLabel: {
    color: '#F4F2EF',
    fontSize: 16,
  },
  checkOk: {
    color: '#7DCEA0',
    fontSize: 14,
  },
  checkWarn: {
    color: '#E8B86D',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
});
