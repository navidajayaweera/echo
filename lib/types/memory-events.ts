/** Shape emitted by Beyond Presence / LiveKit data channel when the avatar recalls a memory. */
export interface MemoryRecalledEvent {
  type: 'memory.recalled';
  journalId?: string;
  mediaId?: string;
  title: string;
  snippet: string;
  memoryYear?: number;
  thumbnailUrl?: string;
}

export function isMemoryRecalledEvent(data: unknown): data is MemoryRecalledEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as MemoryRecalledEvent).type === 'memory.recalled'
  );
}
