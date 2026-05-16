import type {
  AIProvider,
  ChatMessage,
  LLMSessionResult,
  StartSessionRequest,
} from './types.ts';

const DEFAULT_MODEL = 'gemini-1.5-flash';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;

  async run(req: StartSessionRequest, systemPrompt: string): Promise<LLMSessionResult> {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    // Build Gemini-format contents — system instruction + conversation history
    const userMessages = req.messages ?? [{ role: 'user', content: 'Hello' }];

    // Gemini uses 'user' / 'model' roles (not 'assistant')
    const contents = userMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return {
      provider: 'gemini',
      message: content,
      model: DEFAULT_MODEL,
      sessionId: crypto.randomUUID(),
    };
  }
}
