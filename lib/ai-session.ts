import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  SessionError,
  StartSessionRequest,
  StartSessionResult,
} from '@/lib/types/ai-session';

const FUNCTION_NAME = 'start-ai-session';

export async function callAISession(
  req: StartSessionRequest,
): Promise<StartSessionResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error('Not authenticated — sign in before starting a session');
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const url = `${supabaseUrl}/functions/v1/${FUNCTION_NAME}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(req),
  });

  const data: StartSessionResult | SessionError = await response.json();

  if (!response.ok || 'error' in data) {
    throw new Error(
      (data as SessionError).error ?? `HTTP ${response.status}`,
    );
  }

  return data as StartSessionResult;
}
