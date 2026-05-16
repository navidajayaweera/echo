import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { embedDocumentTexts } from '../_shared/gemini-embeddings.ts';
import { refreshAvatarKnowledge } from '../_shared/refresh-avatar-knowledge.ts';
import { chunkText } from '../_shared/text-chunking.ts';
import { createAdminClient, verifyUser } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const isServiceRole = authHeader === `Bearer ${serviceKey}`;

    let userId: string | null = null;
    if (!isServiceRole) {
      const user = await verifyUser(authHeader);
      userId = user.id;
    }

    const { journal_id } = await req.json();
    if (!journal_id) throw new Error('journal_id is required');

    const supabase = createAdminClient();

    const { data: journal, error: journalErr } = await supabase
      .from('journals')
      .select('id, user_id, title, body, keywords, memory_year')
      .eq('id', journal_id)
      .maybeSingle();

    if (journalErr || !journal) {
      throw new Error(`Journal not found: ${journal_id}`);
    }

    if (userId && journal.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    await supabase
      .from('journal_embeddings')
      .delete()
      .eq('journal_id', journal_id);

    const fullText = [journal.title, journal.body].filter(Boolean).join('\n\n');
    const chunks = chunkText(fullText);
    const embeddings = await embedDocumentTexts(chunks);

    const rows = chunks.map((chunk, i) => ({
      journal_id: journal.id,
      user_id: journal.user_id,
      chunk_index: i,
      chunk_text: chunk,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: insertErr } = await supabase
      .from('journal_embeddings')
      .upsert(rows, { onConflict: 'journal_id,chunk_index' });

    if (insertErr) {
      throw new Error(`Failed to store embeddings: ${insertErr.message}`);
    }

    await supabase
      .from('journals')
      .update({ is_embedded: true })
      .eq('id', journal_id);

    const refresh = await refreshAvatarKnowledge(supabase, journal.user_id);

    return json({
      chunks_embedded: chunks.length,
      journal_id,
      avatar_refreshed: true,
      agent_id: refresh.agentId,
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
