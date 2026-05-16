import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyUser } from '../_shared/supabase-admin.ts';

const BEY_BASE = 'https://api.bey.dev';

interface BeyAvatarRow {
  id: string;
  name: string;
  status: string;
  visibility: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await verifyUser(req.headers.get('Authorization'));

    const apiKey = Deno.env.get('BEY_API_KEY') ?? Deno.env.get('BEYOND_PRESENCE_API_KEY');
    if (!apiKey) {
      return json({ error: 'BEY_API_KEY is not configured on the server' }, 500);
    }

    const url = new URL(req.url);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get('limit') ?? '30', 10) || 30),
    );
    const cursor = url.searchParams.get('cursor');

    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor) qs.set('cursor', cursor);

    const beyRes = await fetch(`${BEY_BASE}/v1/avatars?${qs}`, {
      headers: { 'x-api-key': apiKey },
    });

    if (!beyRes.ok) {
      const err = await beyRes.text();
      return json({ error: `Bey list avatars failed: ${beyRes.status} ${err}` }, 502);
    }

    const body = await beyRes.json() as {
      data: BeyAvatarRow[];
      has_more?: boolean;
      next_cursor?: string | null;
    };

    return json({
      avatars: body.data ?? [],
      has_more: body.has_more ?? false,
      next_cursor: body.next_cursor ?? null,
    }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return json({ error: message }, status);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
