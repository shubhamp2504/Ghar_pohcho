import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'gharpahucho_supabase_url';
const SUPABASE_ANON_KEY = 'gharpahucho_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string | null; anonKey: string | null } {
  if (typeof window === 'undefined') return { url: null, anonKey: null };

  const url =
    localStorage.getItem(SUPABASE_URL_KEY) ||
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
    null;

  const anonKey =
    localStorage.getItem(SUPABASE_ANON_KEY) ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    null;

  return { url, anonKey };
}

export function setSupabaseCredentials(url: string | null, anonKey: string | null): void {
  if (typeof window === 'undefined') return;

  if (url && anonKey) {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_ANON_KEY);
  }
  cachedClient = null; // Invalidate cached client
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey && url.startsWith('http')) {
    try {
      cachedClient = createClient(url, anonKey);
      return cachedClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return null;
}
