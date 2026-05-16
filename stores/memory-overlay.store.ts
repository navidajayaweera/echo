import { create } from 'zustand';

import type { MemoryRecalledEvent } from '@/lib/types/memory-events';

interface MemoryOverlayState {
  isOpen: boolean;
  memory: MemoryRecalledEvent | null;
  open: (memory: MemoryRecalledEvent) => void;
  close: () => void;
}

export const useMemoryOverlayStore = create<MemoryOverlayState>((set) => ({
  isOpen: false,
  memory: null,
  open: (memory) => set({ isOpen: true, memory }),
  close: () => set({ isOpen: false, memory: null }),
}));
