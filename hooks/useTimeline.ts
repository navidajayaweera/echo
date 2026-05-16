import { useCallback, useEffect, useState } from 'react';

import { feedMemoryToAvatar } from '@/lib/avatar-feed';
import { getErrorMessage } from '@/lib/error-message';
import { MEDIA_VAULT_LIST_COLUMNS } from '@/lib/media-vault-query';
import {
  normalizeVaultMimeType,
  readLocalFileAsBytes,
  toStorageUploadBody,
} from '@/lib/read-local-file';
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

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: fetchErr } = await supabase
        .from('media_vault')
        .select(MEDIA_VAULT_LIST_COLUMNS)
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
      setError(getErrorMessage(err, 'Failed to load memories'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadMedia = useCallback(
    async (payload: {
      uri?: string;
      mimeType?: string;
      fileName?: string;
      textContent?: string;
      mediaType: 'photo' | 'video' | 'voice' | 'letter' | 'document';
      title?: string;
      description?: string;
      memoryYear: number;
      memoryDate?: string;
    }) => {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env',
        );
      }
      if (!user) {
        throw new Error('Sign in to upload memories.');
      }
      setIsUploading(true);
      setError(null);

      let storagePath: string | null = null;

      try {
        const supabase = getSupabase();
        const isTextNote = !payload.uri && !!payload.textContent;

        const ext = isTextNote ? 'txt' : (payload.fileName?.split('.').pop() ?? 'bin');
        const storageName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        storagePath = `${user.id}/${storageName}`;
        const mimeType = isTextNote
          ? 'text/plain'
          : normalizeVaultMimeType(payload.mimeType, payload.mediaType);

        const byteArray = isTextNote
          ? new TextEncoder().encode(payload.textContent!)
          : await readLocalFileAsBytes(payload.uri!);

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, toStorageUploadBody(byteArray), {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadErr) throw uploadErr;

        const metadata: Record<string, unknown> = {
          mime: mimeType,
          isNote: isTextNote,
          originalFileName: payload.fileName ?? null,
          originalMime: payload.mimeType ?? null,
        };
        if (payload.memoryDate) {
          metadata.memoryDate = payload.memoryDate;
        }

        const row = {
          user_id: user.id,
          media_type: payload.mediaType,
          storage_path: storagePath,
          title: payload.title ?? (isTextNote ? 'Note' : (payload.fileName ?? null)),
          description: payload.description ?? null,
          memory_year: payload.memoryYear,
          metadata,
        };

        const { data: inserted, error: dbErr } = await supabase
          .from('media_vault')
          .insert(row)
          .select('id')
          .single();
        // #region agent log
        fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d7c109'},body:JSON.stringify({sessionId:'d7c109',runId:'upload-train-1',hypothesisId:'B',location:'hooks/useTimeline.ts:uploadMedia:insert',message:'Media vault insert completed',data:{insertedId:inserted?.id??null,hasDbError:Boolean(dbErr),dbErrorMessage:dbErr?.message??null,mediaType:payload.mediaType},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (dbErr) {
          throw dbErr;
        }

        if (inserted?.id) {
          // #region agent log
          fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d7c109'},body:JSON.stringify({sessionId:'d7c109',runId:'upload-train-1',hypothesisId:'B',location:'hooks/useTimeline.ts:uploadMedia:feedMemoryToAvatar',message:'Triggering memory embedding after upload',data:{insertedId:inserted.id},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          feedMemoryToAvatar(inserted.id).catch(() => {});
        }

        try {
          await refresh();
        } catch (refreshErr) {
          console.warn('[useTimeline] list refresh after upload:', refreshErr);
        }
      } catch (err) {
        if (storagePath) {
          try {
            const supabase = getSupabase();
            await supabase.storage.from(BUCKET).remove([storagePath]);
          } catch {
            // ignore cleanup errors
          }
        }
        const message = getErrorMessage(err, 'Upload failed');
        setError(message);
        throw new Error(message);
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
};
