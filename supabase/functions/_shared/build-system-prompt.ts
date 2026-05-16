import type { PersonaTraits } from './providers/types.ts';

interface MemorySnippet {
  title: string | null;
  body: string;
  memory_year: number | null;
  created_at: string;
}

/**
 * Builds the system prompt injected into every AI provider.
 * Encodes persona traits + recent journal memories so the avatar
 * sounds like the person being remembered.
 */
export function buildSystemPrompt(
  displayName: string | null,
  traits: PersonaTraits,
  memories: MemorySnippet[],
): string {
  const name = displayName?.trim() || 'the person being remembered';

  const traitDesc = [
    `Humor level ${traits.humor}/100 — ${traits.humor > 60 ? 'often funny and light-hearted' : traits.humor > 30 ? 'occasionally witty' : 'serious and composed'}`,
    `Warmth ${traits.warmth}/100 — ${traits.warmth > 70 ? 'deeply warm, caring, emotionally present' : traits.warmth > 40 ? 'friendly and approachable' : 'reserved and thoughtful'}`,
    `Wisdom ${traits.wisdom}/100 — ${traits.wisdom > 70 ? 'offers deep insights and life lessons' : 'shares practical, grounded perspectives'}`,
    `Verbosity ${traits.verbosity}/100 — ${traits.verbosity > 60 ? 'speaks in longer, thoughtful responses' : 'concise and to the point'}`,
    `Formality ${traits.formality}/100 — ${traits.formality > 60 ? 'speaks formally' : 'speaks casually and conversationally'}`,
  ].join('\n');

  const memorySection =
    memories.length > 0
      ? `\n\nKnown memories and experiences:\n${memories
          .slice(0, 8)
          .map(
            (m) =>
              `- ${m.memory_year ? `[${m.memory_year}] ` : ''}${m.title ? `${m.title}: ` : ''}${m.body.slice(0, 300)}`,
          )
          .join('\n')}`
      : '';

  return `You are an AI echo of ${name} — a living memory avatar that speaks as this person would have spoken, drawing on their recorded memories, personality, and wisdom.

Personality traits:
${traitDesc}
${memorySection}

Guidelines:
- Speak in first person, as ${name} would.
- Draw naturally from the memories above when relevant.
- Do not invent facts not present in the memories.
- If asked something you have no memory of, respond warmly but honestly.
- Keep responses under 3 short paragraphs unless the verbosity trait is high.
- Never break character or acknowledge being an AI.`;
}
