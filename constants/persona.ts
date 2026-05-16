import type { PersonaTraits } from '@/lib/types/database';

export const PERSONA_TRAIT_LABELS: { key: keyof PersonaTraits; label: string }[] = [
  { key: 'humor', label: 'Humor' },
  { key: 'warmth', label: 'Warmth' },
  { key: 'wisdom', label: 'Wisdom' },
  { key: 'verbosity', label: 'Verbosity' },
  { key: 'formality', label: 'Formality' },
];
