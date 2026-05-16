import { useEffect } from 'react';

import { usePersonaStore } from '@/stores/persona.store';

export function usePersona() {
  const hydrate = usePersonaStore((s) => s.hydrate);
  const isHydrated = usePersonaStore((s) => s.isHydrated);
  const personas = usePersonaStore((s) => s.personas);
  const selectedPersonaId = usePersonaStore((s) => s.selectedPersonaId);
  const selectPersona = usePersonaStore((s) => s.selectPersona);
  const addPersona = usePersonaStore((s) => s.addPersona);
  const updatePersona = usePersonaStore((s) => s.updatePersona);
  const getSelectedPersona = usePersonaStore((s) => s.getSelectedPersona);

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId) ?? null;

  return {
    personas,
    selectedPersona,
    selectedPersonaId,
    selectPersona,
    addPersona,
    updatePersona,
    isHydrated,
  };
}
