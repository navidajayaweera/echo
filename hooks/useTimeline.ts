import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MediaVaultRow, TimelineSection, UploadMediaPayload } from '@/lib/types/media-vault';
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

      // Generate fresh signed URLs for items that don't have a cached public_url
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
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Upload ──────────────────────────────────────────────────────────────────

  const pickAndUpload = useCallback(
    async (memoryYear: number, title?: string) => {
      if (!user || !isSupabaseConfigured) return;

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Media library permission denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.85,
        allowsEditing: false,
        exif: true,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setIsUploading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const ext = asset.uri.split('.').pop() ?? 'jpg';
        const fileName = `${Date.now()}.${ext}`;
        const storagePath = `${user.id}/${fileName}`;
        const mimeType = asset.mimeType ?? `image/${ext}`;

        if (!asset.base64) throw new Error('Could not read file data');
        const byteArray = Uint8Array.from(atob(asset.base64), (c) => c.charCodeAt(0));

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, byteArray, { contentType: mimeType, upsert: false });

        if (uploadErr) throw uploadErr;

        const mediaType = mimeType.startsWith('video/') ? 'video' : 'photo';

        const { error: dbErr } = await supabase.from('media_vault').insert({
          user_id: user.id,
          media_type: mediaType,
          storage_path: storagePath,
          title: title ?? asset.fileName ?? null,
          memory_year: memoryYear,
          metadata: {
            width: asset.width,
            height: asset.height,
            duration: asset.duration ?? null,
            mime: mimeType,
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

  return {
    sections,
    isLoading,
    isUploading,
    error,
    refresh,
    pickAndUpload,
    deleteMedia,
  };
}
