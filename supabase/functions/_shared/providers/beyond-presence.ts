import type {
  AIProvider,
  BeyondPresenceSessionResult,
  ProviderRunOptions,
  StartSessionRequest,
} from './types.ts';

const BEY_BASE = 'https://api.bey.dev';

export class BeyondPresenceProvider implements AIProvider {
  readonly name = 'beyond_presence' as const;

  async run(
    _req: StartSessionRequest,
    _systemPrompt: string,
    options?: ProviderRunOptions,
  ): Promise<BeyondPresenceSessionResult> {
    const bpApiKey = Deno.env.get('BEY_API_KEY');

    if (!bpApiKey) {
      throw new Error(
        'BEY_API_KEY secret is not set. Run: npx supabase secrets set BEY_API_KEY=<your_key>',
      );
    }

    if (!options?.bpAgentId) {
      throw new Error(
        'Beyond Presence agent is not ready. Open Settings → pick a Ready Echo avatar, then start the session again.',
      );
    }

    const callRes = await fetch(`${BEY_BASE}/v1/calls`, {
      method: 'POST',
      headers: {
        'x-api-key': bpApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: options.bpAgentId,
        livekit_username: 'User',
      }),
    });

    if (!callRes.ok) {
      const err = await callRes.text();
      throw new Error(`Beyond Presence call error ${callRes.status}: ${err}`);
    }

    const data = await callRes.json() as {
      id: string;
      agent_id: string;
      livekit_url: string;
      livekit_token: string;
      started_at: string;
      ended_at: string | null;
    };

    return {
      provider: 'beyond_presence',
      livekit: {
        wsUrl: data.livekit_url,
        token: data.livekit_token,
        roomName: data.id,
      },
      sessionId: data.id,
      agentId: data.agent_id,
    };
  }
}
