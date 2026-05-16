const BEY_BASE = 'https://api.bey.dev';

function beyHeaders(apiKey: string): Record<string, string> {
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
}

function resolveAvatarId(profileAvatarId: string | null | undefined): string | null {
  const fromProfile = profileAvatarId?.trim();
  if (fromProfile) return fromProfile;

  const fallback = Deno.env.get('BEY_DEFAULT_AVATAR_ID')?.trim();
  if (fallback) return fallback;

  return null;
}

export interface UpsertAgentOptions {
  /** Bey avatar UUID for this user (from GET /v1/avatars or dashboard). */
  profileAvatarId?: string | null;
}

/**
 * Create or update a Beyond Presence agent with the latest memory-grounded prompt.
 * Uses api.bey.dev with x-api-key auth.
 */
export async function upsertBeyondPresenceAgent(
  apiKey: string,
  systemPrompt: string,
  existingAgentId?: string | null,
  options?: UpsertAgentOptions,
): Promise<string> {
  const trimmed = systemPrompt.slice(0, 10_000);
  const avatarId = resolveAvatarId(options?.profileAvatarId ?? null);

  if (existingAgentId) {
    const patchBody: Record<string, unknown> = { system_prompt: trimmed };
    if (avatarId) {
      patchBody.avatar_id = avatarId;
    }

    const patchRes = await fetch(
      `${BEY_BASE}/v1/agents/${existingAgentId}`,
      {
        method: 'PATCH',
        headers: beyHeaders(apiKey),
        body: JSON.stringify(patchBody),
      },
    );

    if (patchRes.ok || patchRes.status === 204) {
      return existingAgentId;
    }

    const patchErr = await patchRes.text();
    console.warn(
      `[beyond-presence-agent] PATCH failed (${patchRes.status}), creating new agent:`,
      patchErr,
    );
  }

  if (!avatarId) {
    throw new Error(
      'No Beyond Presence avatar is linked to this profile. Open Settings → Echo avatar and pick one from your Bey account, or set BEY_DEFAULT_AVATAR_ID on the server as a fallback.',
    );
  }

  const createRes = await fetch(`${BEY_BASE}/v1/agents`, {
    method: 'POST',
    headers: beyHeaders(apiKey),
    body: JSON.stringify({
      name: 'Echo Memory Companion',
      avatar_id: avatarId,
      system_prompt: trimmed,
      greeting: "Hello, I'm here with you. Take your time — let's remember together.",
      language: 'en',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Beyond Presence agent create error ${createRes.status}: ${err}`);
  }

  const data = await createRes.json();
  return data.id as string;
}
