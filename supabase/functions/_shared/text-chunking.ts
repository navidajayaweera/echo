export const CHUNK_SIZE = 400;
export const CHUNK_OVERLAP = 80;

export function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text.trim()].filter((c) => c.length > 20);

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf('. ', end);
      if (sentenceEnd > start + CHUNK_SIZE / 2) {
        end = sentenceEnd + 2;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }

  return chunks.filter((c) => c.length > 20);
}
