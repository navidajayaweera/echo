import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export interface BeyAvatarListItem {
  id: string;
  name: string;
  status: string;
  visibility: string;
}

export interface ListBeyAvatarsResult {
  avatars: BeyAvatarListItem[];
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * Fetches avatars available to the Bey API key (public + this account's custom avatars).
 * Requires deployed edge function `list-bey-avatars`.
 */
export async function fetchBeyAvatars(options?: {
  limit?: number;
  cursor?: string | null;
}): Promise<ListBeyAvatarsResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error('Sign in to load Beyond Presence avatars');
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const qs = new URLSearchParams();
  if (options?.limit) qs.set('limit', String(options.limit));
  if (options?.cursor) qs.set('cursor', options.cursor);

  const url = `${supabaseUrl}/functions/v1/list-bey-avatars${qs.toString() ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  });

  const data = (await response.json()) as ListBeyAvatarsResult & { error?: string };

  if (!response.ok || data.error) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }

  return {
    avatars: data.avatars ?? [],
    has_more: data.has_more ?? false,
    next_cursor: data.next_cursor ?? null,
  };
}
