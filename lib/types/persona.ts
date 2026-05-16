import type { PersonaTraits } from '@/lib/types/database';

export type PersonaType =
  | 'self'
  | 'loved_one'
  | 'future_self'
  | 'recovery'
  | 'historical'
  | 'custom';

export interface Persona {
  id: string;
  name: string;
  relationship: string;
  description: string;
  personaType: PersonaType;
  emotionalProfile: string;
  memoryCount: number;
  voiceStyle: string;
  visibility: 'private' | 'shared' | 'public';
  sharedLabel?: string;
  traits: PersonaTraits;
  avatarColor: string;
  isDemo?: boolean;
}

export const PERSONA_TYPE_LABELS: Record<PersonaType, string> = {
  self: 'Self Persona',
  loved_one: 'Loved One',
  future_self: 'Future Self',
  recovery: 'Memory Recovery',
  historical: 'Historical Family',
  custom: 'Custom Persona',
};
