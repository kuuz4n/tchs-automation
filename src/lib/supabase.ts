import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getCredentials(): { url: string; key: string } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  let finalUrl = envUrl;
  let finalKey = envKey;

  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('tchs_supabase_url');
    const customKey = localStorage.getItem('tchs_supabase_key');
    if (customUrl && customKey) {
      finalUrl = customUrl;
      finalKey = customKey;
    }
  }

  // Normalize URL
  finalUrl = finalUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  finalKey = finalKey.trim();

  return { url: finalUrl, key: finalKey };
}

const { url, key } = getCredentials();

export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  url.startsWith('https://') &&
  !url.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, key)
  : null;

export function getActiveSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const creds = getCredentials();
  const configured = Boolean(
    creds.url &&
    creds.key &&
    creds.url.startsWith('https://') &&
    !creds.url.includes('your-project-id')
  );
  return { ...creds, isConfigured: configured };
}

export function saveSupabaseConfig(urlInput: string, keyInput: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tchs_supabase_url', urlInput.trim());
  localStorage.setItem('tchs_supabase_key', keyInput.trim());
  window.location.reload();
}
