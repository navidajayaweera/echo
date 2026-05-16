import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createAdminClient, verifyUser } from '../_shared/supabase-admin.ts';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE = 400; // characters (approx 100 tokens)
const CHUNK_OVERLAP = 80;

// ── Text chunking ─────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    // Try to break at a sentence boundary
    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf('. ', end);
      if (sentenceEnd > start + CHUNK_SIZE / 2) {
        end = sentenceEnd + 2;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }

  return chunks.filter((c) => c.length > 20);
}

// ── OpenAI Embeddings ─────────────────────────────────────────────────────────

async function embedTexts(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embeddings error ${response.status}: ${err}`);
  }

  const data = await response.json();
  // Sort by index to ensure order is preserved
  return (data.data as { index: number; embedding: number[] }[])
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Accept calls from authenticated users OR service role (for background jobs)
    const authHeader = req.headers.get('Authorization');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const isServiceRole =
      authHeader === `Bearer ${serviceKey}`;

    let userId: string | null = null;
    if (!isServiceRole) {
      const user = await verifyUser(authHeader);
      userId = user.id;
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) throw new Error('OPENAI_API_KEY is not set');

    const { journal_id } = await req.json();
    if (!journal_id) throw new Error('journal_id is required');

    const supabase = createAdminClient();

    // 1. Fetch journal
    const { data: journal, error: journalErr } = await supabase
      .from('journals')
      .select('id, user_id, title, body, keywords, memory_year')
      .eq('id', journal_id)
      .maybeSingle();

    if (journalErr || !journal) {
      throw new Error(`Journal not found: ${journal_id}`);
    }

    // Enforce ownership when called by user JWT
    if (userId && journal.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    // 2. Skip if already embedded (idempotent)
    const { data: existing } = await supabase
      .from('journal_embeddings')
      .select('id')
      .eq('journal_id', journal_id)
      .limit(1);

    if (existing && existing.length > 0) {
      // Re-embed (force refresh) by deleting old chunks first
      await supabase
        .from('journal_embeddings')
        .delete()
        .eq('journal_id', journal_id);
    }

    // 3. Chunk body
    const fullText = [journal.title, journal.body].filter(Boolean).join('\n\n');
    const chunks = chunkText(fullText);

    // 4. Embed all chunks in one API call
    const embeddings = await embedTexts(chunks, openAiKey);

    // 5. Upsert embeddings
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

    if (insertErr) throw new Error(`Failed to store embeddings: ${insertErr.message}`);

    // 6. Mark journal as embedded
    await supabase
      .from('journals')
      .update({ is_embedded: true })
      .eq('id', journal_id);

    return json({ chunks_embedded: chunks.length, journal_id }, 200);
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
