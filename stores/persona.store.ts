import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { DEFAULT_PERSONA_TRAITS } from '@/lib/types/database';
import type { Persona, PersonaType } from '@/lib/types/persona';

const STORAGE_KEY = 'echo_personas_v1';
const SELECTED_KEY = 'echo_selected_persona_id';

const DEMO_PERSONAS: Persona[] = [
  {
    id: 'mom',
    name: 'Mom',
    relationship: 'Mother',
    description: 'Warm, caring, and gentle. Grounded in family memories.',
    personaType: 'loved_one',
    emotionalProfile: 'Warm and caring',
    memoryCount: 1245,
    voiceStyle: 'calm',
    visibility: 'shared',
    sharedLabel: 'Shared with family',
    traits: { humor: 45, warmth: 95, wisdom: 80, verbosity: 55, formality: 25 },
    avatarColor: '#947dff',
    isDemo: true,
  },
  {
    id: 'grandpa',
    name: 'Grandpa',
    relationship: 'Grandfather',
    description: 'Wise storyteller with a calm, reflective presence.',
    personaType: 'loved_one',
    emotionalProfile: 'Wise and reflective',
    memoryCount: 892,
    voiceStyle: 'warm',
    visibility: 'private',
    traits: { humor: 60, warmth: 70, wisdom: 95, verbosity: 50, formality: 40 },
    avatarColor: '#ecc071',
    isDemo: true,
  },
  {
    id: 'younger-me',
    name: 'Younger Me',
    relationship: 'Self',
    description: 'Your past self — curious, hopeful, and full of stories.',
    personaType: 'self',
    emotionalProfile: 'Curious and hopeful',
    memoryCount: 318,
    voiceStyle: 'bright',
    visibility: 'private',
    traits: { humor: 75, warmth: 65, wisdom: 40, verbosity: 70, formality: 15 },
    avatarColor: '#67d5f0',
    isDemo: true,
  },
];

interface PersonaState {
  personas: Persona[];
  selectedPersonaId: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  selectPersona: (id: string | null) => Promise<void>;
  addPersona: (input: Omit<Persona, 'id' | 'memoryCount' | 'isDemo'>) => Promise<Persona>;
  updatePersona: (id: string, patch: Partial<Persona>) => Promise<void>;
  getSelectedPersona: () => Persona | null;
}

async function persistPersonas(personas: Persona[]) {
  const custom = personas.filter((p) => !p.isDemo);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

export const usePersonaStore = create<PersonaState>((set, get) => ({
  personas: DEMO_PERSONAS,
  selectedPersonaId: 'mom',
  isHydrated: false,

  hydrate: async () => {
    try {
      const [raw, selectedId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SELECTED_KEY),
      ]);
      const custom: Persona[] = raw ? JSON.parse(raw) : [];
      const personas = [...DEMO_PERSONAS, ...custom];
      const selectedPersonaId =
        selectedId && personas.some((p) => p.id === selectedId) ? selectedId : 'mom';
      set({ personas, selectedPersonaId, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  selectPersona: async (id) => {
    set({ selectedPersonaId: id });
    if (id) await AsyncStorage.setItem(SELECTED_KEY, id);
    else await AsyncStorage.removeItem(SELECTED_KEY);
  },

  addPersona: async (input) => {
    const persona: Persona = {
      ...input,
      id: `persona_${Date.now()}`,
      memoryCount: 0,
      traits: input.traits ?? DEFAULT_PERSONA_TRAITS,
    };
    const personas = [...get().personas, persona];
    set({ personas });
    await persistPersonas(personas);
    await get().selectPersona(persona.id);
    return persona;
  },

  updatePersona: async (id, patch) => {
    const personas = get().personas.map((p) => (p.id === id ? { ...p, ...patch } : p));
    set({ personas });
    await persistPersonas(personas);
  },

  getSelectedPersona: () => {
    const { personas, selectedPersonaId } = get();
    return personas.find((p) => p.id === selectedPersonaId) ?? null;
  },
}));
