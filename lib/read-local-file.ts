import { File } from 'expo-file-system';

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Read a local content:// or file:// URI into bytes. */
export async function readLocalFileAsBytes(uri: string): Promise<Uint8Array> {
  const trimmed = uri.trim();
  if (!trimmed) {
    throw new Error('No file URI — pick the file again.');
  }

  // Expo File API first (reliable on native for gallery / document URIs).
  try {
    const fileRef = new File(trimmed);
    const base64 = await fileRef.base64();
    if (base64) return base64ToBytes(base64);
  } catch {
    // fall through to fetch
  }

  try {
    const response = await fetch(trimmed);
    if (!response.ok) {
      throw new Error(`Could not read file (HTTP ${response.status})`);
    }
    return new Uint8Array(await response.arrayBuffer());
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    throw new Error(`Could not read selected file: ${msg}`);
  }
}

/** Body shape accepted reliably by supabase-js storage.upload on RN + web. */
export function toStorageUploadBody(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Map to mime types allowed on the media-vault storage bucket. */
export function normalizeVaultMimeType(
  mime: string | undefined,
  mediaType: 'photo' | 'video' | 'voice' | 'letter' | 'document',
): string {
  const raw = (mime ?? '').toLowerCase().split(';')[0].trim();

  const allowed = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'application/pdf',
    'text/plain',
  ]);

  if (raw && allowed.has(raw)) return raw;
  if (raw === 'image/jpg') return 'image/jpeg';
  if (raw.startsWith('image/')) return 'image/jpeg';
  if (raw.startsWith('video/')) return 'video/mp4';
  if (raw.startsWith('audio/')) return 'audio/mpeg';

  switch (mediaType) {
    case 'photo':
    case 'letter':
      return 'image/jpeg';
    case 'video':
      return 'video/mp4';
    case 'voice':
      return 'audio/mpeg';
    case 'document':
      return raw.includes('pdf') ? 'application/pdf' : 'text/plain';
    default:
      return 'image/jpeg';
  }
}
