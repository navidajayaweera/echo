import { File } from 'expo-file-system';
import { useCallback, useEffect, useState } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MediaVaultRow, TimelineSection } from '@/lib/types/media-vault';
import { useAuth } from '@/providers/AuthProvider';

const BUCKET = 'media-vault';

export function useTimeline() {
  const { user } = useAuth();
  const [sections, setSections] = useState<TimelineSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: fetchErr } = await supabase
        .from('media_vault')
        .select('*')
        .eq('user_id', user.id)
        .order('memory_year', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      const rows = await Promise.all(
        (data ?? []).map(async (row: MediaVaultRow) => {
          if (row.public_url) return row;
          const { data: signed } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(row.storage_path, 3600);
          return { ...row, public_url: signed?.signedUrl ?? null };
        }),
      );

      // Group by year
      const byYear = new Map<number, MediaVaultRow[]>();
      for (const row of rows) {
        const list = byYear.get(row.memory_year) ?? [];
        list.push(row);
        byYear.set(row.memory_year, list);
      }

      const sectionsData: TimelineSection[] = Array.from(byYear.entries())
        .sort(([a], [b]) => b - a)
        .map(([year, items]) => ({ year, data: items }));

      setSections(sectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Upload ──────────────────────────────────────────────────────────────────

  const uploadMedia = useCallback(
    async (payload: {
      uri?: string;             // undefined for text-only notes
      mimeType?: string;
      fileName?: string;
      textContent?: string;     // populated for text notes (no file)
      mediaType: 'photo' | 'video' | 'voice' | 'letter' | 'document';
      title?: string;
      description?: string;
      memoryYear: number;
      memoryDate?: string;
    }) => {
      if (!user || !isSupabaseConfigured) return;

      setIsUploading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const isTextNote = !payload.uri && !!payload.textContent;

        const ext = isTextNote ? 'txt' : (payload.fileName?.split('.').pop() ?? 'bin');
        const storageName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const storagePath = `${user.id}/${storageName}`;
        const mimeType = isTextNote ? 'text/plain' : (payload.mimeType ?? 'application/octet-stream');

        let byteArray: Uint8Array;
        if (isTextNote) {
          // Encode the note text as UTF-8 bytes so it lives in Storage and is
          // retrievable by the AI embedding pipeline alongside other media.
          byteArray = new TextEncoder().encode(payload.textContent!);
        } else {
          const fileRef = new File(payload.uri!);
          const base64 = await fileRef.base64();
          byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        }

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, byteArray, { contentType: mimeType, upsert: false });

        if (uploadErr) throw uploadErr;

        const { error: dbErr } = await supabase.from('media_vault').insert({
          user_id: user.id,
          media_type: payload.mediaType,
          storage_path: storagePath,
          title: payload.title ?? (isTextNote ? 'Note' : (payload.fileName ?? null)),
          description: payload.description ?? null,
          memory_year: payload.memoryYear,
          memory_date: payload.memoryDate ?? null,
          metadata: {
            mime: mimeType,
            isNote: isTextNote,
            originalFileName: payload.fileName ?? null,
          },
        });

        if (dbErr) throw dbErr;

        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [user, refresh],
  );

  const deleteMedia = useCallback(
    async (row: MediaVaultRow) => {
      if (!user || !isSupabaseConfigured) return;

      const supabase = getSupabase();
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
      await supabase.from('media_vault').delete().eq('id', row.id);
      await refresh();
    },
    [user, refresh],
  );

  const totalCount = sections.reduce((n, s) => n + s.data.length, 0);

  return {
    sections,
    totalCount,
    isLoading,
    isUploading,
    error,
    refresh,
    uploadMedia,
    deleteMedia,
  };
}
