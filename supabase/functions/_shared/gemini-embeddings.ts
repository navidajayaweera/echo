/** Gemini text embeddings — must match `journal_embeddings.embedding vector(1536)`. */
export const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 1536;

export type GeminiEmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

function getGeminiApiKey(): string {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return apiKey;
}

function buildEmbedRequest(text: string, taskType: GeminiEmbeddingTaskType) {
  return {
    model: `models/${GEMINI_EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    taskType,
    outputDimensionality: EMBEDDING_DIMENSIONS,
  };
}

function extractValues(embedding: { values?: number[] } | undefined): number[] {
  if (!embedding?.values || !Array.isArray(embedding.values)) {
    throw new Error('Gemini embedding response missing values');
  }
  return embedding.values;
}

/** Embed a single query string (semantic search). */
export async function embedQueryText(text: string): Promise<number[]> {
  const apiKey = getGeminiApiKey();
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEmbedRequest(text, 'RETRIEVAL_QUERY')),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini embeddings error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return extractValues(data.embedding);
}

/** Embed multiple document chunks (journal ingestion). */
export async function embedDocumentTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = getGeminiApiKey();

  if (texts.length === 1) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEmbedRequest(texts[0], 'RETRIEVAL_DOCUMENT')),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini embeddings error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return [extractValues(data.embedding)];
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((text) => buildEmbedRequest(text, 'RETRIEVAL_DOCUMENT')),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini batch embeddings error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const embeddings = data.embeddings as Array<{ values?: number[] }> | undefined;
  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error('Gemini batch embeddings returned unexpected result count');
  }

  return embeddings.map((item) => extractValues(item));
}
