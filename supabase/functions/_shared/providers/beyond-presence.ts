// @ts-ignore — Deno import
import { AccessToken } from 'https://esm.sh/livekit-server-sdk@2';

import type {
  AIProvider,
  BeyondPresenceSessionResult,
  PersonaTraits,
  StartSessionRequest,
} from './types.ts';

export class BeyondPresenceProvider implements AIProvider {
  readonly name = 'beyond_presence' as const;

  async run(
    req: StartSessionRequest,
    systemPrompt: string,
  ): Promise<BeyondPresenceSessionResult> {
    const bpApiKey = Deno.env.get('BEYOND_PRESENCE_API_KEY');
    const lkApiKey = Deno.env.get('LIVEKIT_API_KEY');
    const lkApiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    const lkUrl = Deno.env.get('LIVEKIT_URL');

    if (!bpApiKey || !lkApiKey || !lkApiSecret || !lkUrl) {
      throw new Error(
        'Missing Beyond Presence / LiveKit secrets. Set BEYOND_PRESENCE_API_KEY, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL.',
      );
    }

    // 1. Create session with Beyond Presence API
    const bpResponse = await fetch('https://api.beyondpresence.ai/v1/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bpApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_prompt: systemPrompt,
        persona: req.persona_overrides ?? {},
      }),
    });

    if (!bpResponse.ok) {
      const err = await bpResponse.text();
      throw new Error(`Beyond Presence error ${bpResponse.status}: ${err}`);
    }

    const bpData = await bpResponse.json();
    const agentId: string = bpData.agent_id ?? bpData.id;
    const roomName: string = bpData.room_name ?? `echo-${crypto.randomUUID()}`;

    // 2. Mint a LiveKit participant token for the mobile client
    const participantIdentity = `user-${crypto.randomUUID()}`;
    const at = new AccessToken(lkApiKey, lkApiSecret, {
      identity: participantIdentity,
      ttl: '2h',
    });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return {
      provider: 'beyond_presence',
      livekit: { token, wsUrl: lkUrl, roomName },
      sessionId: crypto.randomUUID(),
      agentId,
    };
  }
}
