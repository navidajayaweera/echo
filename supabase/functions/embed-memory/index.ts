import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { embedDocumentTexts } from '../_shared/gemini-embeddings.ts';
import { refreshAvatarKnowledge } from '../_shared/refresh-avatar-knowledge.ts';
import { chunkText } from '../_shared/text-chunking.ts';
import { createAdminClient, verifyUser } from '../_shared/supabase-admin.ts';

const MEDIA_BUCKET = 'media-vault';

async function loadMediaText(
  supabase: ReturnType<typeof createAdminClient>,
  storagePath: string,
  metadata: Record<string, unknown> | null,
): Promise<string | null> {
  const mime = typeof metadata?.mime === 'string' ? metadata.mime : '';
  const isNote = metadata?.isNote === true || mime.startsWith('text/');

  if (!isNote) return null;

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .download(storagePath);

  if (error || !data) {
    console.warn('[embed-memory] storage download failed:', error?.message);
    return null;
  }

  return await data.text();
}

function buildEmbedSource(row: {
  title: string | null;
  description: string | null;
  media_type: string;
  memory_year: number;
  memory_date: string | null;
  storageText: string | null;
}): string {
  const parts = [
    row.title,
    row.description,
    row.storageText,
    `Memory type: ${row.media_type}`,
    row.memory_date ? `Date: ${row.memory_date}` : `Year: ${row.memory_year}`,
  ].filter((p) => p && String(p).trim());

  return parts.join('\n\n').trim();
}

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

    const { media_id } = await req.json();
    if (!media_id) throw new Error('media_id is required');

    const supabase = createAdminClient();

    const { data: media, error: mediaErr } = await supabase
      .from('media_vault')
      .select('id, user_id, title, description, media_type, memory_year, memory_date, storage_path, metadata')
      .eq('id', media_id)
      .maybeSingle();

    if (mediaErr || !media) {
      throw new Error(`Memory not found: ${media_id}`);
    }

    if (userId && media.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    const metadata = (media.metadata ?? {}) as Record<string, unknown>;
    const storageText = await loadMediaText(
      supabase,
      media.storage_path,
      metadata,
    );

    let fullText = buildEmbedSource({
      title: media.title,
      description: media.description,
      media_type: media.media_type,
      memory_year: media.memory_year,
      memory_date: media.memory_date,
      storageText,
    });

    if (fullText.length < 12) {
      fullText = [
        media.title ?? 'Memory',
        `Type: ${media.media_type}`,
        media.memory_date ? `Date: ${media.memory_date}` : `Year: ${media.memory_year}`,
      ].join('. ');
    }

    await supabase
      .from('memory_embeddings')
      .delete()
      .eq('media_id', media_id);

    const chunks = chunkText(fullText);
    const embeddings = await embedDocumentTexts(chunks);

    const rows = chunks.map((chunk, i) => ({
      media_id: media.id,
      user_id: media.user_id,
      chunk_index: i,
      chunk_text: chunk,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: insertErr } = await supabase
      .from('memory_embeddings')
      .upsert(rows, { onConflict: 'media_id,chunk_index' });

    if (insertErr) {
      throw new Error(`Failed to store memory embeddings: ${insertErr.message}`);
    }

    await supabase
      .from('media_vault')
      .update({ is_embedded: true })
      .eq('id', media_id);

    const refresh = await refreshAvatarKnowledge(supabase, media.user_id);

    return json({
      chunks_embedded: chunks.length,
      media_id,
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
