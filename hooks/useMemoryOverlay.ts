import { useCallback } from 'react';

import { isMemoryRecalledEvent } from '@/lib/types/memory-events';
import { useMemoryOverlayStore } from '@/stores/memory-overlay.store';

/**
 * Hook that provides handlers for the memory overlay panel.
 * Call `handleLiveKitData(bytes)` from a LiveKit DataReceived event listener
 * to automatically parse and display recalled memory events.
 */
export function useMemoryOverlay() {
  const { isOpen, memory, open, close } = useMemoryOverlayStore();

  const handleLiveKitData = useCallback(
    (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const event: unknown = JSON.parse(text);
        if (isMemoryRecalledEvent(event)) {
          open(event);
        }
      } catch {
        // ignore non-JSON payloads
      }
    },
    [open],
  );

  return { isOpen, memory, open, close, handleLiveKitData };
}
