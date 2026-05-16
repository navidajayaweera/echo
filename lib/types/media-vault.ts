export type MediaType = 'photo' | 'letter' | 'voice' | 'video' | 'document';

export interface MediaVaultRow {
  id: string;
  user_id: string;
  journal_id: string | null;
  media_type: MediaType;
  storage_path: string;
  public_url: string | null;
  title: string | null;
  description: string | null;
  memory_year: number;
  memory_date: string | null;
  keywords: string[];
  is_embedded: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TimelineSection {
  year: number;
  data: MediaVaultRow[];
}

export interface UploadMediaPayload {
  uri: string;
  mimeType: string;
  fileName: string;
  mediaType: MediaType;
  title?: string;
  description?: string;
  memoryYear: number;
  memoryDate?: string;
}
