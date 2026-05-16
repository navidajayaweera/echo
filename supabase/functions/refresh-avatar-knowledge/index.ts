import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { refreshAvatarKnowledge } from '../_shared/refresh-avatar-knowledge.ts';
import { createAdminClient, verifyUser } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const user = await verifyUser(req.headers.get('Authorization'));
    const supabase = createAdminClient();
    const result = await refreshAvatarKnowledge(supabase, user.id);

    return json({
      agent_id: result.agentId,
      memories_in_prompt: result.memoryCount,
      updated_at: new Date().toISOString(),
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
