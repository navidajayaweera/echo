/** Extract a human-readable message from Supabase / network errors. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message) return o.message;
    if (typeof o.error === 'string' && o.error) return o.error;
    if (typeof o.error_description === 'string') return o.error_description;
    if (typeof o.details === 'string' && o.details) return o.details;
  }
  return fallback;
}
