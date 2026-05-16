import type {
  AIProvider,
  ChatMessage,
  LLMSessionResult,
  StartSessionRequest,
} from './types.ts';

const DEFAULT_MODEL = 'gpt-4o-mini';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;

  async run(req: StartSessionRequest, systemPrompt: string): Promise<LLMSessionResult> {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(req.messages ?? [{ role: 'user', content: 'Hello' }]),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        max_tokens: 512,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    return {
      provider: 'openai',
      message: content,
      model: data.model ?? DEFAULT_MODEL,
      sessionId: crypto.randomUUID(),
      usage: data.usage
        ? {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
          }
        : undefined,
    };
  }
}
